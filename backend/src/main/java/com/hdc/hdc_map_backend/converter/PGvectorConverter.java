package com.hdc.hdc_map_backend.converter;

import com.pgvector.PGvector;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PGvectorConverter implements AttributeConverter<PGvector, String> {

    @Override
    public String convertToDatabaseColumn(PGvector attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.toString();
    }

    @Override
    public PGvector convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            return new PGvector(dbData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert database value to PGvector: " + e.getMessage(), e);
        }
    }
}