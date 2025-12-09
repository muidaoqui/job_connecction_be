import { MongoClient } from 'mongodb';
import { getEmbedding } from '../embedding/get-embeddings.js';

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        const collection = db.collection("experiences");

        // Filter to exclude documents without required fields
        const filter = { 
            "jobTitle": { "$nin": [ null, "" ] },
            "company": { "$nin": [ null, "" ] }
        };

        const documents = await collection.find(filter).limit(100).toArray();
        console.log(`Found ${documents.length} experience documents to process`);

        console.log("Generating embeddings for experiences...");
        const updateDocuments = [];
        
        await Promise.all(documents.map(async doc => {
            try {
                // Combine relevant fields for embedding
                const textToEmbed = [
                    doc.jobTitle,
                    doc.company,
                    doc.description || ''
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
                console.error(`Error processing experience ${doc._id}:`, err.message);
            }
        }));

        if (updateDocuments.length > 0) {
            const options = { ordered: false };
            const result = await collection.bulkWrite(updateDocuments, options); 
            console.log("Experience embeddings created: " + result.modifiedCount); 
        } else {
            console.log("No experiences to update");
        }
            
    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
