// candidate-cv.model.js
import mongoose from 'mongoose';

const CandidateCVSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    versions: [{
        versionNumber: {
            type: Number,
            required: true,
        },
        uploadDate: {
            type: Date,
            default: Date.now,
        },
        filePath: String,
        fileName: String,
        fileSize: Number,
        rawText: String,
        parsedData: {
            personalInfo: {
                name: String,
                email: String,
                phone: String,
                linkedin: String,
                github: String,
            },
            contactInfo: mongoose.Schema.Types.Mixed,
            skills: [String],
            experience: [{
                title: String,
                company: String,
                period: String,
                responsibilities: [String],
            }],
            education: [{
                degree: String,
                institution: String,
                graduationYear: Number,
                details: [String],
            }],
            projects: [{
                name: String,
                description: [String],
                technologies: [String],
            }],
            certifications: [{
                name: String,
                year: Number,
            }],
            yearsOfExperience: Number,
            careerLevel: {
                level: {
                    type: String,
                    enum: ['junior', 'mid', 'senior', 'lead'],
                },
                confidence: Number,
            },
        },
        embedding: [Number], // Vector embedding
        analysisResults: mongoose.Schema.Types.Mixed,
        optimizationHistory: [{
            targetJD: String,
            optimizedCV: String,
            atsScore: Number,
            date: Date,
        }],
    }],
    currentVersion: {
        type: Number,
        default: 1,
    },
    metadata: {
        targetRole: String,
        targetLevel: {
            type: String,
            enum: ['junior', 'mid', 'senior', 'lead'],
        },
        preferredLocations: [String],
        desiredSalaryRange: {
            min: Number,
            max: Number,
            currency: {
                type: String,
                default: 'VND',
            },
        },
        jobPreferences: {
            workMode: {
                type: String,
                enum: ['onsite', 'remote', 'hybrid', 'any'],
            },
            industries: [String],
            companySize: [String],
        },
    },
    jobMatches: [{
        jobId: mongoose.Schema.Types.ObjectId,
        matchScore: Number,
        fitExplanation: String,
        matchedAt: Date,
        status: {
            type: String,
            enum: ['interested', 'applied', 'interviewing', 'rejected', 'accepted', 'ignored'],
            default: 'interested',
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Indexes
CandidateCVSchema.index({ 'parsedData.skills': 1 });
CandidateCVSchema.index({ 'parsedData.yearsOfExperience': 1 });
CandidateCVSchema.index({ 'parsedData.careerLevel.level': 1 });
CandidateCVSchema.index({ 'metadata.targetRole': 1 });

// Methods
CandidateCVSchema.methods.addVersion = function (versionData) {
    const versionNumber = this.versions.length + 1;
    this.versions.push({
        versionNumber,
        ...versionData,
    });
    this.currentVersion = versionNumber;
    return this.save();
};

CandidateCVSchema.methods.getCurrentVersion = function () {
    return this.versions.find(v => v.versionNumber === this.currentVersion);
};

CandidateCVSchema.methods.addJobMatch = function (jobId, matchScore, fitExplanation) {
    this.jobMatches.push({
        jobId,
        matchScore,
        fitExplanation,
        matchedAt: new Date(),
    });
    return this.save();
};

CandidateCVSchema.methods.updateJobMatchStatus = function (jobId, status) {
    const match = this.jobMatches.find(m => m.jobId.toString() === jobId.toString());
    if (match) {
        match.status = status;
        return this.save();
    }
    throw new Error('Job match not found');
};

CandidateCVSchema.methods.getAnalysisSummary = function () {
    const currentVer = this.getCurrentVersion();
    if (!currentVer) return null;

    return {
        name: currentVer.parsedData.personalInfo.name,
        email: currentVer.parsedData.personalInfo.email,
        yearsOfExperience: currentVer.parsedData.yearsOfExperience,
        careerLevel: currentVer.parsedData.careerLevel,
        skillCount: currentVer.parsedData.skills.length,
        topSkills: currentVer.parsedData.skills.slice(0, 10),
        experienceCount: currentVer.parsedData.experience.length,
        educationCount: currentVer.parsedData.education.length,
        projectCount: currentVer.parsedData.projects.length,
    };
};

const CandidateCV = mongoose.model('CandidateCV', CandidateCVSchema);

export default CandidateCV;
