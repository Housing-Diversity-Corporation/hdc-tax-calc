package com.hdc.hdc_map_backend.config;

import com.pgvector.PGvector;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class PgVectorConfig {

    private static final Logger logger = LoggerFactory.getLogger(PgVectorConfig.class);

    @PostConstruct
    public void initializePgVector() {
        // PGvector type will be registered when first connection is made
        logger.info("PGvector configuration initialized");
    }

    /**
     * Ensures the pgvector extension is enabled in the database
     */
    @Bean
    String ensurePgVectorExtension(DataSource dataSource) {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Create extension if not exists
            stmt.execute("CREATE EXTENSION IF NOT EXISTS vector");
            logger.info("PGvector extension ensured in database");

            // Set search path to include rag_schema
            stmt.execute("SET search_path TO public, user_schema, rag_schema");
            logger.info("Database search path configured");

        } catch (Exception e) {
            logger.error("Failed to ensure pgvector extension: {}", e.getMessage());
            // Don't fail startup if extension already exists
        }
        return "pgvector-configured";
    }
}