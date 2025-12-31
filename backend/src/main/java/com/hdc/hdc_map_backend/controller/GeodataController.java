package com.hdc.hdc_map_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/geodata")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class GeodataController {

    private static final Map<Integer, Double> ZOOM_LEVEL_THRESHOLDS = Map.ofEntries(
            Map.entry(8, 0.0001),
            Map.entry(9, 0.00005),
            Map.entry(10, 0.000025),
            Map.entry(11, 0.00001),
            Map.entry(12, 0.000005),
            Map.entry(13, 0.0000025));
    private static final double DEFAULT_CLUSTERING_THRESHOLD = 0.000001;

    private static final Map<Integer, Double> MIN_DISPLAY_AREA_THRESHOLDS = Map.ofEntries(
            Map.entry(8, 0.00001),
            Map.entry(9, 0.000005),
            Map.entry(10, 0.0000025),
            Map.entry(11, 0.000001),
            Map.entry(12, 0.0000005),
            Map.entry(13, 0.00000025));
    private static final double DEFAULT_DISPLAY_THRESHOLD = 0.0;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/{tableId}")
    public ResponseEntity<String> getTableDataAsGeoJson(
            @PathVariable String tableId,
            @RequestParam(required = false) String bbox,
            @RequestParam(defaultValue = "10") int zoom) {

        try {
            if (!isValidTableName(tableId)) {
                return ResponseEntity.badRequest().body("{\"error\": \"Invalid table name\"}");
            }

            String sql;
            String geoJson;

            if (bbox != null && !bbox.isEmpty()) {
                String[] coords = bbox.split(",");
                double minX = Double.parseDouble(coords[0]);
                double minY = Double.parseDouble(coords[1]);
                double maxX = Double.parseDouble(coords[2]);
                double maxY = Double.parseDouble(coords[3]);

                double tolerance = switch (zoom) {
                    case 4 -> 0.05;
                    case 5 -> 0.025;
                    case 6 -> 0.015;
                    case 7 -> 0.01;
                    case 8 -> 0.005;
                    case 9 -> 0.0025;
                    case 10 -> 0.001;
                    case 11 -> 0.0005;
                    case 12 -> 0.0002;
                    case 13 -> 0.0001;
                    default -> 0.0;
                };

                int featureLimit = switch (zoom) {
                    case 4, 5, 6, 7 -> 20000;
                    case 8, 9, 10 -> 15000;
                    case 11, 12, 13 -> 10000;
                    default -> 10000;
                };

                if (zoom <= 13) {
                    double clusteringThreshold = ZOOM_LEVEL_THRESHOLDS.getOrDefault(zoom, DEFAULT_CLUSTERING_THRESHOLD);
                    double displayThreshold = MIN_DISPLAY_AREA_THRESHOLDS.getOrDefault(zoom, DEFAULT_DISPLAY_THRESHOLD);

                    sql = """
                            WITH features_in_bbox AS (
                                SELECT ogc_fid, geom, ST_Area(geom) as area, to_jsonb(t.*) as props
                                FROM %s t
                                WHERE geom && ST_MakeEnvelope(%f, %f, %f, %f, 4326)
                                LIMIT %d
                            ),
                            small_features AS (
                                SELECT *, ST_ClusterDBSCAN(geom, eps := 0, minpoints := 2) OVER () as cluster_id
                                FROM features_in_bbox
                                WHERE area < %f
                            ),
                            large_features AS (
                                SELECT ogc_fid, geom, area, props
                                FROM features_in_bbox
                                WHERE area >= %f
                            ),
                            clustered_small_features AS (
                                SELECT
                                    ST_Union(geom) as geom,
                                    jsonb_build_object(
                                        'is_cluster', true,
                                        'feature_count', count(*),
                                        'total_area', sum(area)
                                    ) as props
                                FROM small_features
                                WHERE cluster_id IS NOT NULL
                                GROUP BY cluster_id
                            ),
                            unclustered_small_features AS (
                                SELECT geom, props || '{"is_cluster": false}'::jsonb as props
                                FROM small_features
                                WHERE cluster_id IS NULL
                            ),
                            all_geoms AS (
                                SELECT geom, props FROM clustered_small_features
                                UNION ALL
                                SELECT geom, props || '{"is_cluster": false}'::jsonb FROM large_features
                                UNION ALL
                                SELECT geom, props FROM unclustered_small_features
                            ),
                            final_geoms AS (
                                SELECT * FROM all_geoms WHERE ST_Area(geom) >= %f
                            )
                            -- UPDATED: Final select is now robust against empty results.
                            SELECT COALESCE(
                                jsonb_build_object(
                                    'type', 'FeatureCollection',
                                    'features', COALESCE(jsonb_agg(
                                        jsonb_build_object(
                                            'type', 'Feature',
                                            'geometry', ST_AsGeoJSON(ST_Simplify(geom, %f))::jsonb,
                                            'properties', props - 'geom'
                                        )
                                    ), '[]'::jsonb)
                                )::text,
                                '{"type": "FeatureCollection", "features": []}'
                            ) as geojson
                            FROM final_geoms
                            """.formatted(
                            tableId, minX, minY, maxX, maxY, featureLimit,
                            clusteringThreshold,
                            clusteringThreshold,
                            displayThreshold,
                            tolerance);
                } else {
                    String geometryExpression = "ST_AsGeoJSON(geom)::jsonb";
                    sql = """
                            SELECT jsonb_build_object(
                                'type', 'FeatureCollection',
                                'features', jsonb_agg(
                                    jsonb_build_object(
                                        'type', 'Feature',
                                        'geometry', %s,
                                        'properties', to_jsonb(row) - 'geom'
                                    )
                                )
                            )::text as geojson
                            FROM (
                                SELECT * FROM %s
                                WHERE geom && ST_MakeEnvelope(%f, %f, %f, %f, 4326)
                                ORDER BY ST_Area(geom) DESC
                                LIMIT %d
                            ) row
                            """.formatted(geometryExpression, tableId, minX, minY, maxX, maxY, featureLimit);
                }
            } else {
                sql = """
                        SELECT jsonb_build_object('type', 'FeatureCollection', 'features', '[]')::text as geojson
                        """;
            }

            geoJson = jdbcTemplate.queryForObject(sql, String.class);
            return ResponseEntity.ok(geoJson);

        } catch (Exception e) {
            System.err.println("Error executing SQL query for table: " + tableId);
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"Database query failed: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/proxy/parcel-info")
    public ResponseEntity<String> getParcelInfo(@RequestParam String pin) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://gismaps.kingcounty.gov/parcelviewer2/pvinfoquery.ashx?pin=" + pin;
            String result = restTemplate.getForObject(url, String.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"Failed to fetch parcel info: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Query all data layers that contain a given point (lat/lng)
     * Returns features from all available tables that intersect with the point
     */
    @GetMapping("/point-features")
    public ResponseEntity<?> getPointFeatures(
            @RequestParam double lat,
            @RequestParam double lng) {
        try {
            // List of all available data layer tables
            String[] tables = {
                    "public.ca_wa_counties",
                    "public.ca_wa_oz",
                    "public.ca_wa_tracts",
                    "public.difficult_development_area",
                    "public.eig_oz_lgbl",
                    "public.fmr_zipcode",
                    "public.frequent_transit_area",
                    "public.hacla_delta",
                    "public.hacla_vps",
                    "public.hoa",
                    "public.hoa_affh",
                    "public.la_seattle_council_districts",
                    "public.mha",
                    "public.parcel_address_area",
                    "public.qualified_census_tract",
                    "public.safmr_zipcode",
                    "public.seattle_zoning_code",
                    "public.urban_villages",
                    "public.us_cities",
                    "public.usda",
            };

            java.util.List<Map<String, Object>> results = new java.util.ArrayList<>();

            for (String tableName : tables) {
                try {
                    // Check if table exists and query for features containing this point
                    String sql = """
                            SELECT
                                '%s' as layer_id,
                                to_jsonb(t.*) - 'geom' - 'geometry' as properties
                            FROM %s t
                            WHERE ST_Contains(t.geom, ST_SetSRID(ST_MakePoint(%f, %f), 4326))
                            LIMIT 1
                            """.formatted(tableName, tableName, lng, lat);

                    java.util.List<Map<String, Object>> features = jdbcTemplate.queryForList(sql);

                    for (Map<String, Object> feature : features) {
                        Map<String, Object> result = new java.util.HashMap<>();
                        result.put("layerId", tableName);
                        result.put("layerName", formatLayerName(tableName));
                        result.put("properties", feature.get("properties"));
                        results.add(result);
                    }
                } catch (Exception e) {
                    // Skip tables that don't exist or have errors
                    System.err.println("Skipping table " + tableName + ": " + e.getMessage());
                }
            }

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            System.err.println("Error querying point features: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to query point features: " + e.getMessage()));
        }
    }

    /**
     * Format table name for display
     */
    private String formatLayerName(String tableName) {
        return java.util.Arrays.stream(tableName.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                .collect(java.util.stream.Collectors.joining(" "));
    }

    private boolean isValidTableName(String tableName) {
        return tableName != null && tableName.matches("^[a-zA-Z0-9_-]+$");
    }
}