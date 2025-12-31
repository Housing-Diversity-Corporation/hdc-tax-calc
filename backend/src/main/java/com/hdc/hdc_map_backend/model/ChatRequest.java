package com.hdc.hdc_map_backend.model;

import java.util.List;
import java.util.Map;

public class ChatRequest {
    private String message;
    private String sessionId;
    private MapState mapState;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public MapState getMapState() {
        return mapState;
    }

    public void setMapState(MapState mapState) {
        this.mapState = mapState;
    }

    public static class MapState {
        private List<EnabledLayer> enabledLayers;
        private Double currentZoom;
        private MapBounds bounds;
        private Map<String, Object> activeFilters;

        public List<EnabledLayer> getEnabledLayers() {
            return enabledLayers;
        }

        public void setEnabledLayers(List<EnabledLayer> enabledLayers) {
            this.enabledLayers = enabledLayers;
        }

        public Double getCurrentZoom() {
            return currentZoom;
        }

        public void setCurrentZoom(Double currentZoom) {
            this.currentZoom = currentZoom;
        }

        public MapBounds getBounds() {
            return bounds;
        }

        public void setBounds(MapBounds bounds) {
            this.bounds = bounds;
        }

        public Map<String, Object> getActiveFilters() {
            return activeFilters;
        }

        public void setActiveFilters(Map<String, Object> activeFilters) {
            this.activeFilters = activeFilters;
        }
    }

    public static class EnabledLayer {
        private String id;
        private String name;
        private boolean enabled;
        private String apiTableId;

        public EnabledLayer() {}

        public EnabledLayer(String id, String name, boolean enabled, String apiTableId) {
            this.id = id;
            this.name = name;
            this.enabled = enabled;
            this.apiTableId = apiTableId;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getApiTableId() {
            return apiTableId;
        }

        public void setApiTableId(String apiTableId) {
            this.apiTableId = apiTableId;
        }
    }

    public static class MapBounds {
        private Double minLat;
        private Double maxLat;
        private Double minLng;
        private Double maxLng;

        public MapBounds() {}

        public MapBounds(Double minLat, Double maxLat, Double minLng, Double maxLng) {
            this.minLat = minLat;
            this.maxLat = maxLat;
            this.minLng = minLng;
            this.maxLng = maxLng;
        }

        public Double getMinLat() {
            return minLat;
        }

        public void setMinLat(Double minLat) {
            this.minLat = minLat;
        }

        public Double getMaxLat() {
            return maxLat;
        }

        public void setMaxLat(Double maxLat) {
            this.maxLat = maxLat;
        }

        public Double getMinLng() {
            return minLng;
        }

        public void setMinLng(Double minLng) {
            this.minLng = minLng;
        }

        public Double getMaxLng() {
            return maxLng;
        }

        public void setMaxLng(Double maxLng) {
            this.maxLng = maxLng;
        }
    }
}
