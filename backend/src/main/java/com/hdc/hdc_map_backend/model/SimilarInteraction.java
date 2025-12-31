package com.hdc.hdc_map_backend.model;

import lombok.Data;

import java.util.List;

@Data
public class SimilarInteraction {
    private long id;
    private String queryText;
    private String actionsTaken;
    private float similarity;
    private List<String> layersInvolved;
}
