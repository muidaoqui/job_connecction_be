// d:\job-connection\job_connecction_be\src\modules\candidate\create-candidate-embeddings.js
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
        
        // Get all collections
        const candidatesCollection = db.collection("candidates");
        const experiencesCollection = db.collection("experiences");
        const educationsCollection = db.collection("educations");
        const projectsCollection = db.collection("projects");
        const skillsCollection = db.collection("skills");

        // Get all candidates
        const candidates = await candidatesCollection.find({}).toArray();
        console.log(`Found ${candidates.length} candidates to process\n`);

        if (candidates.length === 0) {
            console.log("❌ No candidates found");
            process.exit(0);
        }

        const updateDocuments = [];
        let processed = 0;

        for (const candidate of candidates) {
            try {
                processed++;
                const userId = candidate.userId;
                console.log(`\n[${processed}/${candidates.length}] Processing candidate: ${candidate._id}`);
                
                // Collect all text parts for embedding
                const textParts = [];

                // 1. Candidate basic info
                if (candidate.profileSummary) {
                    textParts.push(`Profile: ${candidate.profileSummary}`);
                }
                if (candidate.gender) {
                    textParts.push(`Gender: ${candidate.gender}`);
                }
                if (candidate.address) {
                    textParts.push(`Location: ${candidate.address}`);
                }
                const now = new Date();
                const birthDate = new Date(candidate.dateOfBirth);
                const ageDifMs = now - birthDate;
                const ageDate = new Date(ageDifMs);
                const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                if (age) {
                    textParts.push(`Age: ${age}`);
                }

                // 2. Get and aggregate experiences
                const experiences = await experiencesCollection.find({ userId }).toArray();
                if (experiences.length > 0) {
                    console.log(`  - Found ${experiences.length} experiences`);
                    experiences.forEach(exp => {
                        if (exp.embeddingText) {
                            textParts.push(`Experience: ${exp.embeddingText}`);
                        } else {
                            const expText = [exp.jobTitle, exp.company, exp.description]
                                .filter(Boolean).join(' - ');
                            if (expText) textParts.push(`Experience: ${expText}`);
                        }
                    });
                }

                // 3. Get and aggregate education
                const educations = await educationsCollection.find({ userId }).toArray();
                if (educations.length > 0) {
                    console.log(`  - Found ${educations.length} education records`);
                    educations.forEach(edu => {
                        if (edu.embeddingText) {
                            textParts.push(`Education: ${edu.embeddingText}`);
                        } else {
                            const eduText = [edu.school, edu.degree, edu.fieldOfStudy]
                                .filter(Boolean).join(' - ');
                            if (eduText) textParts.push(`Education: ${eduText}`);
                        }
                    });
                }

                // 4. Get and aggregate projects
                const projects = await projectsCollection.find({ userId }).toArray();
                if (projects.length > 0) {
                    console.log(`  - Found ${projects.length} projects`);
                    projects.forEach(proj => {
                        if (proj.embeddingText) {
                            textParts.push(`Project: ${proj.embeddingText}`);
                        } else {
                            const projText = [proj.projectName, proj.description, (proj.skills || []).join(', ')]
                                .filter(Boolean).join(' - ');
                            if (projText) textParts.push(`Project: ${projText}`);
                        }
                    });
                }

                // 5. Get and aggregate skills
                const skills = await skillsCollection.find({ userId }).toArray();
                if (skills.length > 0) {
                    console.log(`  - Found ${skills.length} skills`);
                    const skillTexts = skills.map(skill => {
                        if (skill.embeddingText) {
                            return skill.embeddingText;
                        }
                        return `${skill.skillName} (${skill.proficiency || 'N/A'})`;
                    }).filter(Boolean);
                    if (skillTexts.length > 0) {
                        textParts.push(`Skills: ${skillTexts.join(', ')}`);
                    }
                }

                // Combine all text parts
                if (textParts.length === 0) {
                    console.log(`  ⚠️ No data found for candidate ${candidate._id}, skipping...`);
                    continue;
                }

                const textToEmbed = textParts.join(' | ');
                console.log(`  - Total text length: ${textToEmbed.length} characters`);
                console.log(`  - Generating embedding...`);

                // Generate embedding
                const embedding = await getEmbedding(textToEmbed);
                
                updateDocuments.push({
                    updateOne: { 
                        filter: { "_id": candidate._id },
                        update: { 
                            $set: { 
                                "embedding": embedding,
                                "embeddingText": textToEmbed,
                                "embeddingUpdatedAt": new Date(),
                                "embeddingComponents": {
                                    experiencesCount: experiences.length,
                                    educationsCount: educations.length,
                                    projectsCount: projects.length,
                                    skillsCount: skills.length
                                }
                            } 
                        }
                    }
                });
                
                console.log(`  ✅ Embedding created`);
                
            } catch (err) {
                console.error(`  ❌ Error processing candidate ${candidate._id}:`, err.message);
            }
        }

        if (updateDocuments.length > 0) {
            console.log(`\n\nUpdating ${updateDocuments.length} candidates in database...`);
            const options = { ordered: false };
            const result = await candidatesCollection.bulkWrite(updateDocuments, options); 
            
            console.log("\n" + "=".repeat(80));
            console.log("✅ Candidate embeddings created successfully!");
            console.log(`   - Matched: ${result.matchedCount}`);
            console.log(`   - Modified: ${result.modifiedCount}`);
            console.log("=".repeat(80));
        } else {
            console.log("\n❌ No candidates to update");
        }
            
    } catch (err) {
        console.error("❌ Error:", err.stack);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);