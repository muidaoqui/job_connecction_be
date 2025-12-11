import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    salary: { type: String },
    location: { type: String },
    jobType: { type: String },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    saveCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    embedding: {
      type: [Number],
      default: undefined
    },
    embeddingText: String,
    embeddingUpdatedAt: Date,
    embeddingDimensions: Number
  },

  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
// Hook: Tự động update embedding khi job được update
jobSchema.pre('save', async function(next) {
    // Chỉ update embedding nếu các trường liên quan thay đổi
    const embeddingFields = ['title', 'description', 'requirements', 'location', 'salary', 'jobType'];
    const hasRelevantChanges = embeddingFields.some(field => this.isModified(field));

    if (hasRelevantChanges && !this.isNew) {
        // Đánh dấu cần regenerate embedding
        this._needsEmbeddingUpdate = true;
    }
    next();
});

// Hook: Sau khi save, regenerate embedding nếu cần
jobSchema.post('save', async function(doc) {
    if (doc._needsEmbeddingUpdate) {
        try {
            const { generateAndSaveJobEmbedding } = await import('../embedding/embedding.serivice.js');
            await generateAndSaveJobEmbedding(doc._id.toString());
            console.log(`✅ Auto-updated embedding for job ${doc._id}`);
        } catch (error) {
            console.error(`⚠️ Failed to auto-update embedding for job ${doc._id}:`, error.message);
        }
    }
});

export default mongoose.model("Job", jobSchema);
