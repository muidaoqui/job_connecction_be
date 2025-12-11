import { pipeline } from '@xenova/transformers';

// Function to generate embeddings for a given data source
export async function getEmbedding(data) {
    const embedder = await pipeline(
        'feature-extraction', 
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
    const results = await embedder(data, { pooling: 'mean', normalize: true });
    return Array.from(results.data);
}
