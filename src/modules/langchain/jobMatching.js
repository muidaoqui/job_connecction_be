import { jobVectorStore } from "./vectorstore.js";

export async function findMatchingJobs(candidateEmbedding, k = 5) {
  const store = jobVectorStore();

  const results = await store.similaritySearchVectorWithScore(
    candidateEmbedding,
    k
  );

  return results.map(([doc, score]) => ({
    jobId: doc.metadata._id,
    title: doc.metadata.title,
    score,
    description: doc.pageContent
  }));
}
