import { 
    generateAndSaveJobEmbedding, 
    searchJobsByVector, 
    searchJobsByEmbedding,
    generateAndSaveCandidateEmbedding,
    searchCandidatesByVector,
    searchCandidatesByEmbedding
} from './embedding.serivice.js';
import Job from '../job/job.model.js';
import Candidate from '../candidate/candidate.model.js';

// Generate embeddings cho job posting - chỉ cần jobId
export const generateJobEmbeddings = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Service tự động lấy job data, tạo embedding và lưu DB
        const result = await generateAndSaveJobEmbedding(jobId);

        res.status(200).json({
            success: true,
            message: 'Embedding generated and saved successfully',
            data: result
        });
    } catch (error) {
        console.error("Error generating job embeddings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Search jobs by query text (semantic search)
export const searchJobs = async (req, res) => {
    try {
        const { query, limit = 10, numCandidates = 100 } = req.body;

        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: 'Query text is required' 
            });
        }

        const results = await searchJobsByVector(
            query, 
            parseInt(limit), 
            parseInt(numCandidates)
        );

        res.status(200).json({
            success: true,
            message: 'Jobs retrieved successfully',
            data: {
                query,
                total: results.length,
                jobs: results
            }
        });
    } catch (error) {
        console.error("Error searching jobs:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Find similar jobs by jobId
export const findSimilarJobs = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { limit = 5, numCandidates = 50 } = req.query;

        // 1. Lấy job hiện tại
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        if (!job.embedding || job.embedding.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Job does not have embedding. Generate embedding first.' 
            });
        }

        // 2. Search similar jobs
        const results = await searchJobsByEmbedding(
            job.embedding, 
            parseInt(limit) + 1, // +1 để loại bỏ chính job này
            parseInt(numCandidates)
        );

        // 3. Loại bỏ chính job đó khỏi kết quả
        const similarJobs = results.filter(j => j._id.toString() !== jobId);

        res.status(200).json({
            success: true,
            message: 'Similar jobs retrieved successfully',
            data: {
                sourceJob: {
                    _id: job._id,
                    title: job.title
                },
                total: similarJobs.length,
                jobs: similarJobs
            }
        });
    } catch (error) {
        console.error("Error finding similar jobs:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== CANDIDATE CONTROLLERS ==============

// Generate embeddings cho candidate - chỉ cần candidateId
export const generateCandidateEmbeddings = async (req, res) => {
    try {
        const { candidateId } = req.params;

        // Service tự động lấy candidate data, tạo embedding và lưu DB
        const result = await generateAndSaveCandidateEmbedding(candidateId);

        res.status(200).json({
            success: true,
            message: 'Candidate embedding generated and saved successfully',
            data: result
        });
    } catch (error) {
        console.error("Error generating candidate embeddings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Search candidates by query text (semantic search)
export const searchCandidates = async (req, res) => {
    try {
        const { query, limit = 10, numCandidates = 100 } = req.body;

        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: 'Query text is required' 
            });
        }

        const results = await searchCandidatesByVector(
            query, 
            parseInt(limit), 
            parseInt(numCandidates)
        );

        res.status(200).json({
            success: true,
            message: 'Candidates retrieved successfully',
            data: {
                query,
                total: results.length,
                candidates: results
            }
        });
    } catch (error) {
        console.error("Error searching candidates:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Find similar candidates by candidateId
export const findSimilarCandidates = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { limit = 5, numCandidates = 50 } = req.query;

        // 1. Lấy candidate hiện tại
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Candidate not found' 
            });
        }

        if (!candidate.embedding || candidate.embedding.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Candidate does not have embedding. Generate embedding first.' 
            });
        }

        // 2. Search similar candidates
        const results = await searchCandidatesByEmbedding(
            candidate.embedding, 
            parseInt(limit) + 1, // +1 để loại bỏ chính candidate này
            parseInt(numCandidates)
        );

        // 3. Loại bỏ chính candidate đó khỏi kết quả
        const similarCandidates = results.filter(c => c._id.toString() !== candidateId);

        res.status(200).json({
            success: true,
            message: 'Similar candidates retrieved successfully',
            data: {
                sourceCandidate: {
                    _id: candidate._id,
                    profileSummary: candidate.profileSummary
                },
                total: similarCandidates.length,
                candidates: similarCandidates
            }
        });
    } catch (error) {
        console.error("Error finding similar candidates:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};