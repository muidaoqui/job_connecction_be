// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\create-project-embeddings.js
import { MongoClient } from 'mongodb';
import { getEmbedding } from '../embedding/get-embeddings.js';

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        const collection = db.collection("projects");

        // Filter to exclude documents without required fields
        const filter = { 
            "projectName": { "$nin": [ null, "" ] }
        };

        const documents = await collection.find(filter).limit(100).toArray();
        console.log(`Found ${documents.length} project documents to process`);

        console.log("Generating embeddings for projects...");
        const updateDocuments = [];
        
        await Promise.all(documents.map(async doc => {
            try {
                // Combine relevant fields for embedding
                const textToEmbed = [
                    doc.projectName,
                    doc.description || '',
                    (doc.skills || []).join(', ')
                ].filter(Boolean).join(' - ');

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
                console.error(`Error processing project ${doc._id}:`, err.message);
            }
        }));

        if (updateDocuments.length > 0) {
            const options = { ordered: false };
            const result = await collection.bulkWrite(updateDocuments, options); 
            console.log("Project embeddings created: " + result.modifiedCount); 
        } else {
            console.log("No projects to update");
        }
            
    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);