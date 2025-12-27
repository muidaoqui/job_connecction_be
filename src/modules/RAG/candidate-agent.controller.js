// candidate-agent.controller.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseCV } from './candidate-cv-parser.js';
import CandidateCV from './candidate-cv.model.js';
import {
    analyzeCandidateCV,
    matchJobsForCandidate,
    optimizeCVForJob,
} from './candidate-agent.service.js';
import embeddingsService from './rag.embeddings.js';
import { formatCVForEmbedding } from './candidate-cv-parser.js';

// Configure multer for CV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cv-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx', '.doc'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * Upload and parse CV
 * POST /api/rags/candidate-agent/upload-cv
 */
export const uploadCV = [
    upload.single('cv'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                });
            }

            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'userId is required',
                });
            }

            // Parse CV
            const parsedCV = await parseCV(req.file.path);

            // Generate embedding
            await embeddingsService.initialize();
            const cvText = formatCVForEmbedding(parsedCV.parsedData);
            const embedding = await embeddingsService.embedText(cvText);

            // Save to database
            let candidateCV = await CandidateCV.findOne({ userId });

            if (!candidateCV) {
                candidateCV = new CandidateCV({ userId, versions: [], currentVersion: 1 });
            }

            await candidateCV.addVersion({
                filePath: req.file.path,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                rawText: parsedCV.rawText,
                parsedData: parsedCV.parsedData,
                embedding,
            });

            res.status(200).json({
                success: true,
                message: 'CV uploaded and parsed successfully',
                data: {
                    versionNumber: candidateCV.currentVersion,
                    statistics: parsedCV.statistics,
                    parsedData: parsedCV.parsedData,
                },
            });
        } catch (error) {
            console.error('Error uploading CV:', error);
            res.status(500).json({
                success: false,
                message: 'Error processing CV',
                error: error.message,
            });
        }
    },
];

/**
 * Analyze CV
 * POST /api/rags/candidate-agent/analyze-cv
 */
export const analyzeCV = async (req, res) => {
    try {
        const { userId, cvId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        const analysis = await analyzeCandidateCV(userId, cvId);

        res.status(200).json({
            success: true,
            message: 'CV analysis completed',
            data: analysis,
        });
    } catch (error) {
        console.error('Error analyzing CV:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing CV',
            error: error.message,
        });
    }
};

/**
 * Match jobs for candidate
 * POST /api/rags/candidate-agent/match-jobs
 */
export const matchJobs = async (req, res) => {
    try {
        const { userId, preferences } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        const matches = await matchJobsForCandidate(userId, preferences || {});

        res.status(200).json({
            success: true,
            message: 'Job matching completed',
            data: matches,
        });
    } catch (error) {
        console.error('Error matching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Error matching jobs',
            error: error.message,
        });
    }
};

/**
 * Optimize CV for target JD
 * POST /api/rags/candidate-agent/optimize-cv
 */
export const optimizeCV = async (req, res) => {
    try {
        const { userId, targetJD } = req.body;

        if (!userId || !targetJD) {
            return res.status(400).json({
                success: false,
                message: 'userId and targetJD are required',
            });
        }

        const result = await optimizeCVForJob(userId, targetJD);

        res.status(200).json({
            success: true,
            message: 'CV optimization completed',
            data: result,
        });
    } catch (error) {
        console.error('Error optimizing CV:', error);
        res.status(500).json({
            success: false,
            message: 'Error optimizing CV',
            error: error.message,
        });
    }
};

/**
 * Get candidate profile
 * GET /api/rags/candidate-agent/profile/:userId
 */
export const getCandidateProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const candidateCV = await CandidateCV.findOne({ userId });

        if (!candidateCV) {
            return res.status(404).json({
                success: false,
                message: 'No profile found for this user',
            });
        }

        const summary = candidateCV.getAnalysisSummary();

        res.status(200).json({
            success: true,
            data: {
                summary,
                totalVersions: candidateCV.versions.length,
                currentVersion: candidateCV.currentVersion,
                metadata: candidateCV.metadata,
                jobMatches: candidateCV.jobMatches.length,
            },
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving profile',
            error: error.message,
        });
    }
};
