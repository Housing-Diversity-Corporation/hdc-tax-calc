package com.hdc.hdc_map_backend.entity.rag;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_context", schema = "rag_schema")
public class UserContextEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "default_location", columnDefinition = "jsonb")
    private String defaultLocation;

    @Column(name = "preferred_layers", columnDefinition = "text[]")
    private String[] preferredLayers;

    @Column(name = "industry_context", length = 255)
    private String industryContext;

    @Column(name = "expertise_level", length = 50)
    private String expertiseLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_terminology", columnDefinition = "jsonb")
    private String customTerminology;

    @Column(name = "interaction_style", length = 100)
    private String interactionStyle;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "last_session_context", columnDefinition = "jsonb")
    private String lastSessionContext;

    @Column(name = "total_interactions")
    private Integer totalInteractions;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
        if (totalInteractions == null) {
            totalInteractions = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}