// d:\job-connection\job_connecction_be\src\modules\job\create-job-index.js
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
        const collection = db.collection("jobs");

        // Check if documents have embeddings
        const sampleDoc = await collection.findOne({ embedding: { $exists: true } });
        if (!sampleDoc) {
            console.error("❌ No jobs with embeddings found.");
            console.log("💡 Run create-job-embeddings.js first to generate embeddings.");
            process.exit(1);
        }

        console.log(`✅ Found embeddings with ${sampleDoc.embedding.length} dimensions\n`);

        // Define the search index
        const indexDefinition = {
            name: "vector_index_job",
            type: "vectorSearch",
            definition: {
                fields: [
                    {
                        type: "vector",
                        path: "embedding",
                        numDimensions: sampleDoc.embedding.length,
                        similarity: "cosine"
                    }
                ]
            }
        };

        console.log("Creating vector search index for jobs...");
        console.log("Index config:", JSON.stringify(indexDefinition, null, 2));
        
        // Create the search index
        const result = await collection.createSearchIndex(indexDefinition);
        
        console.log("\n✅ Job vector search index created successfully!");
        console.log("Index name:", result);
        console.log("\n⚠️  IMPORTANT: It may take a few minutes for the index to be built.");
        console.log("Check status at: https://cloud.mongodb.com/");
        console.log("Navigate to: Database > Search > Indexes");
        
    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.codeName === 'IndexAlreadyExists') {
            console.log("\n⚠️  Index already exists.");
            console.log("If you need to update it, go to MongoDB Atlas UI:");
            console.log("1. Delete the old index");
            console.log("2. Run this script again");
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);