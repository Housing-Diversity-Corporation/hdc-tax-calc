package com.hdc.hdc_map_backend.repository.user;

import com.hdc.hdc_map_backend.entity.UserFavoriteLayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFavoriteLayerRepo extends JpaRepository<UserFavoriteLayer, Long> {
}
