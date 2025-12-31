
package com.hdc.hdc_map_backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/geodata")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class IntersectionController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/intersection")
    public ResponseEntity<?> performIntersection(@RequestBody IntersectionRequest request) {
        long startTime = System.currentTimeMillis();
        System.out.println("=== INTERSECTION REQUEST START ===");
        try {
            List<String> tableIds = request.getTableIds();
            if (tableIds == null || tableIds.size() < 2) {
                return ResponseEntity.badRequest().body("At least 2 table IDs are required for intersection");
            }

            for (String tableId : tableIds) {
                if (!isValidTableName(tableId)) {
                    return ResponseEntity.badRequest().body("Invalid table name: " + tableId);
                }
            }

            Map<String, Integer> featureCounts = getFeatureCounts(request);
            long totalFeatures = featureCounts.values().stream().mapToLong(Integer::longValue).sum();

            List<Map<String, Object>> results = performIntersectionWithGrid(request, totalFeatures);

            if (tableIds.contains("parcel_address_area")) {
                enrichParcelData(results);
            }

            Map<String, Object> featureCollection = new HashMap<>();
            featureCollection.put("type", "FeatureCollection");
            featureCollection.put("features", results);

            IntersectionResponse response = new IntersectionResponse(featureCollection, featureCounts);

            long totalTime = System.currentTimeMillis() - startTime;
            System.out.println("=== INTERSECTION REQUEST COMPLETE - Total time: " + totalTime + "ms ====");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error performing intersection: " + e.getMessage());
        }
    }

    private Map<String, Integer> getFeatureCounts(IntersectionRequest request) {
        Map<String, Integer> featureCounts = new HashMap<>();
        if (request.getBbox() != null) {
            for (String tableId : request.getTableIds()) {
                String countSql = String.format(
                        "SELECT COUNT(*) FROM %s WHERE geom && ST_MakeEnvelope(%f, %f, %f, %f, 4326)",
                        tableId, request.getBbox().getMinLng(), request.getBbox().getMinLat(),
                        request.getBbox().getMaxLng(), request.getBbox().getMaxLat());
                Integer count = jdbcTemplate.queryForObject(countSql, Integer.class);
                featureCounts.put(tableId, count);
            }
        }
        return featureCounts;
    }

    private List<Map<String, Object>> performIntersectionWithGrid(IntersectionRequest request, long totalFeatures) {
        int gridSize = 1;
        if (totalFeatures > 5000)
            gridSize = 2;
        if (totalFeatures > 10000)
            gridSize = 4;
        if (totalFeatures > 20000)
            gridSize = 8;

        System.out.println("Total features: " + totalFeatures + ", using grid size: " + gridSize + "x" + gridSize);

        if (request.getBbox() == null) {
            String query = buildIntersectionQuery(request);
            return jdbcTemplate.query(query, (rs, rowNum) -> {
                Map<String, Object> feature = new HashMap<>();
                feature.put("type", "Feature");
                feature.put("geometry", parseGeoJSON(rs.getString("geojson")));
                feature.put("properties", parseProperties(rs.getString("properties")));
                return feature;
            });
        }

        Set<String> uniqueFeatures = new HashSet<>();
        List<Map<String, Object>> allResults = new ArrayList<>();
        BoundingBox originalBbox = request.getBbox();
        double cellWidth = (originalBbox.getMaxLng() - originalBbox.getMinLng()) / gridSize;
        double cellHeight = (originalBbox.getMaxLat() - originalBbox.getMinLat()) / gridSize;

        for (int i = 0; i < gridSize; i++) {
            for (int j = 0; j < gridSize; j++) {
                System.out.println("Processing grid cell (" + i + "," + j + ")");
                BoundingBox cellBbox = new BoundingBox();
                cellBbox.setMinLng(originalBbox.getMinLng() + i * cellWidth);
                cellBbox.setMaxLng(originalBbox.getMinLng() + (i + 1) * cellWidth);
                cellBbox.setMinLat(originalBbox.getMinLat() + j * cellHeight);
                cellBbox.setMaxLat(originalBbox.getMinLat() + (j + 1) * cellHeight);
                System.out.println("Cell bbox: " + cellBbox);

                IntersectionRequest cellRequest = new IntersectionRequest();
                cellRequest.setTableIds(request.getTableIds());
                cellRequest.setBbox(cellBbox);
                cellRequest.setFilters(request.getFilters());

                String query = buildIntersectionQuery(cellRequest);
                List<Map<String, Object>> cellResults = jdbcTemplate.query(query, (rs, rowNum) -> {
                    Map<String, Object> feature = new HashMap<>();
                    feature.put("type", "Feature");
                    feature.put("geometry", parseGeoJSON(rs.getString("geojson")));
                    feature.put("properties", parseProperties(rs.getString("properties")));
                    return feature;
                });

                System.out.println("Found " + cellResults.size() + " results in cell (" + i + "," + j + ")");

                for (Map<String, Object> feature : cellResults) {
                    String propertiesString = feature.get("properties").toString();
                    if (uniqueFeatures.add(propertiesString)) {
                        allResults.add(feature);
                    }
                }
            }
        }
        System.out.println("Total unique features found: " + allResults.size());
        return allResults;
    }

    private void enrichParcelData(List<Map<String, Object>> results) {
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (Map<String, Object> feature : results) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                Map<String, Object> properties = (Map<String, Object>) feature.get("properties");
                if (properties != null && properties.containsKey("parcel_address_area")) {
                    Map<String, Object> parcelProperties = (Map<String, Object>) properties.get("parcel_address_area");
                    if (parcelProperties != null && parcelProperties.containsKey("pin")) {
                        String pin = (String) parcelProperties.get("pin");
                        try {
                            String url = "https://gismaps.kingcounty.gov/parcelviewer2/pvinfoquery.ashx?pin=" + pin;
                            String response = restTemplate.getForObject(url, String.class);
                            Map<String, Object> parcelData = objectMapper.readValue(response, new TypeReference<>() {
                            });
                            if (parcelData.containsKey("items")) {
                                List<Map<String, Object>> items = (List<Map<String, Object>>) parcelData.get("items");
                                if (!items.isEmpty()) {
                                    parcelProperties.putAll(items.get(0));
                                }
                            }
                        } catch (Exception e) {
                            System.err.println("Error fetching parcel data for pin " + pin + ": " + e.getMessage());
                        }
                    }
                }
            });
            futures.add(future);
        }
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }

    private String buildIntersectionQuery(IntersectionRequest request) {
        if (request.getTableIds().size() == 2) {
            return buildTwoTableIntersection(request.getTableIds().get(0), request.getTableIds().get(1), request);
        } else {
            return buildMultiTableIntersection(request);
        }
    }

    private String buildTwoTableIntersection(String table1, String table2, IntersectionRequest request) {
        String t1Alias = "t1";
        String t2Alias = "t2";

        String propertiesJson = String.format(
                "jsonb_build_object('%s', to_jsonb(%s) - 'geom', '%s', to_jsonb(%s) - 'geom')", table1, t1Alias, table2,
                t2Alias);

        StringBuilder fromClause = new StringBuilder();
        fromClause.append(String.format(" FROM %s %s JOIN %s %s ON ST_Intersects(%s.geom, %s.geom)", table1, t1Alias,
                table2, t2Alias, t1Alias, t2Alias));

        StringBuilder whereClause = new StringBuilder();
        whereClause.append(String.format(" WHERE NOT ST_IsEmpty(ST_Intersection(%s.geom, %s.geom))", t1Alias, t2Alias));

        if (request.getBbox() != null) {
            BoundingBox bbox = request.getBbox();
            whereClause.append(String.format(
                    " AND ST_Intersects(%s.geom, ST_MakeEnvelope(%f, %f, %f, %f, 4326))" +
                            " AND ST_Intersects(%s.geom, ST_MakeEnvelope(%f, %f, %f, %f, 4326))",
                    t1Alias, bbox.getMinLng(), bbox.getMinLat(), bbox.getMaxLng(), bbox.getMaxLat(),
                    t2Alias, bbox.getMinLng(), bbox.getMinLat(), bbox.getMaxLng(), bbox.getMaxLat()));
        }

        addFilters(table1, t1Alias, request, whereClause);
        addFilters(table2, t2Alias, request, whereClause);

        return String.format(
                "WITH intersection_result AS (" +
                        "  SELECT " +
                        "    ST_Intersection(%s.geom, %s.geom) as intersection_geom, " +
                        "    %s as properties" +
                        "  %s %s" +
                        ") " +
                        "SELECT ST_AsGeoJSON(intersection_geom) as geojson, properties::text FROM intersection_result "
                        +
                        "WHERE NOT ST_IsEmpty(intersection_geom)",
                t1Alias, t2Alias, propertiesJson, fromClause.toString(), whereClause.toString());
    }

    private String buildMultiTableIntersection(IntersectionRequest request) {
        StringBuilder query = new StringBuilder();
        List<String> tableIds = request.getTableIds();

        String table1 = tableIds.get(0);
        String table2 = tableIds.get(1);

        String initialProperties = String
                .format("jsonb_build_object('%s', to_jsonb(t1) - 'geom', '%s', to_jsonb(t2) - 'geom')", table1, table2);

        StringBuilder step1From = new StringBuilder();
        step1From.append(String.format("FROM %s t1 JOIN %s t2 ON ST_Intersects(t1.geom, t2.geom)", table1, table2));

        StringBuilder step1Where = new StringBuilder();
        step1Where.append(" WHERE NOT ST_IsEmpty(ST_Intersection(t1.geom, t2.geom))");

        if (request.getBbox() != null) {
            BoundingBox bbox = request.getBbox();
            step1Where.append(String.format(
                    " AND ST_Intersects(t1.geom, ST_MakeEnvelope(%f, %f, %f, %f, 4326))" +
                            " AND ST_Intersects(t2.geom, ST_MakeEnvelope(%f, %f, %f, %f, 4326))",
                    bbox.getMinLng(), bbox.getMinLat(), bbox.getMaxLng(), bbox.getMaxLat(),
                    bbox.getMinLng(), bbox.getMinLat(), bbox.getMaxLng(), bbox.getMaxLat()));
        }
        addFilters(table1, "t1", request, step1Where);
        addFilters(table2, "t2", request, step1Where);

        query.append("WITH step1 AS (")
                .append("SELECT ST_Intersection(t1.geom, t2.geom) as intersection_geom, ")
                .append(initialProperties).append(" as properties ")
                .append(step1From).append(step1Where)
                .append(")");

        for (int i = 2; i < tableIds.size(); i++) {
            String prevStep = "step" + (i - 1);
            String currentStep = "step" + i;
            String nextTable = tableIds.get(i);
            String mergedProperties = String
                    .format("prev.properties || jsonb_build_object('%s', to_jsonb(next) - 'geom')", nextTable);

            StringBuilder stepNWhere = new StringBuilder();
            stepNWhere.append(" WHERE NOT ST_IsEmpty(ST_Intersection(prev.intersection_geom, next.geom))");

            if (request.getBbox() != null) {
                BoundingBox bbox = request.getBbox();
                stepNWhere.append(String.format(
                        " AND ST_Intersects(next.geom, ST_MakeEnvelope(%f, %f, %f, %f, 4326))",
                        bbox.getMinLng(), bbox.getMinLat(), bbox.getMaxLng(), bbox.getMaxLat()));
            }
            addFilters(nextTable, "next", request, stepNWhere);

            query.append(", ").append(currentStep).append(" AS (")
                    .append("SELECT ST_Intersection(prev.intersection_geom, next.geom) as intersection_geom, ")
                    .append(mergedProperties).append(" as properties ")
                    .append("FROM ").append(prevStep).append(" prev JOIN ").append(nextTable)
                    .append(" next ON ST_Intersects(prev.intersection_geom, next.geom)")
                    .append(stepNWhere)
                    .append(")");
        }

        String finalStep = "step" + (tableIds.size() - 1);
        query.append(" SELECT ST_AsGeoJSON(intersection_geom) as geojson, properties::text FROM ").append(finalStep)
                .append(" WHERE NOT ST_IsEmpty(intersection_geom)");

        return query.toString();
    }

    private void addFilters(String tableName, String tableAlias, IntersectionRequest request,
            StringBuilder whereClause) {
        if (request.getFilters() != null && request.getFilters().containsKey(tableName)) {
            Map<String, List<String>> tableFilters = request.getFilters().get(tableName);
            for (Map.Entry<String, List<String>> entry : tableFilters.entrySet()) {
                String columnName = entry.getKey();
                List<String> values = entry.getValue();
                if (values != null && !values.isEmpty()) {
                    String inClause = values.stream().map(v -> "'" + v + "'").collect(Collectors.joining(","));
                    whereClause.append(String.format(" AND %s.%s IN (%s)", tableAlias, columnName, inClause));
                }
            }
        }
    }

    private boolean isValidTableName(String tableName) {
        return tableName != null && tableName.matches("^[a-zA-Z0-9_]+$");
    }

    private Object parseGeoJSON(String geojson) {
        try {
            if (geojson == null || geojson.trim().isEmpty()) {
                return null;
            }
            return objectMapper.readValue(geojson, Object.class);
        } catch (Exception e) {
            System.err.println("Error parsing GeoJSON: " + e.getMessage());
            return null;
        }
    }

    private Object parseProperties(String propertiesJson) {
        try {
            if (propertiesJson == null || propertiesJson.trim().isEmpty()) {
                return new HashMap<>();
            }
            return objectMapper.readValue(propertiesJson, Object.class);
        } catch (Exception e) {
            System.err.println("Error parsing properties JSON: " + e.getMessage());
            return new HashMap<>();
        }
    }

    public static class IntersectionRequest {
        private List<String> tableIds;
        private BoundingBox bbox;
        private Map<String, Map<String, List<String>>> filters;

        public List<String> getTableIds() {
            return tableIds;
        }

        public void setTableIds(List<String> tableIds) {
            this.tableIds = tableIds;
        }

        public BoundingBox getBbox() {
            return bbox;
        }

        public void setBbox(BoundingBox bbox) {
            this.bbox = bbox;
        }

        public Map<String, Map<String, List<String>>> getFilters() {
            return filters;
        }

        public void setFilters(Map<String, Map<String, List<String>>> filters) {
            this.filters = filters;
        }
    }

    public static class BoundingBox {
        private double minLng;
        private double minLat;
        private double maxLng;
        private double maxLat;

        public double getMinLng() {
            return minLng;
        }

        public void setMinLng(double minLng) {
            this.minLng = minLng;
        }

        public double getMinLat() {
            return minLat;
        }

        public void setMinLat(double minLat) {
            this.minLat = minLat;
        }

        public double getMaxLng() {
            return maxLng;
        }

        public void setMaxLng(double maxLng) {
            this.maxLng = maxLng;
        }

        public double getMaxLat() {
            return maxLat;
        }

        public void setMaxLat(double maxLat) {
            this.maxLat = maxLat;
        }
    }

    public static class IntersectionResponse {
        private Map<String, Object> featureCollection;
        private Map<String, Integer> featureCounts;

        public IntersectionResponse(Map<String, Object> featureCollection, Map<String, Integer> featureCounts) {
            this.featureCollection = featureCollection;
            this.featureCounts = featureCounts;
        }

        public Map<String, Object> getFeatureCollection() {
            return featureCollection;
        }

        public void setFeatureCollection(Map<String, Object> featureCollection) {
            this.featureCollection = featureCollection;
        }

        public Map<String, Integer> getFeatureCounts() {
            return featureCounts;
        }

        public void setFeatureCounts(Map<String, Integer> featureCounts) {
            this.featureCounts = featureCounts;
        }
    }
}
