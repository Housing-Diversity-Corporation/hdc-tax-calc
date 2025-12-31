package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.SavedNeighborhoodSearch;
import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.repository.SavedNeighborhoodSearchRepository;
import com.hdc.hdc_map_backend.repository.user.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SavedNeighborhoodSearchService {

    @Autowired
    private SavedNeighborhoodSearchRepository savedNeighborhoodSearchRepository;

    @Autowired
    private UserRepo userRepository;

    public SavedNeighborhoodSearch saveNeighborhoodSearch(SavedNeighborhoodSearch search, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            search.setUser(user);
            return savedNeighborhoodSearchRepository.save(search);
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public List<SavedNeighborhoodSearch> getSavedSearchesByUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return savedNeighborhoodSearchRepository.findByUserId(user.getId());
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public List<SavedNeighborhoodSearch> getNeighborhoodSearchesByUsername(String username) {
        return getSavedSearchesByUsername(username);
    }

    public SavedNeighborhoodSearch getNeighborhoodSearchById(Long searchId, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Optional<SavedNeighborhoodSearch> searchOptional = savedNeighborhoodSearchRepository.findById(searchId);
            if (searchOptional.isPresent()) {
                SavedNeighborhoodSearch search = searchOptional.get();
                if (search.getUser().getId().equals(user.getId())) {
                    return search;
                } else {
                    throw new RuntimeException("Unauthorized to access this saved search");
                }
            } else {
                throw new RuntimeException("Saved search not found");
            }
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public SavedNeighborhoodSearch updateNeighborhoodSearch(Long searchId, SavedNeighborhoodSearch updatedSearch,
            String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Optional<SavedNeighborhoodSearch> searchOptional = savedNeighborhoodSearchRepository.findById(searchId);
            if (searchOptional.isPresent()) {
                SavedNeighborhoodSearch existingSearch = searchOptional.get();
                if (existingSearch.getUser().getId().equals(user.getId())) {
                    // Update fields
                    existingSearch.setSearchName(updatedSearch.getSearchName());
                    existingSearch.setTextQuery(updatedSearch.getTextQuery());
                    existingSearch.setSelectedCategories(updatedSearch.getSelectedCategories());
                    existingSearch.setSearchRadius(updatedSearch.getSearchRadius());
                    existingSearch.setCenterLat(updatedSearch.getCenterLat());
                    existingSearch.setCenterLng(updatedSearch.getCenterLng());
                    existingSearch.setCenterAddress(updatedSearch.getCenterAddress());
                    return savedNeighborhoodSearchRepository.save(existingSearch);
                } else {
                    throw new RuntimeException("Unauthorized to update this saved search");
                }
            } else {
                throw new RuntimeException("Saved search not found");
            }
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public void deleteNeighborhoodSearch(Long searchId, String username) {
        deleteSavedSearch(searchId, username);
    }

    public void deleteSavedSearch(Long searchId, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Optional<SavedNeighborhoodSearch> searchOptional = savedNeighborhoodSearchRepository.findById(searchId);
            if (searchOptional.isPresent()) {
                SavedNeighborhoodSearch search = searchOptional.get();
                // Only allow deletion if the search belongs to the current user
                if (search.getUser().getId().equals(user.getId())) {
                    savedNeighborhoodSearchRepository.delete(search);
                } else {
                    throw new RuntimeException("Unauthorized to delete this saved search");
                }
            } else {
                throw new RuntimeException("Saved search not found");
            }
        } else {
            throw new RuntimeException("User not found");
        }
    }
}
