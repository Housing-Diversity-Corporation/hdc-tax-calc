package com.hdc.hdc_map_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class SavedIntersectionService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void saveIntersection(String name, String intersectionResult, Long userId) {
        try {
            String sql = "INSERT INTO user_schema.user_saved_intersections (name, intersection_result, user_id) VALUES (?, ?, ?)";
            jdbcTemplate.update(sql, name, intersectionResult, userId);
        } catch (Exception e) {
            System.err.println("Error saving to user_saved_intersections table: " + e.getMessage());
            throw new RuntimeException("Unable to save intersection. Table may not exist or insufficient permissions.");
        }
    }

    public List<Map<String, Object>> getIntersectionsByUserId(Long userId) {
        try {
            String sql = "SELECT id, name, created_at FROM user_schema.user_saved_intersections WHERE user_id = ?";
            return jdbcTemplate.queryForList(sql, userId);
        } catch (Exception e) {
            System.err.println("Error accessing user_saved_intersections table: " + e.getMessage());
            // Return empty list if table doesn't exist or no permissions
            return new java.util.ArrayList<>();
        }
    }

    public Map<String, Object> getIntersectionById(Long id, Long userId) {
        try {
            String sql = "SELECT * FROM user_schema.user_saved_intersections WHERE id = ? AND user_id = ?";
            return jdbcTemplate.queryForMap(sql, id, userId);
        } catch (Exception e) {
            System.err.println("Error accessing user_saved_intersections table: " + e.getMessage());
            // Return empty map if table doesn't exist or no permissions
            return new java.util.HashMap<>();
        }
    }

    public void deleteIntersection(Long id, Long userId) {
        try {
            String sql = "DELETE FROM user_schema.user_saved_intersections WHERE id = ? AND user_id = ?";
            jdbcTemplate.update(sql, id, userId);
        } catch (Exception e) {
            System.err.println("Error deleting from user_saved_intersections table: " + e.getMessage());
            throw new RuntimeException("Unable to delete intersection. Table may not exist or insufficient permissions.");
        }
    }
}
