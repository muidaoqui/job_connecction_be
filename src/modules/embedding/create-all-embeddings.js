// d:\job-connection\job_connecction_be\src\modules\candidate\embedding\create-all-embeddings.js
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { getEmbedding } from './get-embeddings.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function processCollection(db, collectionName, filter, textBuilder) {
    const collection = db.collection(collectionName);
    const documents = await collection.find(filter).limit(100).toArray();
    console.log(`\n[${collectionName}] Found ${documents.length} documents to process`);

    if (documents.length === 0) {
        console.log(`[${collectionName}] No documents to update`);
        return 0;
    }

    const updateDocuments = [];
    
    await Promise.all(documents.map(async doc => {
        try {
            const textToEmbed = textBuilder(doc);
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
            console.error(`[${collectionName}] Error processing ${doc._id}:`, err.message);
        }
    }));

    if (updateDocuments.length > 0) {
        const options = { ordered: false };
        const result = await collection.bulkWrite(updateDocuments, options); 
        console.log(`[${collectionName}] Embeddings created: ${result.modifiedCount}`);
        return result.modifiedCount;
    }
    
    return 0;
}

async function run() {
    // Validate MONGODB_URI or MONGO_URI
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
        console.error("❌ Error: MONGODB_URI or MONGO_URI is not defined in environment variables");
        console.log("\nPlease create a .env file in the root directory with:");
        console.log("MONGODB_URI=your_mongodb_connection_string");
        console.log("\nCurrent env vars loaded:", Object.keys(process.env).filter(k => k.includes('MONGO')));
        process.exit(1);
    }

    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        const db = client.db("job-connection-web-app");
        
        console.log("=== Starting embedding generation for all collections ===");
        const startTime = Date.now();

        // Process Experiences
        const experienceCount = await processCollection(
            db,
            "experiences",
            { 
                "jobTitle": { "$nin": [ null, "" ] },
                "company": { "$nin": [ null, "" ] }
            },
            (doc) => [
                doc.jobTitle,
                doc.company,
                doc.description || ''
            ].filter(Boolean).join(' - ')
        );

        // Process Education
        const educationCount = await processCollection(
            db,
            "educations",
            { 
                "school": { "$nin": [ null, "" ] },
                "degree": { "$nin": [ null, "" ] },
                "fieldOfStudy": { "$nin": [ null, "" ] }
            },
            (doc) => [
                doc.school,
                doc.degree,
                doc.fieldOfStudy,
                doc.grade || '',
                doc.description || ''
            ].filter(Boolean).join(' - ')
        );

        // Process Projects
        const projectCount = await processCollection(
            db,
            "projects",
            { 
                "projectName": { "$nin": [ null, "" ] }
            },
            (doc) => [
                doc.projectName,
                doc.description || '',
                (doc.skills || []).join(', ')
            ].filter(Boolean).join(' - ')
        );

        // Process Skills
        const skillCount = await processCollection(
            db,
            "skills",
            { 
                "skillName": { "$nin": [ null, "" ] }
            },
            (doc) => [
                doc.skillName,
                doc.proficiency || ''
            ].filter(Boolean).join(' - ')
        );

        // Process Jobs
        const jobCount = await processCollection(
            db,
            "jobs",
            { 
                "title": { "$nin": [ null, "" ] },
                "description": { "$nin": [ null, "" ] }
            },
            (doc) => [
                doc.title,
                doc.description,
                doc.requirements || '',
                doc.location || '',
                doc.salary || '',
                doc.jobType || ''
            ].filter(Boolean).join(' - ')
        );

        // Process Candidates (existing)
        const candidateCount = await processCollection(
            db,
            "candidates",
            { 
                "summary": { "$nin": [ null, "" ] }
            },
            (doc) => doc.summary
        );

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n=== Embedding Generation Complete ===");
        console.log(`Total time: ${duration}s`);
        console.log(`Summary:`);
        console.log(`  - Experiences: ${experienceCount}`);
        console.log(`  - Education: ${educationCount}`);
        console.log(`  - Projects: ${projectCount}`);
        console.log(`  - Skills: ${skillCount}`);
        console.log(`  - Jobs: ${jobCount}`);
        console.log(`  - Total: ${experienceCount + educationCount + projectCount + skillCount + jobCount + candidateCount}`);
            
    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);