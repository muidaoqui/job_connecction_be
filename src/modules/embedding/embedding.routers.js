import express from 'express';
import { 
    generateJobEmbeddings, 
    searchJobs, 
    findSimilarJobs,
    generateCandidateEmbeddings,
    searchCandidates,
    findSimilarCandidates,
    forceUpdateJobEmbedding,
    forceUpdateCandidateEmbedding,
    getRecommendedJobsForCandidate,
    batchGenerateAllJobEmbeddings,
    batchGenerateMissingJobEmbeddings,
    getEmbeddingStats
} from './embedding.controller.js';
import { verifyToken } from "../auth/auth.middleware.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log(`📍 Embedding Route: ${req.method} ${req.path}`);
    next();
});

// ============== JOB ROUTES ==============
router.post('/job/generate/:jobId', generateJobEmbeddings);
router.post('/job/search', searchJobs);
router.get('/job/similar/:jobId', findSimilarJobs);
router.put('/job/update/:jobId', forceUpdateJobEmbedding);

// ============== BATCH ROUTES ==============
router.post('/job/batch-generate-all', batchGenerateAllJobEmbeddings);
router.post('/job/batch-generate-missing', batchGenerateMissingJobEmbeddings);
router.get('/stats', getEmbeddingStats);

// ============== CANDIDATE ROUTES ==============
router.post('/candidate/generate/:candidateId', generateCandidateEmbeddings);
router.post('/candidate/search', searchCandidates);
router.get('/candidate/similar/:candidateId', findSimilarCandidates);
router.put('/candidate/update/:candidateId', forceUpdateCandidateEmbedding);

// ============== RECOMMENDATIONS ==============
router.get('/recommendations/jobs', verifyToken, getRecommendedJobsForCandidate);

export default router;