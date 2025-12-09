// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\vector-query-all.js
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { getEmbedding } from './get-embeddings.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory and load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

async function searchCollection(database, collectionName, queryEmbedding, indexName, limit = 5) {
    const collection = database.collection(collectionName);

    const pipeline = [
        {
            $vectorSearch: {
                index: indexName,
                queryVector: queryEmbedding,
                path: "embedding",
                exact: true,
                limit: limit
            }
        },
        {
            $project: {
                _id: 1,
                userId: 1,
                embeddingText: 1,
                score: {
                    $meta: "vectorSearchScore"
                }
            }
        }
    ];

    try {
        const results = await collection.aggregate(pipeline).toArray();
        return results;
    } catch (error) {
        console.error(`Error searching ${collectionName}:`, error.message);
        return [];
    }
}

async function run() {
    try {
        // Connect to the MongoDB client
        await client.connect();
        const database = client.db("job-connection-web-app");

        // Get search query from command line or use default
        const searchQuery = process.argv[2] || "software engineer with react experience";
        console.log(`\n🔍 Searching all collections for: "${searchQuery}"\n`);

        // Generate embedding for the search query
        console.log("⏳ Generating query embedding...");
        const queryEmbedding = await getEmbedding(searchQuery);
        console.log("✅ Embedding generated\n");

        const collections = [
            { name: "candidates", indexName: "vector_index_candidate", label: "Candidates" },
            { name: "experiences", indexName: "vector_index_experience", label: "Experiences" },
            { name: "educations", indexName: "vector_index_education", label: "Education" },
            { name: "projects", indexName: "vector_index_project", label: "Projects" },
            { name: "skills", indexName: "vector_index_skill", label: "Skills" }
        ];

        console.log("=" .repeat(80));
        
        for (const { name, indexName, label } of collections) {
            console.log(`\n📊 ${label.toUpperCase()}`);
            console.log("-".repeat(80));
            
            const results = await searchCollection(database, name, queryEmbedding, indexName, 3);
            
            if (results.length === 0) {
                console.log("   ❌ No results found");
            } else {
                results.forEach((doc, index) => {
                    console.log(`   ${index + 1}. Score: ${doc.score.toFixed(4)}`);
                    console.log(`      Text: ${doc.embeddingText?.substring(0, 100)}...`);
                    console.log(`      User ID: ${doc.userId || doc._id}`);
                });
            }
        }

        console.log("\n" + "=".repeat(80));
        console.log("✅ Search complete\n");

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);