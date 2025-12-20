import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import mongoose from "mongoose";

export function candidateVectorStore() {
  return new MongoDBAtlasVectorSearch(null, {
    collection: mongoose.connection.collection("candidates"),
    indexName: "candidate_vector_index",
    textKey: "embeddingText",
    embeddingKey: "embedding"
  });
}

export function jobVectorStore() {
  return new MongoDBAtlasVectorSearch(null, {
    collection: mongoose.connection.collection("jobs"),
    indexName: "job_vector_index",
    textKey: "description",
    embeddingKey: "embedding"
  });
}
