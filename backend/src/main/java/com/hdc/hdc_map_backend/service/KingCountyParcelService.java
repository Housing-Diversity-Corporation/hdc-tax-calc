package com.hdc.hdc_map_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KingCountyParcelService {

    private static final Logger logger = LoggerFactory.getLogger(KingCountyParcelService.class);
    private static final String PARCEL_INFO_URL = "https://gismaps.kingcounty.gov/parcelviewer2/pvinfoquery.ashx";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Get parcel data by address (uses coordinates internally)
     */
    @Cacheable(value = "parcelData", key = "#address")
    public Map<String, Object> getParcelDataByAddress(String address) {
        // For now, we'll return empty response since we need coordinates
        // The frontend will provide coordinates which work better
        logger.info("Address-based search requested for: {}", address);
        return createEmptyResponse("Please use coordinates for accurate parcel data");
    }

    /**
     * Get parcel data by coordinates - queries local database first for PIN
     */
    @Cacheable(value = "parcelData", key = "#lat + '-' + #lng")
    public Map<String, Object> getParcelDataByCoordinates(Double lat, Double lng) {
        try {
            logger.info("Fetching parcel data for coordinates: {}, {}", lat, lng);

            // First, query our local King County parcels database to get the PIN
            String pin = getPinFromLocalDatabase(lat, lng);

            if (pin != null && !pin.isEmpty()) {
                logger.info("Found PIN {} for coordinates {}, {}", pin, lat, lng);
                // Fetch detailed parcel info using the PIN
                return fetchParcelDataFromKingCounty(pin);
            }

            logger.warn("No parcel found at coordinates: {}, {}", lat, lng);
            return createEmptyResponse("No parcel found at this location");

        } catch (Exception e) {
            logger.error("Error fetching parcel data for coordinates: " + lat + ", " + lng, e);
            return createEmptyResponse("Error fetching parcel data");
        }
    }

    /**
     * Query local database to get PIN from coordinates
     */
    private String getPinFromLocalDatabase(Double lat, Double lng) {
        try {
            // Query the king_county_parcels table for the PIN at the given coordinates
            // Using ST_Contains to find the parcel polygon that contains the point
            String sql = """
                        SELECT pin
                        FROM parcel_address_area
                        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))
                        LIMIT 1
                    """;

            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, lng, lat);

            if (!results.isEmpty()) {
                Object pinObj = results.get(0).get("pin");
                if (pinObj != null) {
                    return pinObj.toString();
                }
            }

            // If no exact match, try to find the nearest parcel within a small distance
            String nearestSql = """
                        SELECT pin, ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) as distance
                        FROM parcel_address_area
                        WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326), 0.0001)
                        ORDER BY distance
                        LIMIT 1
                    """;

            results = jdbcTemplate.queryForList(nearestSql, lng, lat, lng, lat);

            if (!results.isEmpty()) {
                Object pinObj = results.get(0).get("pin");
                if (pinObj != null) {
                    return pinObj.toString();
                }
            }

            return null;
        } catch (Exception e) {
            logger.error("Error querying local database for PIN", e);
            return null;
        }
    }

    /**
     * Fetch parcel data from King County using PIN
     */
    private Map<String, Object> fetchParcelDataFromKingCounty(String pin) {
        try {
            String url = PARCEL_INFO_URL + "?pin=" + pin;

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            Map<String, Object> result = new HashMap<>();

            if (root.has("items") && root.get("items").size() > 0) {
                JsonNode item = root.get("items").get(0);

                result.put("pin", item.has("PIN") ? item.get("PIN").asText() : pin);
                result.put("owner", item.has("TAXPAYERNAME") ? item.get("TAXPAYERNAME").asText() : "");
                result.put("jurisdiction", item.has("JURISDICTION") ? item.get("JURISDICTION").asText() : "");
                result.put("presentUse", item.has("PRESENTUSE") ? item.get("PRESENTUSE").asText() : "");
                result.put("address", item.has("ADDRESS") ? item.get("ADDRESS").asText() : "");
                result.put("appraisedValue", item.has("APPVALUE") ? item.get("APPVALUE").asText() : "");
                result.put("lotSqft", item.has("LOTSQFT") ? item.get("LOTSQFT").asText() : "");
                result.put("numBuildings", item.has("NUMBUILDINGS") ? item.get("NUMBUILDINGS").asText() : "");
                result.put("numUnits", item.has("NUMUNITS") ? item.get("NUMUNITS").asText() : "");
                result.put("levyCode", item.has("LEVYCODE") ? item.get("LEVYCODE").asText() : "");
                result.put("success", true);

                logger.info("Successfully fetched parcel data for PIN: {}", pin);
            } else {
                result.put("success", false);
                result.put("message", "No data found for PIN: " + pin);
            }

            return result;

        } catch (Exception e) {
            logger.error("Error fetching parcel data for PIN: " + pin, e);
            return createEmptyResponse("Error fetching parcel data");
        }
    }

    private Map<String, Object> createEmptyResponse(String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", message);
        return result;
    }
}