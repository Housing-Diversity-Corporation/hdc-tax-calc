package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.model.UserContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Service
public class LayerService {

    private static final Logger logger = LoggerFactory.getLogger(LayerService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Check if a layer is available for the user based on metadata and user preferences
     */
    public boolean isLayerAvailable(String layerId, UserContext userContext) {
        try {
            logger.debug("Checking availability for layer: {}", layerId);

            // First check if layer exists in metadata
            String checkSql = "SELECT COUNT(*) FROM rag_schema.layer_metadata WHERE layer_id = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, layerId);

            if (count == null || count == 0) {
                logger.warn("Layer not found in metadata: {}", layerId);
                return false;
            }

            // Check if user has specific restrictions (could be extended later)
            if (userContext != null && userContext.getPreferredLayers() != null) {
                // If user has preferred layers, check if this layer is compatible
                List<String> preferredLayers = userContext.getPreferredLayers();

                // For now, allow all layers unless there are explicit restrictions
                // This can be enhanced with user permission checks later
                logger.debug("Layer {} is available for user with {} preferred layers",
                           layerId, preferredLayers.size());
            }

            // Check layer constraints (e.g., zoom requirements, data source availability)
            String constraintSql = """
                    SELECT zoom_constraints, data_source
                    FROM rag_schema.layer_metadata
                    WHERE layer_id = ?
                """;

            List<String> constraints = jdbcTemplate.query(constraintSql,
                    (rs, rowNum) -> {
                        String zoomConstraints = rs.getString("zoom_constraints");
                        String dataSource = rs.getString("data_source");

                        // Log any constraints for debugging
                        if (zoomConstraints != null) {
                            logger.debug("Layer {} has zoom constraints: {}", layerId, zoomConstraints);
                        }
                        if (dataSource != null) {
                            logger.debug("Layer {} data source: {}", layerId, dataSource);
                        }

                        return "available";
                    },
                    layerId);

            logger.info("Layer {} is available for user", layerId);
            return true;

        } catch (Exception e) {
            logger.error("Error checking layer availability for {}: {}", layerId, e.getMessage());
            // Default to true to avoid breaking the system
            return true;
        }
    }

    /**
     * Get layer display name by ID
     */
    public String getLayerDisplayName(String layerId) {
        try {
            String sql = "SELECT display_name FROM rag_schema.layer_metadata WHERE layer_id = ?";
            List<String> names = jdbcTemplate.queryForList(sql, String.class, layerId);
            return names.isEmpty() ? layerId : names.get(0);
        } catch (Exception e) {
            logger.warn("Could not get display name for layer {}: {}", layerId, e.getMessage());
            return layerId;
        }
    }

    /**
     * Check if layer has zoom constraints
     */
    public boolean hasZoomConstraints(String layerId) {
        try {
            String sql = "SELECT zoom_constraints FROM rag_schema.layer_metadata WHERE layer_id = ? AND zoom_constraints IS NOT NULL";
            List<String> constraints = jdbcTemplate.queryForList(sql, String.class, layerId);
            return !constraints.isEmpty();
        } catch (Exception e) {
            logger.warn("Could not check zoom constraints for layer {}: {}", layerId, e.getMessage());
            return false;
        }
    }

    /**
     * Get zoom constraints for a layer
     */
    public Map<String, Object> getZoomConstraints(String layerId) {
        try {
            String sql = "SELECT zoom_constraints FROM rag_schema.layer_metadata WHERE layer_id = ?";
            List<String> constraintStrings = jdbcTemplate.queryForList(sql, String.class, layerId);

            if (!constraintStrings.isEmpty() && constraintStrings.get(0) != null) {
                String constraintJson = constraintStrings.get(0);
                @SuppressWarnings("unchecked")
                Map<String, Object> constraints = objectMapper.readValue(constraintJson, Map.class);
                return constraints;
            }

            return null;
        } catch (Exception e) {
            logger.warn("Could not parse zoom constraints for layer {}: {}", layerId, e.getMessage());
            return null;
        }
    }

    /**
     * Check if current zoom level is sufficient for layer
     */
    public boolean isZoomSufficient(String layerId, double currentZoom) {
        Map<String, Object> constraints = getZoomConstraints(layerId);
        if (constraints == null) {
            return true; // No constraints means layer is always available
        }

        try {
            Object minZoomObj = constraints.get("min_zoom");
            if (minZoomObj != null) {
                double minZoom = ((Number) minZoomObj).doubleValue();
                if (currentZoom < minZoom) {
                    logger.info("Layer {} requires min zoom {}, current zoom is {}", layerId, minZoom, currentZoom);
                    return false;
                }
            }

            Object maxZoomObj = constraints.get("max_zoom");
            if (maxZoomObj != null) {
                double maxZoom = ((Number) maxZoomObj).doubleValue();
                if (currentZoom > maxZoom) {
                    logger.info("Layer {} requires max zoom {}, current zoom is {}", layerId, maxZoom, currentZoom);
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            logger.warn("Error checking zoom sufficiency for layer {}: {}", layerId, e.getMessage());
            return true; // Default to allowing the layer
        }
    }

    /**
     * Get zoom constraint message for a layer
     */
    public String getZoomConstraintMessage(String layerId) {
        Map<String, Object> constraints = getZoomConstraints(layerId);
        if (constraints == null) {
            return null;
        }

        Object messageObj = constraints.get("message");
        if (messageObj != null) {
            return messageObj.toString();
        }

        // Generate default message from min/max zoom
        Object minZoomObj = constraints.get("min_zoom");
        Object maxZoomObj = constraints.get("max_zoom");

        if (minZoomObj != null) {
            double minZoom = ((Number) minZoomObj).doubleValue();
            return String.format("Automatically zooming to level %.0f to display this layer", minZoom);
        }

        if (maxZoomObj != null) {
            double maxZoom = ((Number) maxZoomObj).doubleValue();
            return String.format("Zoom out to level %.0f or less to see this layer", maxZoom);
        }

        return null;
    }

    /**
     * Get required zoom level for a layer (returns min_zoom if available)
     */
    public Double getRequiredZoomLevel(String layerId) {
        Map<String, Object> constraints = getZoomConstraints(layerId);
        if (constraints == null) {
            return null;
        }

        Object minZoomObj = constraints.get("min_zoom");
        if (minZoomObj != null) {
            return ((Number) minZoomObj).doubleValue();
        }

        return null;
    }
}
