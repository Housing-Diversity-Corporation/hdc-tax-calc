# PGVector SQL Syntax Notes

## IDE SQL Syntax Warnings

The IDE (VSCode with Spring Boot extension) shows SQL syntax errors for pgvector-specific operators and types because it defaults to MySQL validation. These are **false positives** and the queries will work correctly at runtime with PostgreSQL.

## PGVector Operators

The following PostgreSQL pgvector operators are used in the repositories:

- `<=>` - L2 (Euclidean) distance operator
- `<->` - Cosine distance operator
- `<#>` - Inner product operator
- `cast(:param as vector)` - Casting string to vector type

## Affected Repositories

The following repositories contain native SQL queries with pgvector syntax:

1. **UserInteractionRepository**
   - `findSimilarUserInteractions()` - Uses `<=>` operator for vector similarity search
   - `findSimilarGlobalInteractions()` - Uses `<=>` operator for global similarity search

2. **LayerMetadataRepository**
   - `findRelevantLayers()` - Uses `<=>` operator with similarity threshold
   - `findByKeywords()` - Uses PostgreSQL array operations

3. **SemanticCacheRepository**
   - `findBySimilarEmbedding()` - Uses `<=>` operator for cache lookup

## Configuration

The application is configured to use PostgreSQL with pgvector:

- Custom dialect: `PostgreSQLVectorDialect` extends PostgreSQL dialect
- PGVector configuration: `PgVectorConfig` ensures extension is loaded
- Database properties specify PostgreSQL in `application.properties`

## Runtime Behavior

At runtime:
1. The pgvector extension is verified/created by `PgVectorConfig`
2. Native queries execute correctly against PostgreSQL
3. PGvector type conversions are handled by utility classes

## Suppressing IDE Warnings

To reduce IDE warnings, the queries have been:
1. Reformatted from text blocks to string concatenation
2. Documented with comments explaining they are PostgreSQL-specific
3. Configured with proper Spring Data annotations

The warnings can be safely ignored as they do not affect runtime functionality.