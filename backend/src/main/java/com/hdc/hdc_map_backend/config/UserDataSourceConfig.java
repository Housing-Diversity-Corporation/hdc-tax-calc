package com.hdc.hdc_map_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.hdc.hdc_map_backend.repository"
)
public class UserDataSourceConfig {
    // Simplified - Spring Boot will auto-configure the single datasource
}