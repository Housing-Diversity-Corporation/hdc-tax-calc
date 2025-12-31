package com.hdc.hdc_map_backend.util;

import com.pgvector.PGvector;
import java.util.Arrays;

public class VectorUtils {

    /**
     * Convert a float array to PGvector
     */
    public static PGvector toPGvector(float[] embedding) {
        if (embedding == null) {
            return null;
        }
        try {
            return new PGvector(embedding);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create PGvector from embedding", e);
        }
    }

    /**
     * Convert PGvector to float array
     */
    public static float[] toFloatArray(PGvector pgVector) {
        if (pgVector == null) {
            return null;
        }
        return pgVector.toArray();
    }

    /**
     * Convert a float array to PostgreSQL vector string format
     */
    public static String toVectorString(float[] embedding) {
        if (embedding == null) {
            return null;
        }
        return Arrays.toString(embedding);
    }

    /**
     * Parse PostgreSQL vector string to float array
     */
    public static float[] parseVectorString(String vectorString) {
        if (vectorString == null || vectorString.isEmpty()) {
            return null;
        }

        // Remove brackets if present
        vectorString = vectorString.trim();
        if (vectorString.startsWith("[") && vectorString.endsWith("]")) {
            vectorString = vectorString.substring(1, vectorString.length() - 1);
        }

        String[] parts = vectorString.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }
}