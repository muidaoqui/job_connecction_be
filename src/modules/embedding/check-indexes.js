// check-indexes.js
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkAllIndexes() {
    const client = new MongoClient(mongoUri);
    
    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        
        const collections = [
            "candidates",
            "experiences", 
            "educations",
            "projects",
            "skills",
            "jobs"
        ];
        
        console.log("=".repeat(80));
        console.log("📊 Checking Search Indexes across all collections");
        console.log("=".repeat(80));
        
        let totalIndexes = 0;
        
        for (const collName of collections) {
            const collection = db.collection(collName);
            
            try {
                const indexes = await collection.listSearchIndexes().toArray();
                
                if (indexes.length > 0) {
                    console.log(`\n✅ ${collName}:`);
                    indexes.forEach(idx => {
                        totalIndexes++;
                        console.log(`   ${totalIndexes}. Name: ${idx.name}`);
                        console.log(`      Status: ${idx.status || idx.queryable || 'UNKNOWN'}`);
                        console.log(`      Type: ${idx.type || 'N/A'}`);
                    });
                } else {
                    console.log(`\n⚪ ${collName}: No search indexes`);
                }
            } catch (err) {
                console.log(`\n❌ ${collName}: Error - ${err.message}`);
            }
        }
        
        console.log("\n" + "=".repeat(80));
        console.log(`📊 Total Search Indexes: ${totalIndexes}`);
        console.log("⚠️  MongoDB Free Tier (M0) limit: 3 indexes");
        
        if (totalIndexes >= 3) {
            console.log("\n❌ You've reached the maximum limit!");
            console.log("\n💡 Solutions:");
            console.log("1. Delete unused indexes in MongoDB Atlas UI");
            console.log("2. Upgrade to M10+ tier for more indexes");
            console.log("3. Combine multiple collections into fewer indexes");
        } else {
            console.log(`\n✅ You can create ${3 - totalIndexes} more index(es)`);
        }
        
        console.log("\n📝 To delete indexes:");
        console.log("1. Go to: https://cloud.mongodb.com/");
        console.log("2. Select your cluster");
        console.log("3. Click 'Search' tab");
        console.log("4. Delete unnecessary indexes");
        
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.close();
    }
}

checkAllIndexes();