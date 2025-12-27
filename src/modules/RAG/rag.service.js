// rag.service.js
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import vectorStore from './rag.vectorstore.js';
import embeddingsService from './rag.embeddings.js';
import llmService from './rag.llm.js';
import memoryManager from './rag.memory.js';
import { extractSkillsFromJD, detectSeniorityLevel, calculateReadabilityScore } from './rag.utils.js';

/**
 * Upload document và chia thành chunks
 * @param {string} text - Nội dung document
 * @param {object} metadata - Metadata (fileName, userId, etc.)
 * @returns {Promise<object>} - Kết quả upload
 */
export async function uploadDocument(text, metadata = {}) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.splitDocuments([
    new Document({ pageContent: text, metadata }),
  ]);

  return {
    success: true,
    chunks: docs.length,
    chunkDetails: docs.map((doc, idx) => ({
      chunkId: idx,
      length: doc.pageContent.length,
      preview: doc.pageContent.substring(0, 100) + '...',
    }))
  };
}

/**
 * ============================================
 * RAG PIPELINE FUNCTIONS
 * ============================================
 */

/**
 * Retrieve relevant context từ vector stores
 * @param {string} query - Search query
 * @param {Array} collections - Collections to search
 * @param {number} topK - Number of results per collection
 */
export async function retrieveRelevantContext(query, collections = ['marketTrends', 'jdTemplates', 'salaryData'], topK = 3) {
  try {
    await vectorStore.initialize();

    const results = await vectorStore.multiSearch(query, collections, topK);

    // Format context
    let contextText = '';
    for (const [collectionName, docs] of Object.entries(results)) {
      if (docs.length > 0) {
        contextText += `\n=== ${collectionName.toUpperCase()} ===\n`;
        docs.forEach((doc, idx) => {
          contextText += `[${idx + 1}] ${doc.document}\n`;
          if (doc.metadata?.source) {
            contextText += `   Source: ${doc.metadata.source}\n`;
          }
        });
      }
    }

    return {
      contextText,
      sources: results,
      totalResults: Object.values(results).reduce((sum, docs) => sum + docs.length, 0),
    };
  } catch (error) {
    console.error('❌ Error retrieving context:', error);
    // Return empty context if vector store not available
    return {
      contextText: '',
      sources: {},
      totalResults: 0,
      error: error.message,
    };
  }
}

/**
 * ============================================
 * HR AGENT FUNCTIONS
 * ============================================
 */

/**
 * Analyze Job Description
 * @param {string} jdText - JD content
 * @param {object} metadata - JD metadata (position, company, location)
 */
export async function analyzeJobDescription(jdText, metadata = {}) {
  try {
    console.log('🔍 Analyzing Job Description...');

    // 1. Extract basic features
    const wordCount = jdText.split(/\s+/).length;
    const skills = extractSkillsFromJD(jdText);
    const seniorityLevel = detectSeniorityLevel(jdText);
    const readabilityScore = calculateReadabilityScore(jdText);

    // 2. Retrieve relevant context from vector stores
    const query = `Job description analysis for ${metadata.position || 'position'}: ${jdText.substring(0, 500)}`;
    const context = await retrieveRelevantContext(query, ['marketTrends', 'jdTemplates'], 3);

    // 3. Generate analysis using LLM
    llmService.initialize();
    const llmAnalysis = await llmService.analyzeJD(jdText, context.contextText);

    // 4. Combine results
    const analysis = {
      basic_stats: {
        word_count: wordCount,
        character_count: jdText.length,
        readability_score: readabilityScore,
      },
      extracted_features: {
        skills: skills,
        seniority_level: seniorityLevel,
      },
      llm_analysis: llmAnalysis,
      context_sources: context.sources,
      metadata: metadata,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ JD Analysis completed');
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing JD:', error);
    throw error;
  }
}

/**
 * Optimize Job Description
 * @param {string} jdText - JD content
 * @param {Array} focusAreas - Areas to focus on
 */
export async function optimizeJobDescription(jdText, focusAreas = []) {
  try {
    console.log('💡 Optimizing Job Description...');

    // 1. Retrieve best practices from vector store
    const query = `Job description optimization best practices: ${jdText.substring(0, 500)}`;
    const context = await retrieveRelevantContext(query, ['jdTemplates'], 5);

    // 2. Generate optimization suggestions using LLM
    llmService.initialize();
    const suggestions = await llmService.optimizeJD(jdText, context.contextText, focusAreas);

    // 3. Add context sources
    const result = {
      suggestions: suggestions,
      context_sources: context.sources,
      focus_areas: focusAreas,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ JD Optimization completed');
    return result;
  } catch (error) {
    console.error('❌ Error optimizing JD:', error);
    throw error;
  }
}

/**
 * Benchmark Salary
 * @param {string} position - Job position
 * @param {number} experience - Years of experience
 * @param {string} location - Location
 * @param {Array} skills - Required skills
 */
export async function benchmarkSalary(position, experience, location, skills = []) {
  try {
    console.log('💰 Benchmarking Salary...');

    // 1. Retrieve salary data from vector store
    const query = `Salary data for ${position} with ${experience} years experience in ${location}, skills: ${skills.join(', ')}`;
    const context = await retrieveRelevantContext(query, ['salaryData'], 5);

    // 2. Generate salary recommendation using LLM
    llmService.initialize();
    const recommendation = await llmService.benchmarkSalary(position, experience, location, skills, context.contextText);

    // 3. Add context sources
    const result = {
      recommendation: recommendation,
      context_sources: context.sources,
      input: {
        position,
        experience,
        location,
        skills,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Salary Benchmark completed');
    return result;
  } catch (error) {
    console.error('❌ Error benchmarking salary:', error);
    throw error;
  }
}

/**
 * Chat with HR Agent (multi-turn conversation)
 * @param {string} message - User message
 * @param {string} sessionId - Session ID
 * @param {string} jdContext - Optional JD context
 */
export async function chatWithAgent(message, sessionId = null, jdContext = null) {
  try {
    console.log('💬 Processing chat message...');

    // 1. Get or create session
    const session = await memoryManager.getOrCreateSession(sessionId);

    // 2. Get conversation history
    const conversationHistory = await memoryManager.getConversationHistory(session.sessionId, 10);

    // 3. Build context
    let contextText = '';

    // Add JD context if provided
    if (jdContext) {
      contextText += `Current Job Description:\n${jdContext}\n\n`;
    } else {
      // Try to get latest JD from session
      const latestJD = await memoryManager.getLatestJD(session.sessionId);
      if (latestJD) {
        contextText += `Current Job Description (Version ${latestJD.version}):\n${latestJD.text}\n\n`;
      }
    }

    // Retrieve relevant knowledge
    const retrievedContext = await retrieveRelevantContext(message, ['marketTrends', 'jdTemplates', 'salaryData'], 2);
    contextText += retrievedContext.contextText;

    // 4. Generate response
    llmService.initialize();
    const response = await llmService.chat(message, conversationHistory, contextText);

    // 5. Save to memory
    await memoryManager.addMessage(session.sessionId, 'user', message);
    await memoryManager.addMessage(session.sessionId, 'assistant', response.content, retrievedContext.sources);

    // 6. Return response
    const result = {
      sessionId: session.sessionId,
      response: response.content,
      sources: retrievedContext.sources,
      usage: response.usage,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Chat response generated');
    return result;
  } catch (error) {
    console.error('❌ Error in chat:', error);
    throw error;
  }
}

/**
 * Get agent conversation history
 * @param {string} sessionId - Session ID
 */
export async function getAgentHistory(sessionId) {
  try {
    const session = await memoryManager.getSession(sessionId);

    return {
      sessionId: session.sessionId,
      conversationHistory: session.conversationHistory,
      jdVersions: session.jdVersions,
      metadata: session.metadata,
      stats: await memoryManager.getSessionStats(sessionId),
    };
  } catch (error) {
    console.error('❌ Error getting history:', error);
    throw error;
  }
}

/**
 * Add documents to vector store
 * @param {string} collectionName - Collection name
 * @param {Array} documents - Documents to add
 * @param {Array} metadatas - Metadata for documents
 */
export async function addToVectorStore(collectionName, documents, metadatas = null) {
  try {
    console.log(`📥 Adding ${documents.length} documents to ${collectionName}...`);

    await vectorStore.initialize();
    embeddingsService.initialize();

    // Generate embeddings
    const embeddings = await embeddingsService.embedBatch(documents);

    // Add to vector store
    const result = await vectorStore.addDocuments(collectionName, documents, embeddings, metadatas);

    console.log('✅ Documents added to vector store');
    return result;
  } catch (error) {
    console.error('❌ Error adding to vector store:', error);
    throw error;
  }
}

/**
 * Get vector store statistics
 */
export async function getVectorStoreStats() {
  try {
    await vectorStore.initialize();
    return await vectorStore.getAllStats();
  } catch (error) {
    console.error('❌ Error getting vector store stats:', error);
    return { error: error.message };
  }
}
