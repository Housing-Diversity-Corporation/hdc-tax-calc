package com.hdc.hdc_map_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:3000", // React dev server
                        "http://localhost:5173", // Vite dev server
                        "http://localhost:5174", // Proforma engine frontend
                        "http://127.0.0.1:3000", // Alternative localhost
                        "http://localhost:8080", // Backend server
                        "http://127.0.0.1:8080", // Alternative backend server
                        "https://calc.americanhousing.fund" // Production domain
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization")
                .allowCredentials(true);

        System.out.println("CORS configuration loaded - allowing cross-origin requests");
    }
}