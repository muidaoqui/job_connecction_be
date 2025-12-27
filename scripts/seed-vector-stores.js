// scripts/seed-vector-stores.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vectorStore from '../src/modules/RAG/rag.vectorstore.js';
import embeddingsService from '../src/modules/RAG/rag.embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed vector stores with initial HR knowledge base data
 */
async function seedVectorStores() {
    try {
        console.log('🌱 Starting vector store seeding...\n');

        // Initialize services
        await vectorStore.initialize();
        embeddingsService.initialize();

        // Define data files
        const dataFiles = {
            marketTrends: path.join(__dirname, '../data/hr-knowledge-base/market-trends.json'),
            jdTemplates: path.join(__dirname, '../data/hr-knowledge-base/jd-templates.json'),
            salaryData: path.join(__dirname, '../data/hr-knowledge-base/salary-data.json'),
        };

        // Seed each collection
        for (const [collectionName, filePath] of Object.entries(dataFiles)) {
            console.log(`📥 Seeding ${collectionName}...`);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  File not found: ${filePath}`);
                continue;
            }

            // Read data
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(rawData);

            if (!Array.isArray(data) || data.length === 0) {
                console.warn(`⚠️  No data in ${filePath}`);
                continue;
            }

            // Extract documents and metadata
            const documents = data.map(item => item.content);
            const metadatas = data.map(item => item.metadata);

            console.log(`   Found ${documents.length} documents`);

            // Generate embeddings
            console.log(`   Generating embeddings...`);
            const embeddings = await embeddingsService.embedBatch(documents);

            // Add to vector store
            console.log(`   Adding to vector store...`);
            const result = await vectorStore.addDocuments(
                collectionName,
                documents,
                embeddings,
                metadatas
            );

            console.log(`   ✅ Added ${result.count} documents to ${collectionName}\n`);
        }

        // Get stats
        console.log('📊 Vector Store Statistics:');
        const stats = await vectorStore.getAllStats();
        for (const [name, stat] of Object.entries(stats)) {
            console.log(`   ${name}: ${stat.count} documents`);
        }

        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding vector stores:', error);
        process.exit(1);
    }
}

// Run seeding
seedVectorStores();
