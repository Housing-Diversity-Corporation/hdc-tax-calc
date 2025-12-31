package com.hdc.hdc_map_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hdc.hdc_map_backend.model.MapAction;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LLMService {

    // @Autowired
    // private LayerMetadataRepository layerMetadataRepository;

    @Value("${bedrock.api.key}")
    private String bedrockApiKey;

    @Value("${bedrock.region}")
    private String bedrockRegion;

    private HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Layer mappings based on your frontend code
    private static final Map<String, String> LAYER_MAPPINGS = Map.ofEntries(
            Map.entry("census", "Census Tracts"),
            Map.entry("council", "Council Districts"),
            Map.entry("zoning", "SDCI Zoning"),
            Map.entry("seattle zoning", "SDCI Zoning"),
            Map.entry("parcels", "King County Parcels"),
            Map.entry("king county parcels", "King County Parcels"),
            Map.entry("transit", "Frequent Transit Areas"),
            Map.entry("frequent transit", "Frequent Transit Areas"),
            Map.entry("opportunity zones", "Opportunity Zones"),
            Map.entry("usda", "USDA Ineligible Areas"),
            Map.entry("rural", "USDA Ineligible Areas"));

    public LLMService() {
        // Constructor - no initialization here since @Value hasn't been injected yet
    }
    
    @PostConstruct
    public void initializeHttpClient() {
        try {
            System.out.println("Initializing HTTP client for Bedrock API key requests...");
            System.out.println("API Key starts with: " + (bedrockApiKey != null ? bedrockApiKey.substring(0, Math.min(20, bedrockApiKey.length())) : "null"));
            
            if (bedrockApiKey == null || bedrockApiKey.isEmpty()) {
                System.err.println("Bedrock API key is null or empty");
                this.httpClient = null;
                return;
            }
            
            this.httpClient = HttpClient.newBuilder()
                    .version(HttpClient.Version.HTTP_2)
                    .build();

            System.out.println("HTTP client initialized successfully for Bedrock API key authentication!");

        } catch (Exception e) {
            System.err.println("Failed to initialize HTTP client: " + e.getMessage());
            e.printStackTrace();
            this.httpClient = null;
        }
    }


    public List<MapAction> processUserQuery(String userQuery) {
        // Build context with available layers
        String context = buildLayerContext();

        // Create prompt for Claude
        String prompt = buildPrompt(userQuery, context);

        // Call Bedrock/Claude API
        String llmResponse = invokeClaude(prompt);

        // Parse LLM response into actions
        return parseActionsFromResponse(llmResponse);
    }
    
    public String processConversationalQuery(String userQuery) {
        // Build context for conversational response
        String context = buildConversationalContext();
        
        // Create prompt for general conversation
        String prompt = buildConversationalPrompt(userQuery, context);
        
        // Call Bedrock/Claude API
        return invokeClaude(prompt);
    }
    
    /**
     * Smart method that determines if query should be treated as action-based or conversational
     */
    public Object processSmartQuery(String userQuery) {
        if (isActionRequest(userQuery)) {
            // Return map actions
            return processUserQuery(userQuery);
        } else {
            // Return conversational response
            Map<String, Object> result = new HashMap<>();
            result.put("response", processConversationalQuery(userQuery));
            result.put("type", "conversational");
            return result;
        }
    }
    
    private boolean isActionRequest(String query) {
        String lowerQuery = query.toLowerCase();
        
        // Keywords that indicate action requests
        String[] actionKeywords = {
            "show", "display", "enable", "turn on", "toggle", "activate",
            "find", "search", "locate", "go to", "navigate",
            "zoom", "pan", "center", "focus",
            "intersect", "overlap", "compare", "analyze",
            "filter", "highlight", "select"
        };
        
        // Layer names that indicate map actions
        String[] layerKeywords = {
            "census", "zoning", "parcels", "transit", "council", "districts",
            "opportunity zones", "usda", "demographic", "properties"
        };
        
        // Check for action keywords
        for (String keyword : actionKeywords) {
            if (lowerQuery.contains(keyword)) {
                return true;
            }
        }
        
        // Check for layer references
        for (String layer : layerKeywords) {
            if (lowerQuery.contains(layer)) {
                return true;
            }
        }
        
        return false;
    }

    private String buildLayerContext() {
        StringBuilder context = new StringBuilder();
        context.append("Available layers and their properties:\n");

        // Add all your layers with descriptions
        context.append("- Census Tracts: US Census tract boundaries with demographic data\n");
        context.append("- Council Districts: Seattle and LA council district boundaries\n");
        context.append("- SDCI Zoning: Seattle zoning categories (can filter by zone type)\n");
        context.append("- King County Parcels: Property parcels (zoom level >14 required)\n");
        context.append("- Frequent Transit Areas: Transit-oriented development areas (zoom >14)\n");
        context.append("- Opportunity Zones: Federal opportunity zone designations\n");
        context.append("- USDA Ineligible Areas: USDA loan program eligibility areas\n");

        context.append("\nAvailable actions:\n");
        context.append("- TOGGLE_LAYER: Enable/disable a data layer\n");
        context.append("- SEARCH_PLACE: Search for a location using Google Places\n");
        context.append("- ZOOM_TO_LOCATION: Zoom map to specific coordinates or place\n");
        context.append("- PERFORM_INTERSECTION: Find overlapping areas between layers\n");
        context.append("- APPLY_FILTER: Filter Seattle zoning by category or base zone\n");
        context.append("- CREATE_MARKER: Add a marker at a location\n");

        return context.toString();
    }
    
    private String buildConversationalContext() {
        StringBuilder context = new StringBuilder();
        context.append("You are a knowledgeable GIS and mapping assistant for the HDC (Housing Diversity Corporation) mapping application.\n");
        context.append("You can answer questions about:\n");
        context.append("- Geographic information systems (GIS)\n");
        context.append("- Urban planning and development\n");
        context.append("- Real estate and housing data\n");
        context.append("- Zoning regulations and land use\n");
        context.append("- Demographics and census data\n");
        context.append("- Transit and transportation planning\n");
        context.append("- Opportunity zones and economic development\n");
        context.append("- Seattle and Los Angeles area-specific questions\n\n");
        
        context.append("Available data layers in this application:\n");
        context.append("- Census Tracts: US Census tract boundaries with demographic data\n");
        context.append("- Council Districts: Seattle and LA council district boundaries\n");
        context.append("- SDCI Zoning: Seattle zoning categories\n");
        context.append("- King County Parcels: Property parcels\n");
        context.append("- Frequent Transit Areas: Transit-oriented development areas\n");
        context.append("- Opportunity Zones: Federal opportunity zone designations\n");
        context.append("- USDA Ineligible Areas: USDA loan program eligibility areas\n\n");
        
        return context.toString();
    }
    
    private String buildConversationalPrompt(String userQuery, String context) {
        return String.format(
                """
                %s
                
                User question: "%s"
                
                Please provide a helpful, informative response. If the question relates to map functionality, 
                you can mention that the user can also ask for specific map actions if they want to visualize data.
                
                Be conversational and helpful, drawing on your knowledge of GIS, urban planning, and the data 
                sources mentioned above.
                """,
                context, userQuery);
    }

    private String buildPrompt(String userQuery, String context) {
        return String.format(
                """
                        You are a GIS assistant for a mapping application. Convert the user's request into a sequence of map actions.

                        %s

                        User request: "%s"

                        Respond with a JSON array of actions. Each action should have:
                        - type: The action type (from available actions)
                        - payload: Action-specific data
                        - sequenceId: Order of execution (1, 2, 3...)
                        - explanation: Brief explanation of what this action does

                        Example response:
                        [
                          {
                            \"type\": \"SEARCH_PLACE\",
                            \"payload\": {\"query\": \"Seattle Center\"},
                            \"sequenceId\": 1,
                            \"explanation\": \"Searching for Seattle Center location\"
                          },
                          {
                            \"type\": \"TOGGLE_LAYER\",
                            \"payload\": {\"layerId\": \"SDCI Zoning\", \"enabled\": true},
                            \"sequenceId\": 2,
                            \"explanation\": \"Enabling Seattle zoning layer\"
                          }
                        ]

                        Important:
                        - Break down complex requests into step-by-step actions
                        - Include zoom/pan actions when needed for visibility
                        - Add explanations to help users understand the process
                        - If layers need specific zoom levels, add zoom actions first
                        """,
                context, userQuery);
    }

    private String invokeClaude(String prompt) {
        if (httpClient == null) {
            System.out.println("HTTP client is null, using fallback response");
            return generateFallbackActions(prompt);
        }

        try {
            System.out.println("Invoking Claude via Bedrock API with long-term key...");

            // Create request for Claude 3.5 Sonnet on Bedrock
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("anthropic_version", "bedrock-2023-05-31");
            requestBody.put("max_tokens", 1000);
            requestBody.put("messages", List.of(
                    Map.of("role", "user", "content", prompt)));

            String requestJson = objectMapper.writeValueAsString(requestBody);
            System.out.println("Request JSON length: " + requestJson.length());

            // Build the Bedrock API endpoint URL with inference profile
            String endpoint = String.format("https://bedrock-runtime.%s.amazonaws.com/model/us.anthropic.claude-3-5-sonnet-20240620-v1:0/invoke", 
                    bedrockRegion);
            
            // Create HTTP request with Bearer token authentication
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("Authorization", "Bearer " + bedrockApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();
            
            System.out.println("HTTP Status: " + response.statusCode());
            System.out.println("Claude response received, length: " + responseBody.length());

            if (response.statusCode() == 200) {
                // Extract content from Claude's response
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> content = (List<Map<String, Object>>) responseMap.get("content");
                return (String) content.get(0).get("text");
            } else {
                System.err.println("HTTP Error " + response.statusCode() + ": " + responseBody);
                return generateFallbackActions(prompt);
            }

        } catch (Exception e) {
            System.err.println("Error invoking Claude: " + e.getMessage());
            e.printStackTrace();
            // Fallback to simple action parsing
            return generateFallbackActions(prompt);
        }
    }

    private List<MapAction> parseActionsFromResponse(String response) {
        List<MapAction> actions = new ArrayList<>();

        try {
            // Parse JSON array from response
            List<Map<String, Object>> actionMaps = objectMapper.readValue(
                    response,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            for (Map<String, Object> actionMap : actionMaps) {
                MapAction action = new MapAction(
                        (String) actionMap.get("type"),
                        actionMap.get("payload"));
                action.setSequenceId((Integer) actionMap.get("sequenceId"));
                action.setExplanation((String) actionMap.get("explanation"));
                actions.add(action);
            }
        } catch (Exception e) {
            // Fallback parsing if JSON fails
            actions = parseNaturalLanguageActions(response);
        }

        return actions;
    }

    private List<MapAction> parseNaturalLanguageActions(String text) {
        List<MapAction> actions = new ArrayList<>();
        int sequenceId = 1;

        // Parse common patterns
        String lowerText = text.toLowerCase();

        // Check for layer mentions
        for (Map.Entry<String, String> entry : LAYER_MAPPINGS.entrySet()) {
            if (lowerText.contains(entry.getKey())) {
                Map<String, Object> payload = new HashMap<>();
                payload.put("layerId", entry.getValue());
                payload.put("enabled", true);

                MapAction action = new MapAction("TOGGLE_LAYER", payload);
                action.setSequenceId(sequenceId++);
                action.setExplanation("Enabling " + entry.getValue() + " layer");
                actions.add(action);
            }
        }

        // Check for location searches
        Pattern searchPattern = Pattern.compile("(?:search|find|show|go to|zoom to)\s+(.+?)(?:\\.|,|$)");
        Matcher locationMatcher = searchPattern.matcher(lowerText);
        if (locationMatcher.find()) {
            String location = locationMatcher.group(1).trim();
            Map<String, Object> payload = new HashMap<>();
            payload.put("query", location);
            MapAction action = new MapAction("SEARCH_PLACE", payload);
            action.setSequenceId(sequenceId++);
            action.setExplanation("Searching for " + location);
            actions.add(action);
        }

        // Check for intersection request
        if (lowerText.contains("intersect") || lowerText.contains("overlap")) {
            MapAction action = new MapAction("PERFORM_INTERSECTION", new HashMap<>());
            action.setSequenceId(sequenceId++);
            action.setExplanation("Finding overlapping areas between enabled layers");
            actions.add(action);
        }

        return actions;
    }

    private String generateFallbackActions(String query) {
        // Simple fallback logic when Bedrock is unavailable
        return "[]";
    }

    public String generateExplanation(MapAction action) {
        return switch (action.getType()) {
            case "TOGGLE_LAYER" -> "Toggling visibility of map layer";
            case "SEARCH_PLACE" -> "Searching for location using Google Places";
            case "ZOOM_TO_LOCATION" -> "Adjusting map view to show area";
            case "PERFORM_INTERSECTION" -> "Calculating overlapping areas";
            case "APPLY_FILTER" -> "Filtering layer features";
            default -> "Processing map action";
        };
    }
}
