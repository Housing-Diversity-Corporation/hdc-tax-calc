package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.service.KingCountyParcelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/parcel")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class ParcelController {

    @Autowired
    private KingCountyParcelService parcelService;

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getParcelInfo(
            @RequestParam(required = false) String address,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        Map<String, Object> parcelData;

        if (address != null && !address.isEmpty()) {
            parcelData = parcelService.getParcelDataByAddress(address);
        } else if (lat != null && lng != null) {
            parcelData = parcelService.getParcelDataByCoordinates(lat, lng);
        } else {
            parcelData = Map.of("success", false, "message", "Either address or coordinates must be provided");
        }

        return ResponseEntity.ok(parcelData);
    }
}