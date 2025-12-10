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
// Get recommended jobs for logged-in candidate
export const getRecommendedJobsForCandidate = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const { limit = 6 } = req.query;

        // 1. Tìm candidate profile
        const candidate = await Candidate.findOne({ userId });
        if (!candidate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Candidate profile not found' 
            });
        }

        // 2. Kiểm tra xem candidate đã có embedding chưa
        if (!candidate.embeddingText || !candidate.embedding || candidate.embedding.length === 0) {
            return res.status(200).json({
                success: false,
                needsProfile: true,
                message: 'Vui lòng cập nhật đầy đủ hồ sơ của bạn (học vấn, kinh nghiệm, kỹ năng) để nhận gợi ý công việc phù hợp'
            });
        }

        // 3. Search jobs bằng candidate embedding
        const results = await searchJobsByEmbedding(
            candidate.embedding,
            parseInt(limit),
            100 // numCandidates
        );

        res.status(200).json({
            success: true,
            message: 'Recommended jobs retrieved successfully',
            data: {
                total: results.length,
                jobs: results,
                candidateProfile: {
                    embeddingText: candidate.embeddingText,
                    lastUpdated: candidate.embeddingUpdatedAt
                }
            }
        });
    } catch (error) {
        console.error("Error getting recommended jobs:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============== BATCH OPERATIONS ==============

// Batch generate embeddings for all jobs
export const batchGenerateAllJobEmbeddings = async (req, res) => {
    try {
        // Lấy tất cả jobs
        const jobs = await Job.find({}).select('_id title');
        
        if (jobs.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No jobs found to generate embeddings',
                data: { total: 0, successful: 0, failed: 0 }
            });
        }

        console.log(`🚀 Starting batch embedding generation for ${jobs.length} jobs...`);

        const results = {
            total: jobs.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        // Process jobs one by one (để tránh overload)
        for (const job of jobs) {
            try {
                console.log(`Processing job ${results.successful + results.failed + 1}/${jobs.length}: ${job.title}`);
                
                await generateAndSaveJobEmbedding(job._id.toString());
                results.successful++;
                
                console.log(`✅ Success: ${job.title}`);
            } catch (error) {
                results.failed++;
                results.errors.push({
                    jobId: job._id,
                    title: job.title,
                    error: error.message
                });
                
                console.error(`❌ Failed: ${job.title} - ${error.message}`);
            }
        }

        console.log(`✅ Batch generation completed: ${results.successful} successful, ${results.failed} failed`);

        res.status(200).json({
            success: true,
            message: `Batch generation completed`,
            data: results
        });
    } catch (error) {
        console.error("Error in batch job embedding generation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Batch generate embeddings for jobs without embeddings
export const batchGenerateMissingJobEmbeddings = async (req, res) => {
    try {
        // Chỉ lấy jobs chưa có embedding
        const jobs = await Job.find({ 
            $or: [
                { embedding: { $exists: false } },
                { embedding: [] },
                { embeddingText: { $exists: false } }
            ]
        }).select('_id title');
        
        if (jobs.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'All jobs already have embeddings',
                data: { total: 0, successful: 0, failed: 0 }
            });
        }

        console.log(`🚀 Starting batch embedding generation for ${jobs.length} jobs without embeddings...`);

        const results = {
            total: jobs.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        for (const job of jobs) {
            try {
                console.log(`Processing job ${results.successful + results.failed + 1}/${jobs.length}: ${job.title}`);
                
                await generateAndSaveJobEmbedding(job._id.toString());
                results.successful++;
                
                console.log(`✅ Success: ${job.title}`);
                
                // Optional: Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
            } catch (error) {
                results.failed++;
                results.errors.push({
                    jobId: job._id,
                    title: job.title,
                    error: error.message
                });
                
                console.error(`❌ Failed: ${job.title} - ${error.message}`);
            }
        }

        console.log(`✅ Batch generation completed: ${results.successful} successful, ${results.failed} failed`);

        res.status(200).json({
            success: true,
            message: `Batch generation completed`,
            data: results
        });
    } catch (error) {
        console.error("Error in batch job embedding generation:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get embedding statistics
export const getEmbeddingStats = async (req, res) => {
    try {
        const totalJobs = await Job.countDocuments();
        const jobsWithEmbedding = await Job.countDocuments({ 
            embedding: { $exists: true, $ne: [] },
            embeddingText: { $exists: true }
        });
        const jobsWithoutEmbedding = totalJobs - jobsWithEmbedding;

        const totalCandidates = await Candidate.countDocuments();
        const candidatesWithEmbedding = await Candidate.countDocuments({ 
            embedding: { $exists: true, $ne: [] },
            embeddingText: { $exists: true }
        });
        const candidatesWithoutEmbedding = totalCandidates - candidatesWithEmbedding;

        res.status(200).json({
            success: true,
            data: {
                jobs: {
                    total: totalJobs,
                    withEmbedding: jobsWithEmbedding,
                    withoutEmbedding: jobsWithoutEmbedding,
                    percentage: totalJobs > 0 ? Math.round((jobsWithEmbedding / totalJobs) * 100) : 0
                },
                candidates: {
                    total: totalCandidates,
                    withEmbedding: candidatesWithEmbedding,
                    withoutEmbedding: candidatesWithoutEmbedding,
                    percentage: totalCandidates > 0 ? Math.round((candidatesWithEmbedding / totalCandidates) * 100) : 0
                }
            }
        });
    } catch (error) {
        console.error("Error getting embedding stats:", error);
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

// Force update job embedding
export const forceUpdateJobEmbedding = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const result = await generateAndSaveJobEmbedding(jobId);

        res.status(200).json({
            success: true,
            message: 'Job embedding force updated successfully',
            data: result
        });
    } catch (error) {
        console.error("Error force updating job embedding:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Force update candidate embedding
export const forceUpdateCandidateEmbedding = async (req, res) => {
    try {
        const { candidateId } = req.params;
        
        const result = await generateAndSaveCandidateEmbedding(candidateId);

        res.status(200).json({
            success: true,
            message: 'Candidate embedding force updated successfully',
            data: result
        });
    } catch (error) {
        console.error("Error force updating candidate embedding:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Batch update all job embeddings
export const batchUpdateJobEmbeddings = async (req, res) => {
    try {
        const jobs = await Job.find({ embedding: { $exists: false } }).select('_id');
        
        const results = await Promise.allSettled(
            jobs.map(job => generateAndSaveJobEmbedding(job._id.toString()))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        res.status(200).json({
            success: true,
            message: `Batch update completed`,
            data: {
                total: jobs.length,
                successful,
                failed
            }
        });
    } catch (error) {
        console.error("Error batch updating job embeddings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Batch update all candidate embeddings
export const batchUpdateCandidateEmbeddings = async (req, res) => {
    try {
        const candidates = await Candidate.find({ embedding: { $exists: false } }).select('_id');
        
        const results = await Promise.allSettled(
            candidates.map(candidate => generateAndSaveCandidateEmbedding(candidate._id.toString()))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        res.status(200).json({
            success: true,
            message: `Batch update completed`,
            data: {
                total: candidates.length,
                successful,
                failed
            }
        });
    } catch (error) {
        console.error("Error batch updating candidate embeddings:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

