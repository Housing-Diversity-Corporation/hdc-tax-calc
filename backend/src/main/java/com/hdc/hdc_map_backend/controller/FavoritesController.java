package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.entity.UserFavoriteLayer;
import com.hdc.hdc_map_backend.repository.user.UserFavoriteLayerRepo;
import com.hdc.hdc_map_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class FavoritesController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserFavoriteLayerRepo userFavoriteLayerRepo;

    @GetMapping("/layers")
    public ResponseEntity<Set<String>> getFavoriteLayers(Principal principal) {
        User user = userService.findByUsername(principal.getName());
        Set<String> favoriteLayers = user.getFavoriteLayers().stream()
                .map(UserFavoriteLayer::getLayerId)
                .collect(Collectors.toSet());
        return ResponseEntity.ok(favoriteLayers);
    }

    @PostMapping("/layers")
    public ResponseEntity<?> addFavoriteLayer(@RequestBody FavoriteLayerRequest request, Principal principal) {
        User user = userService.findByUsername(principal.getName());
        UserFavoriteLayer favoriteLayer = new UserFavoriteLayer(user, request.getLayerId());
        userFavoriteLayerRepo.save(favoriteLayer);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/layers/{layerId}")
    public ResponseEntity<?> removeFavoriteLayer(@PathVariable String layerId, Principal principal) {
        User user = userService.findByUsername(principal.getName());
        user.getFavoriteLayers().removeIf(favorite -> favorite.getLayerId().equals(layerId));
        userService.save(user);
        return ResponseEntity.ok().build();
    }

    static class FavoriteLayerRequest {
        private String layerId;

        public String getLayerId() {
            return layerId;
        }

        public void setLayerId(String layerId) {
            this.layerId = layerId;
        }
    }
}
