package com.hdc.hdc_map_backend.model;

import lombok.Data;

@Data
public class MapAction {
    private String type;
    private Object payload;
    private int sequenceId;
    private String explanation;
    private boolean requiresUserConfirmation;
    private boolean waitForCompletion = false; // Wait for frontend confirmation before next action
    private String[] dependsOn; // Array of action types this action depends on
    private long delayMs = 1000; // Default delay between actions in milliseconds

    public MapAction(String type, Object payload) {
        this.type = type;
        this.payload = payload;
        // Set default delays based on action type
        setDefaultDelay();
    }

    private void setDefaultDelay() {
        // Check for null type to avoid NullPointerException
        if (this.type == null) {
            this.delayMs = 1000; // Default delay if type is null
            return;
        }

        switch (this.type) {
            case "TOGGLE_LAYER":
                this.delayMs = 6000; // 6 seconds for layer loading
                this.waitForCompletion = true; // Wait for layer to fully load
                break;
            case "PERFORM_INTERSECTION":
                this.delayMs = 8000; // 8 seconds for intersection calculation
                this.waitForCompletion = true; // Wait for intersection to complete
                this.dependsOn = new String[]{"TOGGLE_LAYER"}; // Depends on layers being loaded
                break;
            case "SET_ZOOM":
            case "ZOOM_TO_LOCATION":
                this.delayMs = 1500; // 1.5 seconds for zoom
                this.waitForCompletion = true; // Wait for zoom to complete
                break;
            case "PAN_TO":
                this.delayMs = 1000; // 1 second for pan
                this.waitForCompletion = true; // Wait for pan to complete
                break;
            case "APPLY_FILTER":
                this.delayMs = 3000; // 3 seconds for filtering
                this.waitForCompletion = true; // Wait for filter to apply
                break;
            case "HIGHLIGHT_FEATURE":
                this.delayMs = 2000; // 2 seconds for highlighting
                this.waitForCompletion = true; // Wait for highlighting to complete
                this.dependsOn = new String[]{"PERFORM_INTERSECTION", "TOGGLE_LAYER"}; // Depends on data being available
                break;
            default:
                this.delayMs = 1000; // 1 second default
        }
    }
}