// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\create-all-indexes.js
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function createIndexForCollection(db, collectionName, indexName) {
    const collection = db.collection(collectionName);

    // First, check if collection has documents with embeddings
    const sampleDoc = await collection.findOne({ embedding: { $exists: true } });
    if (!sampleDoc) {
        console.log(`[${collectionName}] ⚠ No documents with embeddings found. Skipping...`);
        return { collection: collectionName, status: 'skipped', reason: 'No embeddings' };
    }

    const numDimensions = sampleDoc.embedding.length;
    console.log(`[${collectionName}] Found embeddings with ${numDimensions} dimensions`);

    const indexDefinition = {
        name: indexName,
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

    try {
        console.log(`[${collectionName}] Creating vector search index...`);
        const result = await collection.createSearchIndex(indexDefinition);
        console.log(`[${collectionName}] ✓ Index created: ${result}`);
        return { collection: collectionName, status: 'created', indexName: result };
    } catch (err) {
        if (err.codeName === 'IndexAlreadyExists') {
            console.log(`[${collectionName}] ⚠ Index already exists`);
            return { collection: collectionName, status: 'exists', indexName };
        } else {
            console.error(`[${collectionName}] ✗ Error: ${err.message}`);
            return { collection: collectionName, status: 'error', error: err.message };
        }
    }
}

async function run() {
    // Validate MONGODB_URI or MONGO_URI
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
        console.error("❌ Error: MONGODB_URI or MONGO_URI is not defined in environment variables");
        console.log("\nPlease ensure .env file exists in the root directory with:");
        console.log("MONGODB_URI=your_mongodb_connection_string");
        console.log("\nOR use:");
        console.log("MONGO_URI=your_mongodb_connection_string");
        process.exit(1);
    }

    console.log("✅ MongoDB URI loaded");
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log("✅ Connected to MongoDB\n");
        
        const db = client.db("job-connection-web-app");
        
        console.log("=== Creating Vector Search Indexes for All Collections ===");
        const startTime = Date.now();

        const collections = [
            { name: "candidates", indexName: "vector_index_candidate" },
            { name: "experiences", indexName: "vector_index_experience" },
            { name: "educations", indexName: "vector_index_education" },
            { name: "projects", indexName: "vector_index_project" },
            { name: "skills", indexName: "vector_index_skill" }
        ];

        const results = [];
        for (const { name, indexName } of collections) {
            const result = await createIndexForCollection(db, name, indexName);
            results.push(result);
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n" + "=".repeat(80));
        console.log("=== Index Creation Complete ===");
        console.log(`Total time: ${duration}s`);
        console.log("\nSummary:");
        
        const created = results.filter(r => r.status === 'created').length;
        const exists = results.filter(r => r.status === 'exists').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        const errors = results.filter(r => r.status === 'error').length;

        console.log(`  ✓ Created: ${created}`);
        console.log(`  ⚠ Already exists: ${exists}`);
        console.log(`  - Skipped: ${skipped}`);
        console.log(`  ✗ Errors: ${errors}`);

        if (skipped > 0) {
            console.log("\nSkipped collections (no embeddings):");
            results.filter(r => r.status === 'skipped').forEach(r => {
                console.log(`  - ${r.collection}: ${r.reason}`);
            });
            console.log("\n💡 Run create-all-embeddings.js first to generate embeddings");
        }

        if (errors > 0) {
            console.log("\nFailed collections:");
            results.filter(r => r.status === 'error').forEach(r => {
                console.log(`  - ${r.collection}: ${r.error}`);
            });
        }

        if (created > 0 || exists > 0) {
            console.log("\n⚠️  IMPORTANT NOTES:");
            console.log("1. It may take 2-5 minutes for indexes to be built and become available");
            console.log("2. Check index status in MongoDB Atlas UI:");
            console.log("   https://cloud.mongodb.com/");
            console.log("   Navigate to: Database > Browse Collections > Search Indexes");
            console.log("3. Index status should show 'Active' before running queries");
            console.log("\n✅ Once indexes are active, you can run vector-query scripts");
        }
            
    } catch (err) {
        console.error("❌ Fatal error:", err.message);
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);