package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.service.SavedIntersectionService;
import com.hdc.hdc_map_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/intersections")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class SavedIntersectionsController {

    @Autowired
    private SavedIntersectionService savedIntersectionService;

    @Autowired
    private UserService userService;

    @PostMapping("/save")
    public ResponseEntity<?> saveIntersection(@RequestBody SaveIntersectionRequest request, Principal principal) {
        Long userId = userService.findByUsername(principal.getName()).getId();
        savedIntersectionService.saveIntersection(request.getName(), request.getIntersectionResult(), userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getSavedIntersections(Principal principal) {
        Long userId = userService.findByUsername(principal.getName()).getId();
        List<Map<String, Object>> intersections = savedIntersectionService.getIntersectionsByUserId(userId);
        return ResponseEntity.ok(intersections);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getIntersectionById(@PathVariable Long id, Principal principal) {
        Long userId = userService.findByUsername(principal.getName()).getId();
        Map<String, Object> intersection = savedIntersectionService.getIntersectionById(id, userId);
        return ResponseEntity.ok(intersection);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIntersection(@PathVariable Long id, Principal principal) {
        Long userId = userService.findByUsername(principal.getName()).getId();
        savedIntersectionService.deleteIntersection(id, userId);
        return ResponseEntity.ok().build();
    }
}

class SaveIntersectionRequest {
    private String name;
    private String intersectionResult;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIntersectionResult() {
        return intersectionResult;
    }

    public void setIntersectionResult(String intersectionResult) {
        this.intersectionResult = intersectionResult;
    }
}
