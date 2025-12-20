import { candidateVectorStore } from "./vectorstore.js";

export async function retrieveCandidateMemory(candidateEmbedding, k = 3) {
  const store = candidateVectorStore();

  const results = await store.similaritySearchVectorWithScore(
    candidateEmbedding,
    k
  );

  return results.map(([doc, score]) => ({
    content: doc.pageContent,
    score
  }));
}
