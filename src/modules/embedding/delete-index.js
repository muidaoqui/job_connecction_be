// delete-index.js - Xóa một index cụ thể
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function deleteIndex(collectionName, indexName) {
    const client = new MongoClient(mongoUri);
    
    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        const collection = db.collection(collectionName);
        
        console.log(`Deleting index '${indexName}' from '${collectionName}'...`);
        await collection.dropSearchIndex(indexName);
        console.log(`✅ Index deleted successfully!`);
        
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await client.close();
    }
}

// Lấy tham số từ command line
const collectionName = process.argv[2];
const indexName = process.argv[3];

if (!collectionName || !indexName) {
    console.log("Usage: node delete-index.js <collection> <index-name>");
    console.log("Example: node delete-index.js experiences vector_index_experience");
} else {
    deleteIndex(collectionName, indexName);
}