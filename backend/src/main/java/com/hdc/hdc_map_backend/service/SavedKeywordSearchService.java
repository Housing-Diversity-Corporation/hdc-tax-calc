package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.SavedKeywordSearch;
import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.repository.SavedKeywordSearchRepository;
import com.hdc.hdc_map_backend.repository.user.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SavedKeywordSearchService {

    @Autowired
    private SavedKeywordSearchRepository savedKeywordSearchRepository;

    @Autowired
    private UserRepo userRepository;

    public SavedKeywordSearch saveKeywordSearch(SavedKeywordSearch search, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            search.setUser(user);
            return savedKeywordSearchRepository.save(search);
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public List<SavedKeywordSearch> getSavedSearchesByUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return savedKeywordSearchRepository.findByUserId(user.getId());
        } else {
            throw new RuntimeException("User not found");
        }
    }

    public void deleteSavedSearch(Long searchId, String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Optional<SavedKeywordSearch> searchOptional = savedKeywordSearchRepository.findById(searchId);
            if (searchOptional.isPresent()) {
                SavedKeywordSearch search = searchOptional.get();
                // Only allow deletion if the search belongs to the current user
                if (search.getUser().getId().equals(user.getId())) {
                    savedKeywordSearchRepository.delete(search);
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
