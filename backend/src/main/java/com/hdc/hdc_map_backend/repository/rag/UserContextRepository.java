package com.hdc.hdc_map_backend.repository.rag;

import com.hdc.hdc_map_backend.entity.rag.UserContextEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserContextRepository extends JpaRepository<UserContextEntity, Integer> {

    Optional<UserContextEntity> findByUserId(Integer userId);
}