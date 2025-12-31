# RAG Service Setup Guide

## Overview
The RAG (Retrieval-Augmented Generation) service uses embeddings to enable semantic search and context retrieval. Since your local machine has limited RAM (8GB), we use API-based embedding services instead of local models.

## Configuration Options

### Option 1: AWS Bedrock with API Key (Simplest - NEW!)
Amazon Bedrock now supports API keys for simplified development without IAM configuration.

#### Setup Steps:
1. **Your Bedrock API Key is already configured**:
   - The API key in your `application.properties` is ready to use
   - No AWS credentials or IAM setup needed!

2. **If you need a new API key**:
   - Log into AWS Console
   - Navigate to Amazon Bedrock
   - Go to Settings → API Keys
   - Create a new API key (short-term or long-term)
   - Update `bedrock.api.key` in your properties file

### Option 2: AWS Bedrock with IAM (Optional - for production)
For production environments, you can still use IAM-based authentication:

#### Setup Steps:
1. **Configure AWS Credentials** (choose one method):

   a. **Environment Variables**:
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key-here
   export AWS_SECRET_ACCESS_KEY=your-secret-key-here
   ```

   b. **AWS CLI Configuration**:
   ```bash
   aws configure
   ```

   c. **IAM Roles** (Best for EC2/ECS/Lambda deployments)

2. **Verify Bedrock Access**:
   - Log into AWS Console
   - Navigate to Amazon Bedrock
   - Ensure you have access to `amazon.titan-embed-text-v2:0` model in `us-east-2` region
   - If not, request access through the Bedrock Model Access page
   - Note: Titan V2 provides better quality embeddings with 1024 dimensions (vs 1536 for V1)

3. **Configuration is already set in your properties**:
   ```properties
   embedding.provider=bedrock
   bedrock.region=us-east-2
   bedrock.embedding.model=amazon.titan-embed-text-v2:0
   bedrock.api.key=YOUR_API_KEY_HERE  # Already configured!
   ```

### Option 3: OpenAI Embeddings (Alternative)
OpenAI provides high-quality embeddings but requires a paid API key.

#### Setup Steps:
1. **Get API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Add credits to your account

2. **Configure**:
   ```bash
   export OPENAI_API_KEY=sk-proj-your-key-here
   ```

3. **Set in application-local.properties**:
   ```properties
   embedding.provider=openai
   ```

## Testing Your Setup

### 1. Build and run the application:
```bash
cd hdc-map-backend
./mvnw clean compile
./mvnw spring-boot:run
```

### 2. Test embedding generation:
```bash
curl -X POST http://localhost:8080/api/rag-admin/test-embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "opportunity zones in Ohio"}'
```

Expected successful response:
```json
{
  "text": "opportunity zones in Ohio",
  "embeddingSize": 1024,
  "nonZeroValues": 1024,
  "status": "success"
}
```

### 3. Initialize layer embeddings:
```bash
curl -X POST http://localhost:8080/api/rag-admin/initialize-embeddings
```

### 4. Check embedding status:
```bash
curl http://localhost:8080/api/rag-admin/embedding-status
```

## Troubleshooting

### Issue: "Bedrock client not configured"
**Solution**: Check that your Bedrock API key is set in `application.properties`. If not using an API key, ensure AWS credentials are configured.

### Issue: "OpenAI API key invalid or expired"
**Solution**: Your OpenAI key is invalid. Get a new key from https://platform.openai.com/api-keys

### Issue: "Using fallback hash-based embedding"
**Solution**: Both API providers failed. This means:
- AWS credentials are not configured AND
- OpenAI API key is not set or invalid
The system will use deterministic embeddings as a fallback (lower quality but functional).

### Issue: PostgreSQL pgvector errors
**Solution**: Ensure your PostgreSQL database has the pgvector extension installed:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- For Titan V2 (1024 dimensions):
ALTER TABLE rag_schema.layer_metadata
  ALTER COLUMN description_embedding TYPE vector(1024);

ALTER TABLE rag_schema.user_interactions
  ALTER COLUMN query_embedding TYPE vector(1024);

-- Note: Adjust dimension size based on your embedding model
```

## Cost Considerations

### AWS Bedrock Titan Embeddings:
- Titan Text Embeddings V2: ~$0.00002 per 1000 input tokens
- Titan Text Embeddings V1: ~$0.0001 per 1000 tokens
- V2 is both cheaper and better quality
- Very cost-effective for production use

### OpenAI Embeddings:
- ~$0.0001 per 1000 tokens for ada-002
- Requires upfront credits

## Model Differences

### Titan Text Embeddings V2 (Recommended):
- **Dimensions**: 1024
- **Quality**: Better semantic understanding
- **Cost**: 5x cheaper than V1
- **Normalization**: Built-in L2 normalization
- **Max input**: 8192 tokens

### Titan Text Embeddings V1:
- **Dimensions**: 1536
- **Quality**: Good baseline performance
- **Cost**: Standard pricing
- **Max input**: 8192 tokens

## Database Schema
The RAG service expects these tables in the `rag_schema`:
- `layer_metadata` - Stores layer information with vector embeddings
- `user_interactions` - Stores user queries and actions with embeddings
- `conversation_memory` - Stores conversation history
- `user_patterns` - Stores user behavior patterns

## Security Notes
- Never commit API keys or AWS credentials to version control
- Use environment variables for API keys in production
- Bedrock API keys can be managed from AWS IAM Console
- Short-term API keys expire after 12 hours (safer for development)
- Long-term API keys should be rotated regularly
- Monitor API usage to prevent unexpected charges

## Bedrock API Key Types

### Short-term API Keys:
- Valid for console session duration (up to 12 hours)
- Ideal for development and testing
- Auto-expire for enhanced security

### Long-term API Keys:
- Configurable validity duration
- Managed through AWS IAM Console
- Better for production deployments
- Remember to rotate periodically