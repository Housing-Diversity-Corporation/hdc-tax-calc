package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.FavoriteLocation;
import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.repository.FavoriteLocationRepository;
import com.hdc.hdc_map_backend.repository.user.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FavoriteLocationService {

    @Autowired
    private FavoriteLocationRepository favoriteLocationRepository;

    @Autowired
    private UserRepo userRepository;

    public FavoriteLocation saveFavoriteLocation(FavoriteLocation location, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            location.setUser(user);
            return favoriteLocationRepository.save(location);
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public List<FavoriteLocation> getFavoriteLocationsByUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return favoriteLocationRepository.findByUserId(user.getId());
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public void deleteFavoriteLocation(Long locationId, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Optional<FavoriteLocation> locationOptional = favoriteLocationRepository.findById(locationId);
            if (locationOptional.isPresent()) {
                FavoriteLocation location = locationOptional.get();
                // Only allow deletion if the location belongs to the current user
                if (location.getUser().getId().equals(user.getId())) {
                    favoriteLocationRepository.delete(location);
                } else {
                    throw new RuntimeException("Unauthorized to delete this favorite location");
                }
            } else {
                throw new RuntimeException("Favorite location not found");
            }
        } else {
            throw new RuntimeException("User not found");
        }
    }
}
