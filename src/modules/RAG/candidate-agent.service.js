// candidate-agent.service.js
import vectorStore from './rag.vectorstore.js';
import embeddingsService from './rag.embeddings.js';
import llmService from './rag.llm.js';
import CandidateCV from './candidate-cv.model.js';
import { parseCV, formatCVForEmbedding } from './candidate-cv-parser.js';
import { checkATSCompatibility, extractKeywordsFromJD } from './candidate-ats-checker.js';

/**
 * Candidate Agent Service
 * Core service cho 3 workflows: CV Analysis, Job Matching, CV Optimization
 */

/**
 * ============================================
 * WORKFLOW 1: CV ANALYSIS
 * ============================================
 */

/**
 * Analyze candidate CV comprehensively
 * @param {string} userId - User ID
 * @param {string} cvId - CV document ID (optional, uses latest if not provided)
 * @returns {Promise<object>} - Analysis results
 */
export async function analyzeCandidateCV(userId, cvId = null) {
    try {
        console.log('🔍 Analyzing candidate CV...');

        // 1. Get CV data
        const candidateCV = await CandidateCV.findOne({ userId });
        if (!candidateCV) {
            throw new Error('No CV found for this user');
        }

        const cvVersion = cvId
            ? candidateCV.versions.id(cvId)
            : candidateCV.getCurrentVersion();

        if (!cvVersion) {
            throw new Error('CV version not found');
        }

        const cvData = cvVersion.parsedData;

        // 2. Retrieve skill benchmarks from vector store
        const skillsQuery = `Skill standards and requirements for ${cvData.careerLevel.level} level ${cvData.personalInfo.name} with skills: ${cvData.skills.join(', ')}`;

        const skillBenchmarks = await retrieveContext('skillStandards', skillsQuery, 5);

        // 3. Retrieve market trends
        const marketQuery = `Job market trends and demand for skills: ${cvData.skills.slice(0, 10).join(', ')}`;
        const marketTrends = await retrieveContext('marketTrends', marketQuery, 3);

        // 4. Generate analysis using LLM
        const llmAnalysis = await llmService.generate(
            buildCVAnalysisPrompt(cvData),
            formatContext({ skillBenchmarks, marketTrends }),
            {
                systemMessage: 'You are an expert career advisor analyzing candidate CVs.',
                temperature: 0.2,
                maxTokens: 1500,
            }
        );

        // 5. Parse LLM response
        const analysis = parseLLMAnalysis(llmAnalysis.content, cvData);

        // 6. Save analysis results
        cvVersion.analysisResults = analysis;
        await candidateCV.save();

        console.log('✅ CV Analysis completed');
        return {
            success: true,
            analysis,
            cvData: {
                name: cvData.personalInfo.name,
                yearsOfExperience: cvData.yearsOfExperience,
                careerLevel: cvData.careerLevel,
                skillCount: cvData.skills.length,
            },
        };
    } catch (error) {
        console.error('❌ Error analyzing CV:', error);
        throw error;
    }
}

/**
 * Build CV analysis prompt
 */
function buildCVAnalysisPrompt(cvData) {
    return `Analyze this candidate's CV comprehensively:

**Candidate Profile:**
- Name: ${cvData.personalInfo.name}
- Years of Experience: ${cvData.yearsOfExperience}
- Current Level: ${cvData.careerLevel.level}
- Skills (${cvData.skills.length}): ${cvData.skills.join(', ')}
- Experience: ${cvData.experience.length} positions
- Education: ${cvData.education.map(e => e.degree).join(', ')}
- Projects: ${cvData.projects.length}

Provide analysis in JSON format:
{
  "overall_score": number (0-100),
  "strengths": ["string"],
  "critical_gaps": ["string"],
  "level_assessment": {
    "current": "junior|mid|senior|lead",
    "ready_for_next": boolean,
    "timeline_to_next": "string"
  },
  "skill_priority_matrix": {
    "high_priority": ["skills to learn urgently"],
    "medium_priority": ["skills to improve"],
    "low_priority": ["nice to have"]
  },
  "suitable_roles": ["role titles"],
  "salary_range_vnd": "string (e.g., 25M - 35M)",
  "recommendations": ["actionable advice"],
  "red_flags": ["concerns if any"]
}`;
}

/**
 * ============================================
 * WORKFLOW 2: JOB MATCHING
 * ============================================
 */

/**
 * Match jobs for candidate
 * @param {string} userId - User ID
 * @param {object} preferences - Search preferences
 * @returns {Promise<object>} - Matched jobs with scores
 */
export async function matchJobsForCandidate(userId, preferences = {}) {
    try {
        console.log('💼 Matching jobs for candidate...');

        // 1. Get candidate CV
        const candidateCV = await CandidateCV.findOne({ userId });
        if (!candidateCV) {
            throw new Error('No CV found for this user');
        }

        const cvData = candidateCV.getCurrentVersion().parsedData;

        // 2. Generate CV embedding
        const cvText = formatCVForEmbedding(cvData);
        await embeddingsService.initialize();
        const cvEmbedding = await embeddingsService.embedText(cvText);

        // 3. Search for matching jobs in vector store
        await vectorStore.initialize();

        const filter = {};
        if (preferences.location) filter.location = preferences.location;
        if (preferences.minSalary) filter.minSalary = { $gte: preferences.minSalary };

        const matchingJobs = await vectorStore.search(
            'jobPostings',
            cvText,
            preferences.topK || 20,
            filter
        );

        // 4. Calculate fit scores
        const rankedJobs = await calculateJobFitScores(cvData, matchingJobs);

        // 5. Generate explanations for top jobs
        const topJobs = rankedJobs.slice(0, 10);
        const explanations = await generateJobMatchExplanations(cvData, topJobs);

        // 6. Save job matches
        topJobs.forEach((job, idx) => {
            candidateCV.addJobMatch(
                job.metadata.jobId,
                job.fitScore,
                explanations[idx]
            );
        });
        await candidateCV.save();

        console.log('✅ Job matching completed');
        return {
            success: true,
            totalMatches: matchingJobs.length,
            topMatches: topJobs.map((job, idx) => ({
                ...job,
                explanation: explanations[idx],
            })),
        };
    } catch (error) {
        console.error('❌ Error matching jobs:', error);
        throw error;
    }
}

/**
 * Calculate job fit scores
 */
async function calculateJobFitScores(cvData, jobs) {
    return jobs.map(job => {
        let fitScore = job.score || 0; // Base semantic similarity score

        // Adjust based on skills match
        const jobSkills = job.metadata.required_skills || [];
        const matchedSkills = cvData.skills.filter(skill =>
            jobSkills.some(js => js.toLowerCase().includes(skill.toLowerCase()))
        );
        const skillMatchRate = jobSkills.length > 0
            ? matchedSkills.length / jobSkills.length
            : 0;
        fitScore += skillMatchRate * 20;

        // Adjust based on experience level
        const requiredLevel = job.metadata.level || 'mid';
        const levelMatch = cvData.careerLevel.level === requiredLevel;
        if (levelMatch) fitScore += 15;
        else if (isLevelClose(cvData.careerLevel.level, requiredLevel)) fitScore += 5;

        // Adjust based on years of experience
        const requiredYears = job.metadata.years_of_experience || 0;
        const yearsDiff = Math.abs(cvData.yearsOfExperience - requiredYears);
        if (yearsDiff <= 1) fitScore += 10;
        else if (yearsDiff <= 2) fitScore += 5;

        return {
            ...job,
            fitScore: Math.min(100, Math.round(fitScore)),
            matchedSkills,
            skillMatchRate: Math.round(skillMatchRate * 100),
        };
    }).sort((a, b) => b.fitScore - a.fitScore);
}

/**
 * Generate job match explanations using LLM
 */
async function generateJobMatchExplanations(cvData, jobs) {
    const prompt = `Explain why these jobs are good matches for the candidate:

**Candidate:**
- Level: ${cvData.careerLevel.level}
- Experience: ${cvData.yearsOfExperience} years
- Top Skills: ${cvData.skills.slice(0, 10).join(', ')}

**Jobs:**
${jobs.map((job, idx) => `
${idx + 1}. ${job.metadata.title} at ${job.metadata.company}
   - Required Skills: ${job.metadata.required_skills?.join(', ') || 'N/A'}
   - Level: ${job.metadata.level || 'N/A'}
   - Fit Score: ${job.fitScore}%
`).join('\n')}

For each job, provide a 1-2 sentence explanation of the fit. Return as JSON array:
["explanation for job 1", "explanation for job 2", ...]`;

    const response = await llmService.generate(prompt, '', {
        temperature: 0.3,
        maxTokens: 800,
    });

    try {
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error('Error parsing job explanations:', error);
    }

    // Fallback: generate simple explanations
    return jobs.map(job =>
        `Good match based on ${job.skillMatchRate}% skill overlap and ${job.fitScore}% overall fit.`
    );
}

/**
 * ============================================
 * WORKFLOW 3: CV OPTIMIZATION
 * ============================================
 */

/**
 * Optimize CV for target JD
 * @param {string} userId - User ID
 * @param {string} targetJD - Target job description
 * @returns {Promise<object>} - Optimized CV and ATS score
 */
export async function optimizeCVForJob(userId, targetJD) {
    try {
        console.log('📄 Optimizing CV for target JD...');

        // 1. Get candidate CV
        const candidateCV = await CandidateCV.findOne({ userId });
        if (!candidateCV) {
            throw new Error('No CV found for this user');
        }

        const cvData = candidateCV.getCurrentVersion().parsedData;

        // 2. Extract keywords from target JD
        const jdKeywords = extractKeywordsFromJD(targetJD);
        console.log(`📋 Extracted ${jdKeywords.length} keywords from JD`);

        // 3. Retrieve ATS-friendly templates
        const templatesQuery = `ATS-friendly CV templates for ${cvData.careerLevel.level} level positions`;
        const templates = await retrieveContext('cvTemplates', templatesQuery, 3);

        // 4. Generate optimized CV using LLM
        const optimizedCV = await llmService.generate(
            buildCVOptimizationPrompt(cvData, targetJD, jdKeywords),
            formatContext({ templates }),
            {
                systemMessage: 'You are an expert CV writer specializing in ATS optimization.',
                temperature: 0.3,
                maxTokens: 2000,
            }
        );

        // 5. Run ATS checker
        const atsScore = checkATSCompatibility(optimizedCV.content, jdKeywords);

        // 6. Save optimization result
        const currentVersion = candidateCV.getCurrentVersion();
        currentVersion.optimizationHistory.push({
            targetJD,
            optimizedCV: optimizedCV.content,
            atsScore: atsScore.overall_score,
            date: new Date(),
        });
        await candidateCV.save();

        console.log('✅ CV Optimization completed');
        return {
            success: true,
            optimized_cv: optimizedCV.content,
            ats_score: atsScore,
            keywords_matched: jdKeywords.length,
        };
    } catch (error) {
        console.error('❌ Error optimizing CV:', error);
        throw error;
    }
}

/**
 * Build CV optimization prompt
 */
function buildCVOptimizationPrompt(cvData, targetJD, keywords) {
    return `Rewrite this CV to be ATS-friendly and optimized for the target job:

**Current CV Data:**
${JSON.stringify(cvData, null, 2)}

**Target Job Description:**
${targetJD}

**Keywords to Include:**
${keywords.join(', ')}

**Requirements:**
1. Incorporate all keywords naturally
2. Use standard section headers (EXPERIENCE, EDUCATION, SKILLS)
3. Use bullet points with action verbs
4. Quantify achievements where possible
5. Keep formatting simple (no tables, special characters)
6. Maintain truthfulness - don't add false information

Return the optimized CV as plain text, ready to copy-paste.`;
}

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Retrieve context from vector store
 */
async function retrieveContext(collectionName, query, topK = 5) {
    try {
        await vectorStore.initialize();
        const results = await vectorStore.search(collectionName, query, topK);
        return results;
    } catch (error) {
        console.warn(`⚠️  Could not retrieve from ${collectionName}:`, error.message);
        return [];
    }
}

/**
 * Format context for LLM
 */
function formatContext(contexts) {
    let formatted = '';

    for (const [name, docs] of Object.entries(contexts)) {
        if (docs && docs.length > 0) {
            formatted += `\n=== ${name.toUpperCase()} ===\n`;
            docs.forEach((doc, idx) => {
                formatted += `[${idx + 1}] ${doc.document || doc}\n`;
            });
        }
    }

    return formatted;
}

/**
 * Parse LLM analysis response
 */
function parseLLMAnalysis(content, cvData) {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error('Error parsing LLM analysis:', error);
    }

    // Fallback: return basic analysis
    return {
        overall_score: 70,
        strengths: cvData.skills.slice(0, 5),
        critical_gaps: ['Unable to analyze - please try again'],
        level_assessment: {
            current: cvData.careerLevel.level,
            ready_for_next: false,
            timeline_to_next: 'N/A',
        },
        suitable_roles: ['Software Engineer'],
        salary_range_vnd: '20M - 40M',
        recommendations: ['Review your CV and try analysis again'],
        red_flags: [],
    };
}

/**
 * Check if career levels are close
 */
function isLevelClose(level1, level2) {
    const levels = ['junior', 'mid', 'senior', 'lead'];
    const idx1 = levels.indexOf(level1);
    const idx2 = levels.indexOf(level2);
    return Math.abs(idx1 - idx2) === 1;
}
