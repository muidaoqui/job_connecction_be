import express from 'express';
import { 
    generateJobEmbeddings, 
    searchJobs, 
    findSimilarJobs,
    generateCandidateEmbeddings,
    searchCandidates,
    findSimilarCandidates
} from './embedding.controller.js';

const router = express.Router();

// ============== JOB ROUTES ==============
router.post('/job/generate/:jobId', generateJobEmbeddings);
router.post('/job/search', searchJobs);
router.get('/job/similar/:jobId', findSimilarJobs);

// ============== CANDIDATE ROUTES ==============
router.post('/candidate/generate/:candidateId', generateCandidateEmbeddings);
router.post('/candidate/search', searchCandidates);
router.get('/candidate/similar/:candidateId', findSimilarCandidates);

export default router;