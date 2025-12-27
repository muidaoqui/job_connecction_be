// agent-session.model.js
import mongoose from 'mongoose';

const AgentSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: String,
        required: false, // Optional: có thể link với user account
    },
    jdVersions: [{
        version: Number,
        text: String,
        timestamp: Date,
        feedback: String,
        analysisResult: mongoose.Schema.Types.Mixed,
    }],
    conversationHistory: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true,
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
        sources: [mongoose.Schema.Types.Mixed], // Retrieved context sources
        metadata: mongoose.Schema.Types.Mixed,
    }],
    metadata: {
        position: String,
        company: String,
        location: String,
        status: {
            type: String,
            enum: ['active', 'completed', 'archived'],
            default: 'active',
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Indexes
AgentSessionSchema.index({ userId: 1, createdAt: -1 });
AgentSessionSchema.index({ 'metadata.status': 1 });

// Methods
AgentSessionSchema.methods.addMessage = function (role, content, sources = [], metadata = {}) {
    this.conversationHistory.push({
        role,
        content,
        sources,
        metadata,
        timestamp: new Date(),
    });
    return this.save();
};

AgentSessionSchema.methods.addJDVersion = function (text, feedback = '', analysisResult = null) {
    const version = this.jdVersions.length + 1;
    this.jdVersions.push({
        version,
        text,
        feedback,
        analysisResult,
        timestamp: new Date(),
    });
    return this.save();
};

AgentSessionSchema.methods.getLatestJD = function () {
    if (this.jdVersions.length === 0) return null;
    return this.jdVersions[this.jdVersions.length - 1];
};

AgentSessionSchema.methods.getConversationContext = function (maxMessages = 10) {
    // Get last N messages for context window
    return this.conversationHistory
        .slice(-maxMessages)
        .map(msg => ({
            role: msg.role,
            content: msg.content,
        }));
};

const AgentSession = mongoose.model('AgentSession', AgentSessionSchema);

export default AgentSession;
