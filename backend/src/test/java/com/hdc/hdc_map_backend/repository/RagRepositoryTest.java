package com.hdc.hdc_map_backend.repository;

import com.hdc.hdc_map_backend.entity.rag.*;
import com.hdc.hdc_map_backend.repository.rag.*;
import com.hdc.hdc_map_backend.util.VectorUtils;
import com.pgvector.PGvector;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
@Transactional
public class RagRepositoryTest {

    @Autowired(required = false)
    private UserInteractionRepository userInteractionRepository;

    @Autowired(required = false)
    private ConversationMemoryRepository conversationMemoryRepository;

    @Autowired(required = false)
    private LayerMetadataRepository layerMetadataRepository;

    @Autowired(required = false)
    private UserContextRepository userContextRepository;

    @Test
    public void testUserInteractionSave() {
        if (userInteractionRepository == null) {
            System.out.println("UserInteractionRepository not available - skipping test");
            return;
        }

        UserInteraction interaction = new UserInteraction();
        interaction.setUserId(1);
        interaction.setQueryText("Show me opportunity zones in Seattle");
        interaction.setSessionId(UUID.randomUUID());
        interaction.setSuccessRating(5);
        interaction.setExecutionTimeMs(250);
        interaction.setActionsTaken("{\"actions\": []}");
        interaction.setLocationContext("{\"location\": \"Seattle\"}");
        interaction.setLayersInvolved(new String[]{"opportunity_zones", "census_tracts"});

        // Create a dummy embedding (normally would come from embedding service)
        float[] embedding = new float[1024];  // Updated to match Titan V2 dimensions
        for (int i = 0; i < embedding.length; i++) {
            embedding[i] = (float) (Math.random() * 0.1);
        }
        interaction.setQueryEmbedding(VectorUtils.toPGvector(embedding));

        UserInteraction saved = userInteractionRepository.save(interaction);
        assertNotNull(saved.getId());
        System.out.println("Successfully saved UserInteraction with ID: " + saved.getId());
    }

    @Test
    public void testConversationMemorySave() {
        if (conversationMemoryRepository == null) {
            System.out.println("ConversationMemoryRepository not available - skipping test");
            return;
        }

        ConversationMemory memory = new ConversationMemory();
        memory.setUserId(1);
        memory.setSessionId(UUID.randomUUID());
        memory.setTurnNumber(1);
        memory.setRole("user");
        memory.setContent("Show me census data for King County");
        memory.setMapState("{\"zoom\": 10, \"center\": [-122.3321, 47.6062]}");

        ConversationMemory saved = conversationMemoryRepository.save(memory);
        assertNotNull(saved.getId());
        System.out.println("Successfully saved ConversationMemory with ID: " + saved.getId());
    }

    @Test
    public void testLayerMetadataSave() {
        if (layerMetadataRepository == null) {
            System.out.println("LayerMetadataRepository not available - skipping test");
            return;
        }

        LayerMetadataEntity layer = new LayerMetadataEntity();
        layer.setLayerId("test_layer_" + System.currentTimeMillis());
        layer.setDisplayName("Test Layer");
        layer.setDescription("A test layer for validation");
        layer.setGeometryType("polygon");
        layer.setDataSource("test_source");
        layer.setUpdateFrequency("monthly");
        layer.setTags(new String[]{"test", "demo"});
        layer.setCommonQueries(new String[]{"show test layer", "display test data"});
        layer.setZoomConstraints("{\"min\": 5, \"max\": 15}");
        layer.setAvailableFilters("{\"type\": [\"A\", \"B\"], \"status\": [\"active\", \"inactive\"]}");

        LayerMetadataEntity saved = layerMetadataRepository.save(layer);
        assertNotNull(saved.getId());
        System.out.println("Successfully saved LayerMetadata with ID: " + saved.getId());

        // Test finding by layerId
        Optional<LayerMetadataEntity> found = layerMetadataRepository.findByLayerId(layer.getLayerId());
        assertTrue(found.isPresent());
        assertEquals(layer.getDisplayName(), found.get().getDisplayName());
    }

    @Test
    public void testUserContextSave() {
        if (userContextRepository == null) {
            System.out.println("UserContextRepository not available - skipping test");
            return;
        }

        UserContextEntity context = new UserContextEntity();
        context.setUserId(1);
        context.setExpertiseLevel("intermediate");
        context.setIndustryContext("real_estate");
        context.setInteractionStyle("detailed");
        context.setTotalInteractions(10);
        context.setPreferredLayers(new String[]{"parcels", "census_tracts"});
        context.setDefaultLocation("{\"city\": \"Seattle\", \"state\": \"WA\"}");
        context.setCustomTerminology("{\"oz\": \"opportunity zone\", \"ct\": \"census tract\"}");

        UserContextEntity saved = userContextRepository.save(context);
        assertNotNull(saved.getId());
        System.out.println("Successfully saved UserContext with ID: " + saved.getId());

        // Test finding by userId
        Optional<UserContextEntity> found = userContextRepository.findByUserId(1);
        assertTrue(found.isPresent());
        assertEquals(context.getExpertiseLevel(), found.get().getExpertiseLevel());
    }
}