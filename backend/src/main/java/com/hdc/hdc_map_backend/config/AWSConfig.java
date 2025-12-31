package com.hdc.hdc_map_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;

@Configuration
public class AWSConfig {

    @Value("${aws.access.key.id:}")
    private String accessKeyId;

    @Value("${aws.secret.access.key:}")
    private String secretAccessKey;

    @Value("${bedrock.region:us-east-2}")
    private String bedrockRegion;

    @Bean
    public BedrockRuntimeClient bedrockRuntimeClient() {
        System.out.println("=== Configuring AWS Bedrock Client ===");
        System.out.println("Access Key ID present: " + (!accessKeyId.isEmpty()));
        System.out.println("Secret Access Key present: " + (!secretAccessKey.isEmpty()));
        System.out.println("Region: " + bedrockRegion);

        AwsCredentialsProvider credentialsProvider;

        if (!accessKeyId.isEmpty() && !secretAccessKey.isEmpty()) {
            System.out.println("Using configured AWS credentials");
            credentialsProvider = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey)
            );
        } else {
            System.out.println("Attempting to use default AWS credentials provider chain");
            try {
                credentialsProvider = DefaultCredentialsProvider.builder().build();
                // Test if credentials are available
                credentialsProvider.resolveCredentials();
                System.out.println("Default credentials provider chain successful");
            } catch (Exception e) {
                System.err.println("No AWS credentials available: " + e.getMessage());
                System.err.println("To use Bedrock, set aws.access.key.id and aws.secret.access.key in application.properties");
                return null;
            }
        }

        try {
            BedrockRuntimeClient client = BedrockRuntimeClient.builder()
                    .region(Region.of(bedrockRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();
            System.out.println("AWS Bedrock client created successfully");
            return client;
        } catch (Exception e) {
            System.err.println("Failed to create Bedrock client: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}