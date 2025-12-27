// candidate-ats-checker.js
/**
 * ATS (Applicant Tracking System) Compatibility Checker
 * Rule-based checker để đánh giá CV có ATS-friendly không
 */

/**
 * Check ATS compatibility của CV
 * @param {string} cvText - CV text content
 * @param {Array} targetKeywords - Keywords from target JD
 * @returns {object} - ATS score và suggestions
 */
export function checkATSCompatibility(cvText, targetKeywords = []) {
    const scores = {
        keyword_match: 0,
        format_score: 0,
        readability_score: 0,
        structure_score: 0,
    };

    const issues = [];
    const suggestions = [];

    // 1. Keyword Match Score
    const keywordResult = checkKeywordMatch(cvText, targetKeywords);
    scores.keyword_match = keywordResult.score;
    issues.push(...keywordResult.issues);
    suggestions.push(...keywordResult.suggestions);

    // 2. Format Score
    const formatResult = checkFormat(cvText);
    scores.format_score = formatResult.score;
    issues.push(...formatResult.issues);
    suggestions.push(...formatResult.suggestions);

    // 3. Readability Score
    const readabilityResult = checkReadability(cvText);
    scores.readability_score = readabilityResult.score;

    // 4. Structure Score
    const structureResult = checkStructure(cvText);
    scores.structure_score = structureResult.score;
    issues.push(...structureResult.issues);
    suggestions.push(...structureResult.suggestions);

    // Calculate overall score
    const overall_score = Math.round(
        (scores.keyword_match * 0.4 +
            scores.format_score * 0.25 +
            scores.readability_score * 0.15 +
            scores.structure_score * 0.2)
    );

    return {
        overall_score,
        scores,
        issues,
        suggestions,
        ats_friendly: overall_score >= 70,
    };
}

/**
 * Check keyword match với target JD
 */
function checkKeywordMatch(cvText, targetKeywords) {
    if (!targetKeywords || targetKeywords.length === 0) {
        return {
            score: 100,
            issues: [],
            suggestions: ['No target keywords provided for comparison'],
        };
    }

    const cvLower = cvText.toLowerCase();
    const matchedKeywords = [];
    const missingKeywords = [];

    targetKeywords.forEach(keyword => {
        if (cvLower.includes(keyword.toLowerCase())) {
            matchedKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    });

    const matchRate = (matchedKeywords.length / targetKeywords.length) * 100;
    const score = Math.round(matchRate);

    const issues = [];
    const suggestions = [];

    if (score < 70) {
        issues.push({
            type: 'error',
            message: `Low keyword match: ${score}% (${matchedKeywords.length}/${targetKeywords.length})`,
        });
    } else if (score < 85) {
        issues.push({
            type: 'warning',
            message: `Moderate keyword match: ${score}%`,
        });
    }

    // Suggest adding missing critical keywords
    const criticalMissing = missingKeywords.slice(0, 5);
    if (criticalMissing.length > 0) {
        suggestions.push(`Add these keywords: ${criticalMissing.join(', ')}`);
    }

    return { score, issues, suggestions, matchedKeywords, missingKeywords };
}

/**
 * Check format compliance
 */
function checkFormat(cvText) {
    let score = 100;
    const issues = [];
    const suggestions = [];

    // Check for problematic characters/formatting
    const problematicPatterns = [
        { pattern: /[\u2022\u2023\u25E6\u2043\u2219]/, name: 'Special bullets', penalty: 5 },
        { pattern: /[\u00A0]/, name: 'Non-breaking spaces', penalty: 3 },
        { pattern: /\t/, name: 'Tab characters', penalty: 5 },
        { pattern: /_{3,}/, name: 'Underscores for lines', penalty: 10 },
        { pattern: /={3,}/, name: 'Equals signs for lines', penalty: 10 },
    ];

    problematicPatterns.forEach(({ pattern, name, penalty }) => {
        if (pattern.test(cvText)) {
            score -= penalty;
            issues.push({
                type: 'warning',
                message: `Contains ${name} - may not parse correctly in some ATS`,
            });
            suggestions.push(`Replace ${name} with standard formatting`);
        }
    });

    // Check for tables (common ATS issue)
    if (cvText.includes('|') && cvText.split('|').length > 10) {
        score -= 15;
        issues.push({
            type: 'error',
            message: 'Appears to contain tables - most ATS cannot parse tables correctly',
        });
        suggestions.push('Replace tables with bullet points or simple text');
    }

    // Check for headers/footers indicators
    const headerFooterIndicators = ['Page ', 'Confidential', 'Resume of'];
    headerFooterIndicators.forEach(indicator => {
        if (cvText.includes(indicator)) {
            score -= 5;
            issues.push({
                type: 'warning',
                message: `May contain headers/footers with "${indicator}"`,
            });
        }
    });

    return { score: Math.max(0, score), issues, suggestions };
}

/**
 * Check readability
 */
function checkReadability(cvText) {
    const words = cvText.split(/\s+/).filter(w => w.length > 0);
    const sentences = cvText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const avgWordsPerSentence = words.length / sentences.length;

    let score = 100;

    // Ideal: 15-20 words per sentence
    if (avgWordsPerSentence < 10) {
        score = 85; // Too choppy
    } else if (avgWordsPerSentence > 25) {
        score = 75; // Too complex
    } else if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
        score = 100; // Ideal
    } else {
        score = 90;
    }

    return { score };
}

/**
 * Check structure (standard sections)
 */
function checkStructure(cvText) {
    let score = 100;
    const issues = [];
    const suggestions = [];

    const requiredSections = [
        { name: 'Contact Info', patterns: ['email', 'phone', '@'], weight: 20 },
        { name: 'Experience', patterns: ['EXPERIENCE', 'WORK', 'EMPLOYMENT', 'KINH NGHIỆM'], weight: 30 },
        { name: 'Education', patterns: ['EDUCATION', 'HỌC VẤN', 'ACADEMIC'], weight: 20 },
        { name: 'Skills', patterns: ['SKILLS', 'KỸ NĂNG', 'TECHNICAL'], weight: 20 },
    ];

    const cvUpper = cvText.toUpperCase();

    requiredSections.forEach(section => {
        const hasSection = section.patterns.some(pattern =>
            cvUpper.includes(pattern.toUpperCase())
        );

        if (!hasSection) {
            score -= section.weight;
            issues.push({
                type: 'error',
                message: `Missing ${section.name} section`,
            });
            suggestions.push(`Add a clear ${section.name} section with standard header`);
        }
    });

    // Check for good practices
    const goodPractices = [
        { name: 'Bullet points', pattern: /[•\-]\s/, bonus: 5 },
        { name: 'Dates', pattern: /\d{4}/, bonus: 5 },
        { name: 'Quantified achievements', pattern: /\d+%|\d+x|increased|improved|reduced/i, bonus: 10 },
    ];

    goodPractices.forEach(practice => {
        if (practice.pattern.test(cvText)) {
            score = Math.min(100, score + practice.bonus);
        }
    });

    return { score: Math.max(0, score), issues, suggestions };
}

/**
 * Extract keywords from JD for ATS checking
 */
export function extractKeywordsFromJD(jdText) {
    const keywords = [];

    // Extract technical skills
    const techSkills = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
        'Git', 'CI/CD', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices',
    ];

    techSkills.forEach(skill => {
        if (new RegExp(`\\b${skill}\\b`, 'i').test(jdText)) {
            keywords.push(skill);
        }
    });

    // Extract action verbs (important for ATS)
    const actionVerbs = [
        'develop', 'design', 'implement', 'manage', 'lead', 'create', 'build',
        'optimize', 'improve', 'collaborate', 'coordinate', 'analyze', 'maintain',
    ];

    actionVerbs.forEach(verb => {
        if (new RegExp(`\\b${verb}`, 'i').test(jdText)) {
            keywords.push(verb);
        }
    });

    // Extract requirements keywords
    const requirementKeywords = [
        'experience', 'years', 'bachelor', 'master', 'degree', 'certification',
        'team', 'project', 'product', 'customer', 'stakeholder',
    ];

    requirementKeywords.forEach(keyword => {
        if (new RegExp(`\\b${keyword}`, 'i').test(jdText)) {
            keywords.push(keyword);
        }
    });

    // Deduplicate
    return [...new Set(keywords)];
}

/**
 * Calculate keyword density
 */
export function calculateKeywordDensity(cvText, keyword) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = cvText.match(regex);
    const wordCount = cvText.split(/\s+/).length;

    if (!matches) return 0;

    return (matches.length / wordCount) * 100;
}

/**
 * Suggest keyword placements
 */
export function suggestKeywordPlacements(cvText, missingKeywords) {
    const suggestions = [];

    missingKeywords.forEach(keyword => {
        // Suggest where to add the keyword
        if (/skill|technical|competenc/i.test(keyword)) {
            suggestions.push({
                keyword,
                section: 'Skills',
                suggestion: `Add "${keyword}" to your Skills section`,
            });
        } else if (/experience|year|project/i.test(keyword)) {
            suggestions.push({
                keyword,
                section: 'Experience',
                suggestion: `Mention "${keyword}" in your work experience descriptions`,
            });
        } else {
            suggestions.push({
                keyword,
                section: 'General',
                suggestion: `Incorporate "${keyword}" naturally throughout your CV`,
            });
        }
    });

    return suggestions;
}
