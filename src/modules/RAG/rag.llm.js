// rag.llm.js
import { OpenAI } from "openai";
import { FoundryLocalManager } from "foundry-local-sdk";
import dotenv from "dotenv";
dotenv.config();

/**
 * LLM Service cho HR Agent
 * Sử dụng FoundryLocalManager với Qwen model local
 */

class LLMService {
    constructor() {
        this.foundryManager = null;
        this.openai = null;
        this.modelInfo = null;
        this.isInitialized = false;
    }

    /**
     * Khởi tạo LLM với FoundryLocalManager
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            const alias = process.env.MODEL_ALIAS || "qwen2.5-1.5b-instruct-generic-gpu:4";

            console.log("🤖 Initializing Qwen model for HR Agent:", alias);

            this.foundryManager = new FoundryLocalManager();
            this.modelInfo = await this.foundryManager.init(alias);

            console.log("📊 Model Info:", {
                alias: this.modelInfo.alias,
                id: this.modelInfo.id,
                version: this.modelInfo.version,
                deviceType: this.modelInfo.deviceType,
                modelSize: this.modelInfo.modelSize,
            });

            // Create OpenAI client pointing to local model
            this.openai = new OpenAI({
                baseURL: this.foundryManager.endpoint,
                apiKey: this.foundryManager.apiKey,
            });

            this.isInitialized = true;
            console.log("✅ LLM initialized (Local Qwen model)");
            console.log("🔗 Endpoint:", this.foundryManager.endpoint);
        } catch (error) {
            console.error("❌ Failed to initialize LLM:", error);
            throw error;
        }
    }

    /**
     * Generate response với context từ RAG
     * @param {string} prompt - User prompt
     * @param {string} context - Retrieved context from vector store
     * @param {object} options - Generation options
     */
    async generate(prompt, context = '', options = {}) {
        await this.ensureInitialized();

        const {
            temperature = 0.3,
            maxTokens = 2000,
            systemMessage = 'You are an expert HR assistant specializing in job descriptions and recruitment.',
        } = options;

        try {
            const messages = [
                { role: 'system', content: systemMessage },
            ];

            // Add context if provided
            if (context) {
                messages.push({
                    role: 'system',
                    content: `Relevant context:\n${context}`,
                });
            }

            messages.push({ role: 'user', content: prompt });

            const response = await this.openai.chat.completions.create({
                model: this.modelInfo.id,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens,
                top_p: 0.9,
            });

            return {
                content: response.choices[0].message.content,
                usage: response.usage || {},
            };
        } catch (error) {
            console.error('❌ Error generating LLM response:', error);
            throw error;
        }
    }

    /**
     * Analyze Job Description
     */
    async analyzeJD(jdText, context = '') {
        const systemMessage = `You are an expert HR analyst. Analyze job descriptions comprehensively and provide structured insights.`;

        const prompt = `Analyze this Job Description and provide a detailed report:

JD Content:
${jdText}

Provide analysis in the following JSON format:
{
  "length_analysis": {
    "word_count": number,
    "assessment": "too_short" | "optimal" | "too_long",
    "recommendation": "string"
  },
  "skill_gaps": [
    {
      "missing_skill": "string",
      "importance": "critical" | "important" | "nice_to_have",
      "reason": "string"
    }
  ],
  "seniority_level": {
    "detected": "junior" | "mid" | "senior" | "lead" | "unclear",
    "confidence": number (0-100),
    "mismatch_indicators": ["string"]
  },
  "competitiveness_score": {
    "score": number (0-100),
    "factors": {
      "salary_transparency": number,
      "benefits_clarity": number,
      "growth_opportunities": number,
      "company_culture": number
    },
    "strengths": ["string"],
    "weaknesses": ["string"]
  },
  "key_insights": ["string"]
}`;

        const response = await this.generate(prompt, context, {
            systemMessage,
            temperature: 0.2,
            maxTokens: 1500,
        });

        try {
            // Parse JSON response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { raw_response: response.content };
        } catch (error) {
            console.error('Error parsing JD analysis:', error);
            return { raw_response: response.content };
        }
    }

    /**
     * Optimize Job Description
     */
    async optimizeJD(jdText, context = '', focusAreas = []) {
        const systemMessage = `You are an expert HR consultant specializing in job description optimization.`;

        const focusAreasText = focusAreas.length > 0
            ? `Focus on these areas: ${focusAreas.join(', ')}`
            : 'Provide comprehensive optimization suggestions';

        const prompt = `Optimize this Job Description. ${focusAreasText}

JD Content:
${jdText}

Provide suggestions in the following JSON format:
{
  "seniority_adjustments": [
    {
      "current": "string",
      "suggested": "string",
      "reason": "string"
    }
  ],
  "skill_classification": {
    "must_have": ["string"],
    "nice_to_have": ["string"],
    "should_remove": ["string"]
  },
  "missing_elements": [
    {
      "element": "string",
      "importance": "critical" | "important" | "nice_to_have",
      "suggestion": "string"
    }
  ],
  "tone_improvements": [
    {
      "issue": "string",
      "current_example": "string",
      "improved_version": "string"
    }
  ],
  "structure_recommendations": ["string"],
  "overall_priority": "string"
}`;

        const response = await this.generate(prompt, context, {
            systemMessage,
            temperature: 0.3,
            maxTokens: 1500,
        });

        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { raw_response: response.content };
        } catch (error) {
            console.error('Error parsing optimization suggestions:', error);
            return { raw_response: response.content };
        }
    }

    /**
     * Benchmark Salary
     */
    async benchmarkSalary(position, experience, location, skills = [], context = '') {
        const systemMessage = `You are a compensation analyst with expertise in salary benchmarking.`;

        const prompt = `Provide salary benchmark for this position:

Position: ${position}
Experience: ${experience} years
Location: ${location}
Key Skills: ${skills.join(', ')}

Provide recommendation in the following JSON format:
{
  "market_range": {
    "min": number,
    "max": number,
    "median": number,
    "currency": "VND" | "USD"
  },
  "competitor_average": number,
  "location_adjustment": {
    "base_location": "string",
    "adjustment_factor": number,
    "adjusted_range": {
      "min": number,
      "max": number
    }
  },
  "confidence_level": {
    "score": number (0-100),
    "data_points": number,
    "factors": ["string"]
  },
  "recommendations": ["string"],
  "market_insights": ["string"]
}`;

        const response = await this.generate(prompt, context, {
            systemMessage,
            temperature: 0.2,
            maxTokens: 1200,
        });

        try {
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { raw_response: response.content };
        } catch (error) {
            console.error('Error parsing salary benchmark:', error);
            return { raw_response: response.content };
        }
    }

    /**
     * Chat with agent (multi-turn conversation)
     */
    async chat(message, conversationHistory = [], context = '') {
        const systemMessage = `You are an intelligent HR assistant. Help users with job descriptions, recruitment strategies, and HR best practices. Be concise, actionable, and cite sources when using provided context.`;

        const messages = [
            { role: 'system', content: systemMessage },
        ];

        if (context) {
            messages.push({
                role: 'system',
                content: `Relevant information:\n${context}`,
            });
        }

        // Add conversation history
        conversationHistory.forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });

        // Add current message
        messages.push({ role: 'user', content: message });

        const response = await this.openai.chat.completions.create({
            model: this.modelInfo.id,
            messages: messages,
            temperature: 0.5,
            max_tokens: 1000,
            top_p: 0.9,
        });

        return {
            content: response.choices[0].message.content,
            usage: response.usage || {},
        };
    }

    /**
     * Ensure initialized
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    /**
     * Get model info
     */
    async getModelInfo() {
        await this.ensureInitialized();
        return {
            alias: this.modelInfo.alias,
            id: this.modelInfo.id,
            version: this.modelInfo.version,
            deviceType: this.modelInfo.deviceType,
            modelSize: this.modelInfo.modelSize,
            endpoint: this.foundryManager.endpoint,
        };
    }

    /**
     * Shutdown model
     */
    async shutdown() {
        if (this.foundryManager && typeof this.foundryManager.shutdown === 'function') {
            try {
                await this.foundryManager.shutdown();
                console.log("🛑 HR Agent LLM shutdown successfully");
                this.isInitialized = false;
                this.modelInfo = null;
                this.openai = null;
            } catch (error) {
                console.error("❌ Failed to shutdown HR Agent LLM:", error);
            }
        }
    }
}

// Singleton instance
const llmService = new LLMService();

// Graceful shutdown handlers
process.on('SIGINT', async () => {
    await llmService.shutdown();
});

process.on('SIGTERM', async () => {
    await llmService.shutdown();
});

export default llmService;
export { LLMService };
