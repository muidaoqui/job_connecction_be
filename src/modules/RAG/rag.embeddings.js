// rag.embeddings.js
import { OpenAIEmbeddings } from '@langchain/openai';

/**
 * Embeddings Service
 * Wrapper cho embedding generation với caching và batch processing
 */

class EmbeddingsService {
    constructor() {
        this.embeddings = null;
        this.cache = new Map(); // Simple in-memory cache
        this.cacheMaxSize = 1000;
    }

    /**
     * Khởi tạo embeddings model
     */
    initialize() {
        if (this.embeddings) {
            return;
        }

        try {
            // Sử dụng OpenAI embeddings
            this.embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: 'text-embedding-3-small', // Cost-effective, good quality
                batchSize: 512, // Batch multiple requests
            });

            console.log('✅ Embeddings service initialized (OpenAI text-embedding-3-small)');
        } catch (error) {
            console.error('❌ Failed to initialize embeddings:', error);
            throw error;
        }
    }

    /**
     * Generate embedding cho single text
     * @param {string} text - Text to embed
     * @param {boolean} useCache - Use cache if available
     */
    async embedText(text, useCache = true) {
        this.ensureInitialized();

        // Check cache
        if (useCache && this.cache.has(text)) {
            console.log('📦 Using cached embedding');
            return this.cache.get(text);
        }

        try {
            const embedding = await this.embeddings.embedQuery(text);

            // Cache result
            if (useCache) {
                this.addToCache(text, embedding);
            }

            return embedding;
        } catch (error) {
            console.error('❌ Error generating embedding:', error);
            throw error;
        }
    }

    /**
     * Generate embeddings cho multiple texts (batch)
     * @param {Array<string>} texts - Array of texts
     */
    async embedBatch(texts) {
        this.ensureInitialized();

        try {
            console.log(`🔄 Generating embeddings for ${texts.length} texts...`);

            // Check cache first
            const uncachedTexts = [];
            const uncachedIndices = [];
            const results = new Array(texts.length);

            texts.forEach((text, idx) => {
                if (this.cache.has(text)) {
                    results[idx] = this.cache.get(text);
                } else {
                    uncachedTexts.push(text);
                    uncachedIndices.push(idx);
                }
            });

            // Generate embeddings for uncached texts
            if (uncachedTexts.length > 0) {
                console.log(`📊 Cache hit: ${texts.length - uncachedTexts.length}/${texts.length}`);
                console.log(`🔄 Generating ${uncachedTexts.length} new embeddings...`);

                const newEmbeddings = await this.embeddings.embedDocuments(uncachedTexts);

                // Fill results and cache
                uncachedIndices.forEach((idx, i) => {
                    results[idx] = newEmbeddings[i];
                    this.addToCache(uncachedTexts[i], newEmbeddings[i]);
                });
            } else {
                console.log('✅ All embeddings from cache');
            }

            return results;
        } catch (error) {
            console.error('❌ Error generating batch embeddings:', error);
            throw error;
        }
    }

    /**
     * Add to cache với LRU eviction
     */
    addToCache(text, embedding) {
        // Simple LRU: nếu cache đầy, xóa item đầu tiên
        if (this.cache.size >= this.cacheMaxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(text, embedding);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️  Embeddings cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.cacheMaxSize,
            hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
        };
    }

    /**
     * Ensure initialized
     */
    ensureInitialized() {
        if (!this.embeddings) {
            this.initialize();
        }
    }
}

// Singleton instance
const embeddingsService = new EmbeddingsService();

export default embeddingsService;
export { EmbeddingsService };
