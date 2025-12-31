package com.hdc.hdc_map_backend.repository.rag;

import com.hdc.hdc_map_backend.entity.rag.UserPattern;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPatternRepository extends JpaRepository<UserPattern, Integer> {

    List<UserPattern> findByUserIdOrderByFrequencyDesc(Integer userId);

    List<UserPattern> findByUserIdAndPatternTypeOrderByLastUsedDesc(Integer userId, String patternType);

    @Query("SELECT up FROM UserPattern up WHERE up.userId = :userId AND up.patternType = :patternType AND up.patternData = :patternData")
    Optional<UserPattern> findByUserIdAndPatternTypeAndPatternData(@Param("userId") Integer userId,
                                                                   @Param("patternType") String patternType,
                                                                   @Param("patternData") String patternData);
}