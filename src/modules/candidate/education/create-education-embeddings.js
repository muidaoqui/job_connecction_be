// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\create-education-embeddings.js
import { MongoClient } from 'mongodb';
import { getEmbedding } from '../embedding/get-embeddings.js';

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        const collection = db.collection("educations");

        // Filter to exclude documents without required fields
        const filter = { 
            "school": { "$nin": [ null, "" ] },
            "degree": { "$nin": [ null, "" ] },
            "fieldOfStudy": { "$nin": [ null, "" ] }
        };

        const documents = await collection.find(filter).limit(100).toArray();
        console.log(`Found ${documents.length} education documents to process`);

        console.log("Generating embeddings for education...");
        const updateDocuments = [];
        
        await Promise.all(documents.map(async doc => {
            try {
                // Combine relevant fields for embedding
                const textToEmbed = [
                    doc.school,
                    doc.degree,
                    doc.fieldOfStudy,
                    doc.grade || '',
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
                console.error(`Error processing education ${doc._id}:`, err.message);
            }
        }));

        if (updateDocuments.length > 0) {
            const options = { ordered: false };
            const result = await collection.bulkWrite(updateDocuments, options); 
            console.log("Education embeddings created: " + result.modifiedCount); 
        } else {
            console.log("No education records to update");
        }
            
    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);