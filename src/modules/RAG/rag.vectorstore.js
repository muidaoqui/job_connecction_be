// rag.vectorstore.js
import { ChromaClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Vector Store Manager cho HR Agent
 * Quản lý 3 collections riêng biệt:
 * 1. market_trends - Xu hướng thị trường tuyển dụng
 * 2. jd_templates - Mẫu JD và best practices
 * 3. salary_data - Dữ liệu lương và benchmark
 */

class VectorStoreManager {
    constructor() {
        this.client = null;
        this.collections = {
            marketTrends: null,
            jdTemplates: null,
            salaryData: null,
        };
        this.isInitialized = false;
    }

    /**
     * Khởi tạo ChromaDB client và collections
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ Vector store already initialized');
            return;
        }

        try {
            // Kết nối ChromaDB (local instance)
            this.client = new ChromaClient({
                path: process.env.CHROMA_URL || 'http://localhost:8000',
            });

            console.log('🔗 Connecting to ChromaDB...');

            // Tạo hoặc lấy collections
            this.collections.marketTrends = await this.client.getOrCreateCollection({
                name: 'hr_market_trends',
                metadata: { description: 'Job market trends, skill demands, industry insights' },
            });

            this.collections.jdTemplates = await this.client.getOrCreateCollection({
                name: 'hr_jd_templates',
                metadata: { description: 'Job description templates and best practices' },
            });

            this.collections.salaryData = await this.client.getOrCreateCollection({
                name: 'hr_salary_data',
                metadata: { description: 'Salary benchmarks and compensation data' },
            });

            this.isInitialized = true;
            console.log('✅ Vector store initialized successfully');
            console.log('📊 Collections:', Object.keys(this.collections));
        } catch (error) {
            console.error('❌ Failed to initialize vector store:', error.message);
            // Fallback: Sử dụng in-memory mode nếu ChromaDB server chưa chạy
            console.warn('⚠️  ChromaDB server not available. Using fallback mode.');
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * Thêm documents vào collection
     * @param {string} collectionName - 'marketTrends' | 'jdTemplates' | 'salaryData'
     * @param {Array} documents - Array of document objects
     * @param {Array} embeddings - Pre-computed embeddings (optional)
     * @param {Array} metadatas - Metadata for each document
     */
    async addDocuments(collectionName, documents, embeddings = null, metadatas = null) {
        await this.ensureInitialized();

        const collection = this.collections[collectionName];
        if (!collection) {
            throw new Error(`Collection ${collectionName} not found`);
        }

        try {
            const ids = documents.map(() => uuidv4());

            const addParams = {
                ids,
                documents,
                metadatas: metadatas || documents.map(() => ({})),
            };

            // Nếu có embeddings được cung cấp, sử dụng luôn
            if (embeddings && embeddings.length === documents.length) {
                addParams.embeddings = embeddings;
            }

            await collection.add(addParams);

            console.log(`✅ Added ${documents.length} documents to ${collectionName}`);
            return { success: true, count: documents.length, ids };
        } catch (error) {
            console.error(`❌ Error adding documents to ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Semantic search trong collection
     * @param {string} collectionName - Collection name
     * @param {string} queryText - Query text
     * @param {number} topK - Number of results to return
     * @param {object} filter - Metadata filter (optional)
     */
    async search(collectionName, queryText, topK = 5, filter = null) {
        await this.ensureInitialized();

        const collection = this.collections[collectionName];
        if (!collection) {
            throw new Error(`Collection ${collectionName} not found`);
        }

        try {
            const queryParams = {
                queryTexts: [queryText],
                nResults: topK,
            };

            if (filter) {
                queryParams.where = filter;
            }

            const results = await collection.query(queryParams);

            // Format kết quả
            const formattedResults = [];
            if (results.documents && results.documents[0]) {
                for (let i = 0; i < results.documents[0].length; i++) {
                    formattedResults.push({
                        id: results.ids[0][i],
                        document: results.documents[0][i],
                        metadata: results.metadatas[0][i],
                        distance: results.distances ? results.distances[0][i] : null,
                        score: results.distances ? 1 - results.distances[0][i] : null, // Convert distance to similarity
                    });
                }
            }

            console.log(`🔍 Found ${formattedResults.length} results in ${collectionName}`);
            return formattedResults;
        } catch (error) {
            console.error(`❌ Error searching ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Multi-source search - Tìm kiếm trên nhiều collections
     * @param {string} queryText - Query text
     * @param {Array} collections - Array of collection names
     * @param {number} topK - Results per collection
     */
    async multiSearch(queryText, collections = ['marketTrends', 'jdTemplates', 'salaryData'], topK = 3) {
        await this.ensureInitialized();

        const results = {};

        for (const collectionName of collections) {
            try {
                results[collectionName] = await this.search(collectionName, queryText, topK);
            } catch (error) {
                console.error(`Error searching ${collectionName}:`, error);
                results[collectionName] = [];
            }
        }

        return results;
    }

    /**
     * Xóa collection
     */
    async deleteCollection(collectionName) {
        await this.ensureInitialized();

        try {
            await this.client.deleteCollection({ name: `hr_${collectionName}` });
            this.collections[collectionName] = null;
            console.log(`🗑️  Deleted collection: ${collectionName}`);
        } catch (error) {
            console.error(`Error deleting collection ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Lấy thống kê collection
     */
    async getCollectionStats(collectionName) {
        await this.ensureInitialized();

        const collection = this.collections[collectionName];
        if (!collection) {
            throw new Error(`Collection ${collectionName} not found`);
        }

        try {
            const count = await collection.count();
            return {
                name: collectionName,
                count,
                metadata: collection.metadata,
            };
        } catch (error) {
            console.error(`Error getting stats for ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Lấy tất cả stats
     */
    async getAllStats() {
        await this.ensureInitialized();

        const stats = {};
        for (const [key, collection] of Object.entries(this.collections)) {
            if (collection) {
                stats[key] = await this.getCollectionStats(key);
            }
        }
        return stats;
    }

    /**
     * Ensure initialized helper
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    /**
     * Reset tất cả collections (for testing)
     */
    async resetAll() {
        console.warn('⚠️  Resetting all collections...');

        try {
            for (const collectionName of Object.keys(this.collections)) {
                try {
                    await this.deleteCollection(collectionName);
                } catch (error) {
                    console.log(`Collection ${collectionName} not found, skipping...`);
                }
            }

            // Re-initialize
            this.isInitialized = false;
            await this.initialize();

            console.log('✅ All collections reset');
        } catch (error) {
            console.error('Error resetting collections:', error);
            throw error;
        }
    }
}

// Singleton instance
const vectorStore = new VectorStoreManager();

export default vectorStore;
export { VectorStoreManager };
