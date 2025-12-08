// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\vector-query-project.js
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

async function run() {
    try {
        // Connect to the MongoDB client
        await client.connect();

        // Specify the database and collection
        const database = client.db("job-connection-web-app"); 
        const collection = database.collection("projects"); 

        // Get search query from command line or use default
        const searchQuery = process.argv[2] || "web application using react and nodejs";
        console.log(`\n🔍 Searching projects for: "${searchQuery}"\n`);

        // Generate embedding for the search query
        const queryEmbedding = await getEmbedding(searchQuery);

        // Define the vector search pipeline
        const pipeline = [
            {
                $vectorSearch: {
                    index: "vector_index_project",
                    queryVector: queryEmbedding,
                    path: "embedding",
                    exact: true,
                    limit: 10
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    projectName: 1,
                    description: 1,
                    startDate: 1,
                    endDate: 1,
                    skills: 1,
                    projectUrl: 1,
                    embeddingText: 1,
                    score: {
                        $meta: "vectorSearchScore"
                    }
                }
            }
        ];

        // Run pipeline
        const result = collection.aggregate(pipeline);

        // Print results
        console.log("📊 Results:\n");
        let count = 0;
        for await (const doc of result) {
            count++;
            console.log(`${count}. Score: ${doc.score.toFixed(4)}`);
            console.log(`   Project: ${doc.projectName}`);
            if (doc.description) {
                console.log(`   Description: ${doc.description.substring(0, 150)}...`);
            }
            if (doc.skills && doc.skills.length > 0) {
                console.log(`   Skills: ${doc.skills.join(', ')}`);
            }
            console.log(`   Period: ${new Date(doc.startDate).getFullYear()} - ${doc.endDate ? new Date(doc.endDate).getFullYear() : 'Present'}`);
            if (doc.projectUrl) {
                console.log(`   URL: ${doc.projectUrl}`);
            }
            console.log(`   User ID: ${doc.userId}`);
            console.log('');
        }

        if (count === 0) {
            console.log("❌ No results found. Make sure embeddings are created and index is built.");
        } else {
            console.log(`✅ Found ${count} matching projects`);
        }

    } catch (error) {
        console.error("Error:", error.message);
        if (error.codeName === 'IndexNotFound') {
            console.log("\n💡 Tip: Run create-project-index.js to create the vector search index first.");
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);