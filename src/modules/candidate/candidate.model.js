import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ["male", "female"] },
  address: String,
  resumePath: String,
  mainResumePath: String,
  profileSummary: String,
  avatarUrl: String,
  embedding: {
    type: [Number],
    default: undefined,
  },
  embeddingText: String,
  embeddingUpdatedAt: Date,
  embeddingDimensions: Number,
}, { timestamps: true });

// Hook: Tự động update embedding khi candidate được update
candidateSchema.pre('save', async function(next) {
    const embeddingFields = ['dateOfBirth', 'gender', 'address', 'profileSummary'];
    const hasRelevantChanges = embeddingFields.some(field => this.isModified(field));

    if (hasRelevantChanges && !this.isNew) {
        this._needsEmbeddingUpdate = true;
    }
    next();
});

candidateSchema.post('save', async function(doc) {
    if (doc._needsEmbeddingUpdate) {
        try {
            const { generateAndSaveCandidateEmbedding } = await import('../embedding/embedding.serivice.js');
            await generateAndSaveCandidateEmbedding(doc._id.toString());
            console.log(`✅ Auto-updated embedding for candidate ${doc._id}`);
        } catch (error) {
            console.error(`⚠️ Failed to auto-update embedding for candidate ${doc._id}:`, error.message);
        }
    }
});

export default mongoose.model("Candidate", candidateSchema);
