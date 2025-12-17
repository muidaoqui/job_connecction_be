// d:\job-connection\job_connecction_be\src\modules\candidate\vector-query-candidate.js
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { getEmbedding } from '../embedding/get-embeddings.js';
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
        const collection = database.collection("candidates"); 

        // Check if collection has documents with embeddings
        const count = await collection.countDocuments({ embedding: { $exists: true } });
        console.log(`📊 Found ${count} candidates with embeddings\n`);

        if (count === 0) {
            console.error("❌ No candidates with embeddings found.");
            console.log("💡 Run create-embeddings-candidate.js first to generate embeddings.");
            process.exit(1);
        }

        // Get search query from command line or use default
        const searchQuery = process.argv[2] || "experienced software developer with react nodejs";
        console.log(`🔍 Searching candidates for: "${searchQuery}"\n`);

        // Generate embedding for the search query
        console.log("⏳ Generating query embedding...");
        const queryEmbedding = await getEmbedding(searchQuery);
        console.log(`✅ Generated embedding with ${queryEmbedding.length} dimensions\n`);

        // Define the vector search pipeline with lookup to User collection
        const pipeline = [
            {
                $vectorSearch: {
                    index: "vector_index_candidate",
                    queryVector: queryEmbedding,
                    path: "embedding",
                    numCandidates: 100,
                    limit: 10
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    userName: "$user.name",
                    userEmail: "$user.email",
                    profileSummary: 1,
                    gender: 1,
                    address: 1,
                    avatarUrl: 1,
                    embeddingText: 1,
                    embeddingComponents: 1,
                    embeddingUpdatedAt: 1,
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
            console.log(`\n${count_results}. Candidate: ${doc.userName || 'N/A'}`);
            console.log(`   Score: ${doc.score.toFixed(6)}`);
            console.log(`   Candidate ID: ${doc._id}`);
            console.log(`   User ID: ${doc.userId}`);
            
            if (doc.userEmail) {
                console.log(`   Email: ${doc.userEmail}`);
            }
            
            if (doc.gender) {
                console.log(`   Gender: ${doc.gender}`);
            }
            
            if (doc.address) {
                console.log(`   Location: ${doc.address}`);
            }
            
            if (doc.profileSummary) {
                const summary = doc.profileSummary.length > 150 
                    ? doc.profileSummary.substring(0, 150) + "..."
                    : doc.profileSummary;
                console.log(`   Profile Summary: ${summary}`);
            }
            
            // Show embedding components count
            if (doc.embeddingComponents) {
                const comp = doc.embeddingComponents;
                console.log(`   Profile Completeness:`);
                console.log(`     - Experiences: ${comp.experiencesCount || 0}`);
                console.log(`     - Education: ${comp.educationsCount || 0}`);
                console.log(`     - Projects: ${comp.projectsCount || 0}`);
                console.log(`     - Skills: ${comp.skillsCount || 0}`);
            }
            
            // Show embedding text preview
            if (doc.embeddingText) {
                const textPreview = doc.embeddingText.length > 200 
                    ? doc.embeddingText.substring(0, 200) + "..."
                    : doc.embeddingText;
                console.log(`   Embedding Text Preview: ${textPreview}`);
            }
            
            if (doc.embeddingUpdatedAt) {
                console.log(`   Last Updated: ${new Date(doc.embeddingUpdatedAt).toLocaleString()}`);
            }
        }

        console.log("\n" + "=".repeat(100));
        
        if (count_results === 0) {
            console.log("\n❌ No results found.");
            console.log("\n💡 Troubleshooting steps:");
            console.log("1. Check if vector index exists in MongoDB Atlas");
            console.log("2. Wait a few minutes for index to finish building");
            console.log("3. Run: node create-candidate-index.js to create the index");
            console.log("4. Verify embeddings exist: check MongoDB documents");
            console.log("5. Try different search queries");
        } else {
            console.log(`\n✅ Found ${count_results} matching candidates`);
            console.log("\n💡 Tips:");
            console.log("- Try different search terms to refine results");
            console.log("- Search examples:");
            console.log("  node vector-query-candidate.js \"senior backend engineer python\"");
            console.log("  node vector-query-candidate.js \"frontend developer react vue\"");
            console.log("  node vector-query-candidate.js \"fullstack developer 5 years experience\"");
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        
        if (error.code === 31082 || error.codeName === 'IndexNotFound') {
            console.log("\n💡 Vector search index not found!");
            console.log("Solution:");
            console.log("1. Run: cd D:\\job-connection\\job_connecction_be\\src\\modules\\candidate");
            console.log("2. Run: node create-candidate-index.js");
            console.log("3. Wait 2-5 minutes for index to build");
            console.log("4. Check index status in MongoDB Atlas UI");
        } else if (error.code === 40324) {
            console.log("\n💡 The index is still building or has an error");
            console.log("Check MongoDB Atlas UI: Database > Search > Indexes");
        } else {
            console.log("\n💡 Full error:", error);
            console.error(error.stack);
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);