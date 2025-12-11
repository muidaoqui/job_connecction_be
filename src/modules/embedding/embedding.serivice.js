import { getEmbedding } from './get-embeddings.js';
import Job from '../job/job.model.js';
import Candidate from '../candidate/candidate.model.js';
import Education from '../candidate/education/education.model.js';
import Experience from '../candidate/experience/experience.model.js';
import Project from '../candidate/project/project.model.js';
import Skill from '../candidate/skill/skill.model.js';

// ============== JOB EMBEDDING FUNCTIONS ==============

// Tự động lấy job data từ DB và generate embedding
export const generateAndSaveJobEmbedding = async (jobId) => {
    try {
        // 1. Lấy job từ DB
        const job = await Job.findById(jobId);
        if (!job) {
            throw new Error(`Job with ID ${jobId} not found`);
        }

        // 2. Tự động tạo textToEmbed
        const textToEmbed = [
            job.title,
            job.description,
            job.requirements || '',
            job.location || '',
            job.salary || '',
            job.jobType || ''
        ].filter(Boolean).join(' - ');

        // 3. Generate embedding
        const embedding = await getEmbedding(textToEmbed);

        // 4. Cập nhật DB với 3 trường
        job.embedding = embedding;
        job.embeddingText = textToEmbed;
        job.embeddingUpdatedAt = new Date();
        job.embeddingDimensions = embedding.length;
        await job.save();

        return {
            jobId,
            embedding: job.embedding,
            embeddingDimensions: job.embeddingDimensions,
            embeddingText: textToEmbed,
            embeddingUpdatedAt: job.embeddingUpdatedAt
        };
    } catch (error) {
        throw new Error(`Error generating and saving job embedding: ${error.message}`);
    }
};


// Vector search jobs by query text
export const searchJobsByVector = async (queryText, limit = 10, numCandidates = 100) => {
    try {
        // 1. Generate embedding cho query text
        const queryVector = await getEmbedding(queryText);
        const queryVectorArray = Array.isArray(queryVector) 
            ? queryVector 
            : Array.from(queryVector);

        // 2. Vector search với MongoDB Atlas
        const results = await Job.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index_job",
                    path: "embedding",
                    queryVector: queryVectorArray,
                    numCandidates: numCandidates,
                    limit: limit
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    requirements: 1,
                    location: 1,
                    salary: 1,
                    jobType: 1,
                    company: 1,
                    createdAt: 1,
                    embeddingText: 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]);

        return results;
    } catch (error) {
        throw new Error(`Error searching jobs by vector: ${error.message}`);
    }
};
// Vector search jobs by existing embedding (dùng cho similar jobs)
export const searchJobsByEmbedding = async (embedding, limit = 10, numCandidates = 100) => {
    try {
        const embeddingArray = Array.isArray(embedding) 
            ? embedding 
            : Array.from(embedding);

        const results = await Job.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index_job",
                    path: "embedding",
                    queryVector: embeddingArray,
                    numCandidates: numCandidates,
                    limit: limit
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    requirements: 1,
                    location: 1,
                    salary: 1,
                    jobType: 1,
                    company: 1,
                    createdAt: 1,
                    embeddingText: 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]);

        return results;
    } catch (error) {
        throw new Error(`Error searching jobs by embedding: ${error.message}`);
    }
};

// ============== CANDIDATE EMBEDDING FUNCTIONS ==============

// Tự động lấy candidate data từ DB và generate embedding
export const generateAndSaveCandidateEmbedding = async (candidateId) => {
    try {
        // 1. Lấy candidate từ DB
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            throw new Error(`Candidate with ID ${candidateId} not found`);
        }

        const userId = candidate.userId;

        // 2. Lấy tất cả dữ liệu liên quan
        const [educations, experiences, projects, skills] = await Promise.all([
            Education.find({ userId }),
            Experience.find({ userId }),
            Project.find({ userId }),
            Skill.find({ userId })
        ]);

        // 3. Tính tuổi từ dateOfBirth
        const age = candidate.dateOfBirth 
            ? Math.floor((Date.now() - new Date(candidate.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
            : '';

        // 4. Tạo textToEmbed từ tất cả thông tin
        const textParts = [];

        // Basic info
        if (age) textParts.push(`Age: ${age}`);
        if (candidate.gender) textParts.push(`Gender: ${candidate.gender}`);
        if (candidate.address) textParts.push(`Address: ${candidate.address}`);
        if (candidate.profileSummary) textParts.push(`Summary: ${candidate.profileSummary}`);

        // Education
        if (educations.length > 0) {
            const eduText = educations.map(edu => 
                `${edu.degree} in ${edu.fieldOfStudy} from ${edu.school}${edu.grade ? ` (Grade: ${edu.grade})` : ''}`
            ).join('; ');
            textParts.push(`Education: ${eduText}`);
        }

        // Experience
        if (experiences.length > 0) {
            const expText = experiences.map(exp => 
                `${exp.jobTitle} at ${exp.company}`
            ).join('; ');
            textParts.push(`Experience: ${expText}`);
        }

        // Projects
        if (projects.length > 0) {
            const projText = projects.map(proj => 
                `${proj.projectName}: ${proj.description || ''}${proj.skills?.length ? ` (Skills: ${proj.skills.join(', ')})` : ''}`
            ).join('; ');
            textParts.push(`Projects: ${projText}`);
        }

        // Skills
        if (skills.length > 0) {
            const skillText = skills.map(skill => 
                `${skill.skillName} (${skill.proficiency || 'N/A'}${skill.yearsOfExperience ? `, ${skill.yearsOfExperience} years` : ''})`
            ).join('; ');
            textParts.push(`Skills: ${skillText}`);
        }

        const textToEmbed = textParts.join(' | ');

        // 5. Generate embedding
        const embeddingRaw = await getEmbedding(textToEmbed);
        const embedding = Array.isArray(embeddingRaw) 
            ? embeddingRaw 
            : Array.from(embeddingRaw);

        // 6. Cập nhật DB
        candidate.embedding = embedding;
        candidate.embeddingText = textToEmbed;
        candidate.embeddingUpdatedAt = new Date();
        candidate.embeddingDimensions = embedding.length;
        await candidate.save();

        return {
            candidateId,
            embeddingDimensions: candidate.embeddingDimensions,
            embeddingText: textToEmbed,
            embeddingUpdatedAt: candidate.embeddingUpdatedAt
        };
    } catch (error) {
        throw new Error(`Error generating and saving candidate embedding: ${error.message}`);
    }
};

// Vector search candidates by query text
export const searchCandidatesByVector = async (queryText, limit = 10, numCandidates = 100) => {
    try {
        // 1. Generate embedding cho query text
        const queryVector = await getEmbedding(queryText);
        const queryVectorArray = Array.isArray(queryVector) 
            ? queryVector 
            : Array.from(queryVector);

        // 2. Vector search với MongoDB Atlas
        const results = await Candidate.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index_candidate",
                    path: "embedding",
                    queryVector: queryVectorArray,
                    numCandidates: numCandidates,
                    limit: limit
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    dateOfBirth: 1,
                    gender: 1,
                    address: 1,
                    profileSummary: 1,
                    avatarUrl: 1,
                    embeddingText: 1,
                    "user.fullName": 1,
                    "user.email": 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]);

        return results;
    } catch (error) {
        throw new Error(`Error searching candidates by vector: ${error.message}`);
    }
};

// Vector search candidates by existing embedding
export const searchCandidatesByEmbedding = async (embedding, limit = 10, numCandidates = 100) => {
    try {
        const embeddingArray = Array.isArray(embedding) 
            ? embedding 
            : Array.from(embedding);

        const results = await Candidate.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index_candidate",
                    path: "embedding",
                    queryVector: embeddingArray,
                    numCandidates: numCandidates,
                    limit: limit
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    dateOfBirth: 1,
                    gender: 1,
                    address: 1,
                    profileSummary: 1,
                    avatarUrl: 1,
                    embeddingText: 1,
                    "user.fullName": 1,
                    "user.email": 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]);

        return results;
    } catch (error) {
        throw new Error(`Error searching candidates by embedding: ${error.message}`);
    }
};

