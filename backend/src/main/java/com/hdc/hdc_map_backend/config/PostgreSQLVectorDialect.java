package com.hdc.hdc_map_backend.config;

import org.hibernate.dialect.PostgreSQLDialect;
import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.query.sqm.function.SqmFunctionRegistry;
import org.hibernate.type.StandardBasicTypes;

/**
 * Custom PostgreSQL dialect that adds support for pgvector operations
 */
public class PostgreSQLVectorDialect extends PostgreSQLDialect {

    @Override
    public void initializeFunctionRegistry(FunctionContributions functionContributions) {
        super.initializeFunctionRegistry(functionContributions);

        SqmFunctionRegistry functionRegistry = functionContributions.getFunctionRegistry();

        // Register vector distance operator (<=>)
        functionRegistry.registerPattern(
            "vector_distance",
            "(?1 <=> ?2)",
            functionContributions.getTypeConfiguration().getBasicTypeRegistry().resolve(StandardBasicTypes.DOUBLE)
        );

        // Register vector similarity (1 - distance)
        functionRegistry.registerPattern(
            "vector_similarity",
            "(1 - (?1 <=> ?2))",
            functionContributions.getTypeConfiguration().getBasicTypeRegistry().resolve(StandardBasicTypes.DOUBLE)
        );

        // Register vector inner product (<#>)
        functionRegistry.registerPattern(
            "vector_inner_product",
            "(?1 <#> ?2)",
            functionContributions.getTypeConfiguration().getBasicTypeRegistry().resolve(StandardBasicTypes.DOUBLE)
        );

        // Register vector cosine distance
        functionRegistry.registerPattern(
            "vector_cosine_distance",
            "(?1 <-> ?2)",
            functionContributions.getTypeConfiguration().getBasicTypeRegistry().resolve(StandardBasicTypes.DOUBLE)
        );
    }
}