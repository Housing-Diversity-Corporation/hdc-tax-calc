package com.hdc.hdc_map_backend.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class CachedResponse {
    private Integer id;
    private String queryHash;
    private List<MapAction> actions;
    private Map<String, Object> metadata;
    private Integer hitCount;
    private LocalDateTime lastAccessed;
    private Integer ttlHours;
    private LocalDateTime createdAt;

    /**
     * Check if the cached response is still valid based on TTL
     */
    public boolean isValid() {
        if (ttlHours == null || ttlHours <= 0) {
            return true; // No TTL means always valid
        }

        LocalDateTime expiryTime = createdAt.plusHours(ttlHours);
        return LocalDateTime.now().isBefore(expiryTime);
    }

    /**
     * Get age of cached response in hours
     */
    public long getAgeHours() {
        return java.time.Duration.between(createdAt, LocalDateTime.now()).toHours();
    }

    /**
     * Legacy method for backward compatibility
     */
    public Map<String, Object> getMapState() {
        return metadata;
    }

    public void setMapState(Map<String, Object> mapState) {
        this.metadata = mapState;
    }
}
