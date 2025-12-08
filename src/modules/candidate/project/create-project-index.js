// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\create-project-index.js
import { MongoClient } from 'mongodb';

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        const collection = db.collection("projects");

        // Define the search index
        const indexDefinition = {
            name: "vector_index_project",
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

        console.log("Creating vector search index for projects...");
        
        // Create the search index
        const result = await collection.createSearchIndex(indexDefinition);
        
        console.log("Project vector search index created successfully!");
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