// rag.memory.js
import AgentSession from './agent-session.model.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent Memory Manager
 * Quản lý session, conversation history, và JD versions
 */

class MemoryManager {
    /**
     * Tạo session mới
     */
    async createSession(userId = null, metadata = {}) {
        try {
            const sessionId = uuidv4();

            const session = new AgentSession({
                sessionId,
                userId,
                metadata: {
                    ...metadata,
                    status: 'active',
                },
                conversationHistory: [],
                jdVersions: [],
            });

            await session.save();
            console.log(`✅ Created new session: ${sessionId}`);

            return session;
        } catch (error) {
            console.error('❌ Error creating session:', error);
            throw error;
        }
    }

    /**
     * Lấy session theo ID
     */
    async getSession(sessionId) {
        try {
            const session = await AgentSession.findOne({ sessionId });

            if (!session) {
                throw new Error(`Session ${sessionId} not found`);
            }

            return session;
        } catch (error) {
            console.error('❌ Error getting session:', error);
            throw error;
        }
    }

    /**
     * Lấy hoặc tạo session
     */
    async getOrCreateSession(sessionId = null, userId = null, metadata = {}) {
        try {
            if (sessionId) {
                try {
                    return await this.getSession(sessionId);
                } catch (error) {
                    console.log(`Session ${sessionId} not found, creating new one...`);
                }
            }

            return await this.createSession(userId, metadata);
        } catch (error) {
            console.error('❌ Error in getOrCreateSession:', error);
            throw error;
        }
    }

    /**
     * Thêm message vào conversation
     */
    async addMessage(sessionId, role, content, sources = [], metadata = {}) {
        try {
            const session = await this.getSession(sessionId);
            await session.addMessage(role, content, sources, metadata);

            console.log(`💬 Added ${role} message to session ${sessionId}`);
            return session;
        } catch (error) {
            console.error('❌ Error adding message:', error);
            throw error;
        }
    }

    /**
     * Thêm JD version mới
     */
    async addJDVersion(sessionId, jdText, feedback = '', analysisResult = null) {
        try {
            const session = await this.getSession(sessionId);
            await session.addJDVersion(jdText, feedback, analysisResult);

            console.log(`📄 Added JD version ${session.jdVersions.length} to session ${sessionId}`);
            return session;
        } catch (error) {
            console.error('❌ Error adding JD version:', error);
            throw error;
        }
    }

    /**
     * Lấy conversation history
     */
    async getConversationHistory(sessionId, maxMessages = 10) {
        try {
            const session = await this.getSession(sessionId);
            return session.getConversationContext(maxMessages);
        } catch (error) {
            console.error('❌ Error getting conversation history:', error);
            throw error;
        }
    }

    /**
     * Lấy latest JD version
     */
    async getLatestJD(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            return session.getLatestJD();
        } catch (error) {
            console.error('❌ Error getting latest JD:', error);
            throw error;
        }
    }

    /**
     * Update session metadata
     */
    async updateMetadata(sessionId, metadata) {
        try {
            const session = await this.getSession(sessionId);
            session.metadata = {
                ...session.metadata,
                ...metadata,
            };
            await session.save();

            console.log(`📝 Updated metadata for session ${sessionId}`);
            return session;
        } catch (error) {
            console.error('❌ Error updating metadata:', error);
            throw error;
        }
    }

    /**
     * Archive session
     */
    async archiveSession(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            session.metadata.status = 'archived';
            await session.save();

            console.log(`🗄️  Archived session ${sessionId}`);
            return session;
        } catch (error) {
            console.error('❌ Error archiving session:', error);
            throw error;
        }
    }

    /**
     * Lấy sessions của user
     */
    async getUserSessions(userId, limit = 10, status = 'active') {
        try {
            const query = { userId };

            if (status) {
                query['metadata.status'] = status;
            }

            const sessions = await AgentSession
                .find(query)
                .sort({ updatedAt: -1 })
                .limit(limit);

            return sessions;
        } catch (error) {
            console.error('❌ Error getting user sessions:', error);
            throw error;
        }
    }

    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        try {
            await AgentSession.deleteOne({ sessionId });
            console.log(`🗑️  Deleted session ${sessionId}`);
        } catch (error) {
            console.error('❌ Error deleting session:', error);
            throw error;
        }
    }

    /**
     * Get session statistics
     */
    async getSessionStats(sessionId) {
        try {
            const session = await this.getSession(sessionId);

            return {
                sessionId: session.sessionId,
                messageCount: session.conversationHistory.length,
                jdVersionCount: session.jdVersions.length,
                status: session.metadata.status,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                metadata: session.metadata,
            };
        } catch (error) {
            console.error('❌ Error getting session stats:', error);
            throw error;
        }
    }
}

// Singleton instance
const memoryManager = new MemoryManager();

export default memoryManager;
export { MemoryManager };
