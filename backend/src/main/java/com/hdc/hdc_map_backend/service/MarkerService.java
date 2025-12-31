package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.Marker;
import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.repository.MarkerRepository;
import com.hdc.hdc_map_backend.repository.user.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MarkerService {

    @Autowired
    private MarkerRepository markerRepository;

    @Autowired
    private UserRepo userRepository;

    public Marker saveMarker(Marker marker, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            marker.setUser(user);
            return markerRepository.save(marker);
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public List<Marker> getMarkersByUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return markerRepository.findByUserId(user.getId());
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public List<Marker> getMarkersByUserId(Long userId) {
        List<Marker> markers = markerRepository.findByUserId(userId);
        // Initialize user relationship to avoid lazy loading issues
        markers.forEach(marker -> {
            if (marker.getUser() != null) {
                marker.getUser().getUsername(); // Force initialization
            }
        });
        return markers;
    }

    public Marker getMarkerById(Long markerId) {
        return markerRepository.findById(markerId)
            .orElseThrow(() -> new RuntimeException("Marker not found with id: " + markerId));
    }

    public void deleteMarker(Long markerId, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Optional<Marker> markerOptional = markerRepository.findById(markerId);
            if (markerOptional.isPresent()) {
                Marker marker = markerOptional.get();
                // Only allow deletion if the marker belongs to the current user
                if (marker.getUser().getId().equals(user.getId())) {
                    markerRepository.delete(marker);
                } else {
                    throw new RuntimeException("Unauthorized to delete this marker");
                }
            } else {
                throw new RuntimeException("Marker not found");
            }
        } else {
            throw new RuntimeException("User not found");
        }
    }

    /**
     * Create or update a template marker for an investment deal.
     * Template markers are created under the super user (ID 8) and visible to all users.
     *
     * @param configId Configuration ID to use as unique identifier
     * @param name Deal name
     * @param address Deal location address
     * @param lat Latitude
     * @param lng Longitude
     * @param projectStatus Project status (available, pipeline, funded, completed)
     * @return The created or updated marker
     */
    public Marker createOrUpdateInvestmentMarker(
            Long configId,
            String name,
            String address,
            Double lat,
            Double lng,
            String projectStatus) {

        // Get super user (ID 8) - template marker owner
        Optional<User> superUserOptional = userRepository.findById(8L);
        if (!superUserOptional.isPresent()) {
            throw new RuntimeException("Super user (ID 8) not found. Cannot create template markers.");
        }
        User superUser = superUserOptional.get();

        // Map project status to property category
        // available → acquisition
        // pipeline → pre-development
        // funded → construction
        // completed → completed
        String propertyCategory;
        switch (projectStatus.toLowerCase()) {
            case "available":
                propertyCategory = "acquisition";
                break;
            case "pipeline":
                propertyCategory = "pre-development";
                break;
            case "funded":
                propertyCategory = "construction";
                break;
            case "completed":
                propertyCategory = "completed";
                break;
            default:
                propertyCategory = "acquisition"; // Default fallback
        }

        // Try to find existing marker by checking if a marker exists at these exact coordinates
        // with the same name (to handle updates)
        List<Marker> existingMarkers = markerRepository.findByUserId(8L);
        Optional<Marker> existingMarker = existingMarkers.stream()
            .filter(m -> m.getName() != null && m.getName().equals(name))
            .findFirst();

        Marker marker;
        if (existingMarker.isPresent()) {
            // Update existing marker
            marker = existingMarker.get();
            marker.setAddress(address);
            marker.setLat(lat);
            marker.setLng(lng);
            marker.setPropertyCategory(propertyCategory);
        } else {
            // Create new marker
            marker = new Marker();
            marker.setUser(superUser);
            marker.setName(name);
            marker.setAddress(address);
            marker.setLat(lat);
            marker.setLng(lng);
            marker.setPropertyType("development");
            marker.setPropertyCategory(propertyCategory);
        }

        return markerRepository.save(marker);
    }

    /**
     * Delete an investment marker by configuration name
     */
    public void deleteInvestmentMarkerByName(String name) {
        List<Marker> markers = markerRepository.findByUserId(8L);
        Optional<Marker> marker = markers.stream()
            .filter(m -> m.getName() != null && m.getName().equals(name))
            .findFirst();

        marker.ifPresent(m -> markerRepository.delete(m));
    }
}
