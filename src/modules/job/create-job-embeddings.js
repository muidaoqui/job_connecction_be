// d:\job-connection\job_connecction_be\src\modules\job\create-job-embeddings.js
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

        // Filter to exclude documents without required fields
        const filter = { 
            "title": { "$nin": [ null, "" ] },
            "description": { "$nin": [ null, "" ] }
        };

        const documents = await collection.find(filter).limit(100).toArray();
        console.log(`Found ${documents.length} job documents to process\n`);

        if (documents.length === 0) {
            console.log("❌ No jobs found to process");
            process.exit(0);
        }

        console.log("Generating embeddings for jobs...");
        const updateDocuments = [];
        let processed = 0;
        
        for (const doc of documents) {
            try {
                // Combine all relevant fields for embedding
                const textParts = [
                    doc.title,
                    doc.description,
                    doc.requirements || '',
                    doc.location || '',
                    doc.salary || '',
                    doc.jobType || ''
                ].filter(Boolean);

                const textToEmbed = textParts.join(' - ');
                
                console.log(`Processing [${++processed}/${documents.length}]: ${doc.title}`);
                const embedding = await getEmbedding(textToEmbed);
                
                updateDocuments.push({
                    updateOne: { 
                        filter: { "_id": doc._id },
                        update: { 
                            $set: { 
                                "embedding": embedding,
                                "embeddingText": textToEmbed,
                                "embeddingUpdatedAt": new Date()
                            } 
                        }
                    }
                });
            } catch (err) {
                console.error(`Error processing job ${doc._id}:`, err.message);
            }
        }

        if (updateDocuments.length > 0) {
            console.log(`\nUpdating ${updateDocuments.length} jobs in database...`);
            const options = { ordered: false };
            const result = await collection.bulkWrite(updateDocuments, options); 
            console.log(`\n✅ Job embeddings created: ${result.modifiedCount}`);
            console.log(`   - Matched: ${result.matchedCount}`);
            console.log(`   - Modified: ${result.modifiedCount}`);
        } else {
            console.log("No jobs to update");
        }
            
    } catch (err) {
        console.error("❌ Error:", err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);