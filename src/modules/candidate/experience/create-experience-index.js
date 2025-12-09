// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\create-experience-index.js
import { MongoClient } from 'mongodb';

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        const collection = db.collection("experiences");

        // Define the search index
        const indexDefinition = {
            name: "vector_index_experience",
            type: "vectorSearch",
            definition: {
                fields: [
                    {
                        type: "vector",
                        path: "embedding",
                        numDimensions: 768,
                        similarity: "cosine"
                    }
                ]
            }
        };

        console.log("Creating vector search index for experiences...");
        
        // Create the search index
        const result = await collection.createSearchIndex(indexDefinition);
        
        console.log("Experience vector search index created successfully!");
        console.log("Index name:", result);
        console.log("\nNote: It may take a few minutes for the index to be built and become available.");
        
    } catch (err) {
        console.error("Error creating index:", err.message);
        if (err.codeName === 'IndexAlreadyExists') {
            console.log("Index already exists. You can update it through MongoDB Atlas UI if needed.");
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);