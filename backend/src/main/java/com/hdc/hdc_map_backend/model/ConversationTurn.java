package com.hdc.hdc_map_backend.model;

import lombok.Data;

@Data
public class ConversationTurn {
    private String role;
    private String content;
    private int turnNumber;
}
