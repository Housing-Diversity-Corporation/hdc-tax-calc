package com.hdc.hdc_map_backend.dto;

import com.hdc.hdc_map_backend.entity.Marker;
import lombok.Data;

@Data
public class MarkerDTO {
    private Long id;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private String propertyType;
    private String propertyCategory;
    private Long userId;

    public static MarkerDTO fromEntity(Marker marker) {
        MarkerDTO dto = new MarkerDTO();
        dto.setId(marker.getId());
        dto.setName(marker.getName());
        dto.setAddress(marker.getAddress());
        dto.setLat(marker.getLat());
        dto.setLng(marker.getLng());
        dto.setPropertyType(marker.getPropertyType());
        dto.setPropertyCategory(marker.getPropertyCategory());
        if (marker.getUser() != null) {
            dto.setUserId(marker.getUser().getId());
        }
        return dto;
    }
}