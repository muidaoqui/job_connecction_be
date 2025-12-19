// d:\job-connection\job_connecction_be\src\modules\candidate\create-candidate-index.js
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory and load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function run() {
    if (!mongoUri) {
        console.error("❌ Error: MONGODB_URI or MONGO_URI is not defined");
        process.exit(1);
    }

    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log("✅ Connected to MongoDB\n");
        
        const db = client.db("job-connection-web-app");
        const collection = db.collection("candidates");

        // Check if documents have embeddings
        const sampleDoc = await collection.findOne({ embedding: { $exists: true } });
        if (!sampleDoc) {
            console.error("❌ No candidates with embeddings found.");
            console.log("💡 Run create-embeddings-candidate.js first to generate embeddings.");
            process.exit(1);
        }

        const numDimensions = sampleDoc.embedding.length;
        console.log(`✅ Found embeddings with ${numDimensions} dimensions`);
        
        // Check embedding components info
        if (sampleDoc.embeddingComponents) {
            console.log(`✅ Embedding includes:`);
            console.log(`   - Experiences: ${sampleDoc.embeddingComponents.experiencesCount || 0}`);
            console.log(`   - Education: ${sampleDoc.embeddingComponents.educationsCount || 0}`);
            console.log(`   - Projects: ${sampleDoc.embeddingComponents.projectsCount || 0}`);
            console.log(`   - Skills: ${sampleDoc.embeddingComponents.skillsCount || 0}`);
        }
        
        console.log("");

        // Define the search index
        const indexDefinition = {
            name: "vector_index_candidate",
            type: "vectorSearch",
            definition: {
                fields: [
                    {
                        type: "vector",
                        path: "embedding",
                        numDimensions: numDimensions,
                        similarity: "cosine"
                    }
                ]
            }
        };

        console.log("Creating vector search index for candidates...");
        console.log("Index configuration:", JSON.stringify(indexDefinition, null, 2));
        console.log("");
        
        // Create the search index
        const result = await collection.createSearchIndex(indexDefinition);
        
        console.log("=".repeat(80));
        console.log("✅ Candidate vector search index created successfully!");
        console.log("=".repeat(80));
        console.log(`Index name: ${result}`);
        console.log(`Index type: vectorSearch`);
        console.log(`Dimensions: ${numDimensions}`);
        console.log(`Similarity: cosine`);
        console.log("");
        console.log("⚠️  IMPORTANT NOTES:");
        console.log("1. It may take 2-5 minutes for the index to be built and become available");
        console.log("2. Check index status in MongoDB Atlas UI:");
        console.log("   https://cloud.mongodb.com/");
        console.log("   Navigate to: Database > Browse Collections > Search Indexes");
        console.log("3. Index status should show 'Active' before running queries");
        console.log("");
        console.log("✅ Once index is active, you can run:");
        console.log("   node vector-query-candidate.js \"your search query\"");
        
    } catch (err) {
        console.error("❌ Error:", err.message);
        
        if (err.codeName === 'IndexAlreadyExists') {
            console.log("\n⚠️  Index 'vector_index_candidate' already exists.");
            console.log("\nOptions:");
            console.log("1. Use the existing index - it's ready to use!");
            console.log("2. If you need to recreate it:");
            console.log("   a. Go to MongoDB Atlas UI");
            console.log("   b. Navigate to: Database > Search > Indexes");
            console.log("   c. Delete 'vector_index_candidate'");
            console.log("   d. Run this script again");
            console.log("\n💡 To test the existing index:");
            console.log("   node vector-query-candidate.js \"senior developer\"");
        } else {
            console.error("\nFull error details:", err);
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);