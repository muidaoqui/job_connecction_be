// candidate-agent.route.js
import express from 'express';
import {
    uploadCV,
    analyzeCV,
    matchJobs,
    optimizeCV,
    getCandidateProfile,
} from './candidate-agent.controller.js';

const router = express.Router();

// Upload CV
router.post('/candidate-agent/upload-cv', uploadCV);
// curl -X POST http://localhost:8080/api/rags/candidate-agent/upload-cv \
//   -F "cv=@/path/to/cv.pdf" \
//   -F "userId=user123"

// Analyze CV
router.post('/candidate-agent/analyze-cv', analyzeCV);
// curl -X POST http://localhost:8080/api/rags/candidate-agent/analyze-cv \
//   -H "Content-Type: application/json" \
//   -d '{"userId": "user123"}'

// Match jobs
router.post('/candidate-agent/match-jobs', matchJobs);
// curl -X POST http://localhost:8080/api/rags/candidate-agent/match-jobs \
//   -H "Content-Type: application/json" \
//   -d '{"userId": "user123", "preferences": {"location": "Ho Chi Minh", "topK": 10}}'

// Optimize CV
router.post('/candidate-agent/optimize-cv', optimizeCV);
// curl -X POST http://localhost:8080/api/rags/candidate-agent/optimize-cv \
//   -H "Content-Type: application/json" \
//   -d '{"userId": "user123", "targetJD": "We are looking for..."}'

// Get candidate profile
router.get('/candidate-agent/profile/:userId', getCandidateProfile);
// curl -X GET http://localhost:8080/api/rags/candidate-agent/profile/user123

export default router;
