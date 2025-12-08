// d:\job-connection\job_connecction_be\src\modules\job\vector-query-job.js
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { getEmbedding } from '../candidate/embedding/get-embeddings.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory and load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

async function run() {
    try {
        // Validate MongoDB URI
        if (!mongoUri) {
            console.error("❌ Error: MONGODB_URI or MONGO_URI is not defined");
            process.exit(1);
        }

        // Connect to the MongoDB client
        await client.connect();
        console.log("✅ Connected to MongoDB\n");

        // Specify the database and collection
        const database = client.db("job-connection-web-app"); 
        const collection = database.collection("jobs"); 

        // Check if collection has documents with embeddings
        const count = await collection.countDocuments({ embedding: { $exists: true } });
        console.log(`📊 Found ${count} jobs with embeddings\n`);

        if (count === 0) {
            console.error("❌ No jobs with embeddings found.");
            console.log("💡 Run create-job-embeddings.js first to generate embeddings.");
            process.exit(1);
        }

        // Get search query from command line or use default
        const searchQuery = process.argv[2] || "software developer javascript react";
        console.log(`🔍 Searching jobs for: "${searchQuery}"\n`);

        // Generate embedding for the search query
        console.log("⏳ Generating query embedding...");
        const queryEmbedding = await getEmbedding(searchQuery);
        console.log(`✅ Generated embedding with ${queryEmbedding.length} dimensions\n`);

        // Define the vector search pipeline
        const pipeline = [
            {
                $vectorSearch: {
                    index: "vector_index_job",
                    queryVector: queryEmbedding,
                    path: "embedding",
                    numCandidates: 100,
                    limit: 10
                }
            },
            {
                $lookup: {
                    from: "companies",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "company"
                }
            },
            {
                $unwind: {
                    path: "$company",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    requirements: 1,
                    salary: 1,
                    location: 1,
                    jobType: 1,
                    recruiterId: 1,
                    companyId: 1,
                    companyName: "$company.name",
                    embeddingText: 1,
                    score: {
                        $meta: "vectorSearchScore"
                    }
                }
            }
        ];

        // Run pipeline
        console.log("🔎 Searching...\n");
        const result = collection.aggregate(pipeline);

        // Print results
        console.log("📊 Results:\n");
        console.log("=".repeat(100));
        
        let count_results = 0;
        for await (const doc of result) {
            count_results++;
            console.log(`\n${count_results}. ${doc.title}`);
            console.log(`   Score: ${doc.score.toFixed(6)}`);
            if (doc.companyName) {
                console.log(`   Company: ${doc.companyName}`);
            }
            if (doc.location) {
                console.log(`   Location: ${doc.location}`);
            }
            if (doc.salary) {
                console.log(`   Salary: ${doc.salary}`);
            }
            if (doc.jobType) {
                console.log(`   Job Type: ${doc.jobType}`);
            }
            if (doc.description) {
                const desc = doc.description.length > 150 
                    ? doc.description.substring(0, 150) + "..."
                    : doc.description;
                console.log(`   Description: ${desc}`);
            }
            if (doc.requirements) {
                const req = doc.requirements.length > 100 
                    ? doc.requirements.substring(0, 100) + "..."
                    : doc.requirements;
                console.log(`   Requirements: ${req}`);
            }
            console.log(`   Job ID: ${doc._id}`);
        }

        console.log("\n" + "=".repeat(100));
        
        if (count_results === 0) {
            console.log("\n❌ No results found.");
            console.log("\n💡 Troubleshooting steps:");
            console.log("1. Check if vector index exists in MongoDB Atlas");
            console.log("2. Wait a few minutes for index to finish building");
            console.log("3. Run: node create-job-index.js to create the index");
            console.log("4. Verify embeddings exist: check MongoDB documents");
        } else {
            console.log(`\n✅ Found ${count_results} matching jobs`);
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        
        if (error.code === 31082 || error.codeName === 'IndexNotFound') {
            console.log("\n💡 Vector search index not found!");
            console.log("Solution:");
            console.log("1. Run: cd D:\\job-connection\\job_connecction_be\\src\\modules\\job");
            console.log("2. Run: node create-job-index.js");
            console.log("3. Wait 2-5 minutes for index to build");
            console.log("4. Check index status in MongoDB Atlas UI");
        } else if (error.code === 40324) {
            console.log("\n💡 The index is still building or has an error");
            console.log("Check MongoDB Atlas UI: Database > Search > Indexes");
        } else {
            console.log("\n💡 Full error:", error);
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);