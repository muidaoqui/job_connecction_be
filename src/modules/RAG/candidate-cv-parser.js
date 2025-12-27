// candidate-cv-parser.js
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';
import { franc } from 'franc';
import {
  extractSkillsFromJD,
  detectSeniorityLevel,
  extractContactInfo,
  extractDates
} from './rag.utils.js';

/**
 * CV Parser Service
 * Parse PDF/DOCX CVs and extract structured data
 */

/**
 * Main CV parser - detects format and routes to appropriate parser
 * @param {string} filePath - Path to CV file
 * @returns {Promise<object>} - Parsed CV data
 */
export async function parseCV(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = filePath.toLowerCase().split('.').pop();

    let rawText = '';
    let metadata = {};

    if (ext === 'pdf') {
      const result = await parsePDFCV(filePath);
      rawText = result.text;
      metadata = result.metadata;
    } else if (ext === 'docx' || ext === 'doc') {
      const result = await parseDOCXCV(filePath);
      rawText = result.text;
      metadata = result.metadata;
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // Detect language
    const language = franc(rawText.substring(0, 1000));

    // Extract structured data
    const structuredData = extractCVStructure(rawText, language);

    return {
      success: true,
      rawText,
      language,
      metadata,
      parsedData: structuredData,
      statistics: {
        totalCharacters: rawText.length,
        totalWords: rawText.split(/\s+/).length,
        yearsOfExperience: structuredData.yearsOfExperience,
        skillCount: structuredData.skills.length,
      }
    };
  } catch (error) {
    console.error('❌ Error parsing CV:', error);
    throw error;
  }
}

/**
 * Parse PDF CV
 */
async function parsePDFCV(filePath) {
  const pdfBuffer = fs.readFileSync(filePath);
  const data = await pdf(pdfBuffer);

  return {
    text: data.text,
    metadata: {
      pages: data.numpages,
      info: data.info,
    }
  };
}

/**
 * Parse DOCX CV
 */
async function parseDOCXCV(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });

  return {
    text: result.value,
    metadata: {
      messages: result.messages,
    }
  };
}

/**
 * Extract structured data from CV text
 * @param {string} text - Raw CV text
 * @param {string} language - Detected language
 * @returns {object} - Structured CV data
 */
export function extractCVStructure(text, language = 'eng') {
  // 1. Extract contact information
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const contactInfo = extractContactInfo(lines);

  // 2. Extract personal info (name usually in first few lines)
  const personalInfo = extractPersonalInfo(lines, contactInfo);

  // 3. Extract skills
  const skills = extractSkillsFromCV(text);

  // 4. Extract experience
  const experience = extractExperience(text, language);

  // 5. Extract education
  const education = extractEducation(text, language);

  // 6. Extract projects
  const projects = extractProjects(text);

  // 7. Extract certifications
  const certifications = extractCertifications(text);

  // 8. Calculate years of experience
  const yearsOfExperience = calculateYearsOfExperience(experience);

  // 9. Detect career level
  const careerLevel = detectCareerLevel({
    yearsOfExperience,
    skills,
    experience,
    education
  });

  return {
    personalInfo,
    contactInfo,
    skills,
    experience,
    education,
    projects,
    certifications,
    yearsOfExperience,
    careerLevel,
  };
}

/**
 * Extract personal information
 */
function extractPersonalInfo(lines, contactInfo) {
  // Name is usually in the first 1-3 lines, excluding contact info
  const nameLines = lines.slice(0, 5).filter(line => {
    // Skip lines that are just email/phone/urls
    if (contactInfo.emails.some(e => line.includes(e))) return false;
    if (contactInfo.phones.some(p => line.includes(p))) return false;
    if (contactInfo.urls.some(u => line.includes(u))) return false;

    // Name lines are usually short and title-cased
    return line.length < 50 && line.length > 3;
  });

  const name = nameLines[0] || 'Unknown';

  return {
    name,
    email: contactInfo.emails[0] || null,
    phone: contactInfo.phones[0] || null,
    linkedin: contactInfo.linkedin || null,
    github: contactInfo.github || null,
  };
}

/**
 * Extract skills from CV
 */
function extractSkillsFromCV(text) {
  // Reuse the skill extraction from rag.utils
  const technicalSkills = extractSkillsFromJD(text);

  // Also look for skills section
  const skillsSection = extractSection(text, ['SKILLS', 'TECHNICAL SKILLS', 'KỸ NĂNG']);

  if (skillsSection) {
    // Parse skills from section
    const additionalSkills = skillsSection
      .split(/[,;\n•]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && s.length < 30);

    // Merge and deduplicate
    return [...new Set([...technicalSkills, ...additionalSkills])];
  }

  return technicalSkills;
}

/**
 * Extract work experience
 */
function extractExperience(text, language) {
  const experienceSection = extractSection(
    text,
    ['EXPERIENCE', 'WORK EXPERIENCE', 'EMPLOYMENT', 'KINH NGHIỆM']
  );

  if (!experienceSection) return [];

  const experiences = [];
  const lines = experienceSection.split('\n').filter(l => l.trim());

  let currentExp = null;

  lines.forEach(line => {
    // Detect job title line (usually has company name and/or date)
    const dateMatch = line.match(/\d{4}/);
    const hasPipe = line.includes('|');
    const hasAt = line.includes('@') || line.includes('at ');

    if (dateMatch || hasPipe || hasAt) {
      // Save previous experience
      if (currentExp) {
        experiences.push(currentExp);
      }

      // Start new experience
      currentExp = {
        title: line,
        company: extractCompanyName(line),
        period: extractPeriod(line),
        responsibilities: [],
      };
    } else if (currentExp && line.match(/^[•●○■□▪▫\-–—]/)) {
      // Bullet point - responsibility
      const responsibility = line.replace(/^[•●○■□▪▫\-–—]\s*/, '').trim();
      currentExp.responsibilities.push(responsibility);
    }
  });

  // Add last experience
  if (currentExp) {
    experiences.push(currentExp);
  }

  return experiences;
}

/**
 * Extract education
 */
function extractEducation(text, language) {
  const educationSection = extractSection(
    text,
    ['EDUCATION', 'ACADEMIC', 'HỌC VẤN']
  );

  if (!educationSection) return [];

  const education = [];
  const lines = educationSection.split('\n').filter(l => l.trim());

  let currentEdu = null;

  lines.forEach(line => {
    // Detect degree line
    const hasDegree = /bachelor|master|phd|b\.s\.|m\.s\.|engineer|đại học|thạc sĩ/i.test(line);
    const hasYear = /\d{4}/.test(line);

    if (hasDegree || hasYear) {
      if (currentEdu) {
        education.push(currentEdu);
      }

      currentEdu = {
        degree: line,
        institution: extractInstitution(line),
        graduationYear: extractYear(line),
        details: [],
      };
    } else if (currentEdu && line.length > 10) {
      currentEdu.details.push(line);
    }
  });

  if (currentEdu) {
    education.push(currentEdu);
  }

  return education;
}

/**
 * Extract projects
 */
function extractProjects(text) {
  const projectsSection = extractSection(
    text,
    ['PROJECTS', 'KEY PROJECTS', 'DỰ ÁN']
  );

  if (!projectsSection) return [];

  const projects = [];
  const lines = projectsSection.split('\n').filter(l => l.trim());

  let currentProject = null;

  lines.forEach(line => {
    // Project title usually has special formatting or is followed by tech stack
    if (line.match(/^[A-Z]/) || line.includes(':')) {
      if (currentProject) {
        projects.push(currentProject);
      }

      currentProject = {
        name: line.split(':')[0].trim(),
        description: [],
        technologies: extractTechnologies(line),
      };
    } else if (currentProject) {
      currentProject.description.push(line);
    }
  });

  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
}

/**
 * Extract certifications
 */
function extractCertifications(text) {
  const certsSection = extractSection(
    text,
    ['CERTIFICATIONS', 'CERTIFICATES', 'CHỨNG CHỈ']
  );

  if (!certsSection) return [];

  return certsSection
    .split('\n')
    .filter(l => l.trim())
    .map(line => ({
      name: line,
      year: extractYear(line),
    }));
}

/**
 * Helper: Extract section by header
 */
function extractSection(text, headers) {
  const lines = text.split('\n');

  let startIdx = -1;
  let endIdx = lines.length;

  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    if (headers.some(h => line.includes(h))) {
      startIdx = i + 1;
      break;
    }
  }

  if (startIdx === -1) return null;

  // Find section end (next section header)
  const allHeaders = [
    'EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS', 'CERTIFICATIONS',
    'KINH NGHIỆM', 'HỌC VẤN', 'KỸ NĂNG', 'DỰ ÁN', 'CHỨNG CHỈ'
  ];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    const isHeader = allHeaders.some(h => line === h || line.startsWith(h));
    if (isHeader && !headers.some(h => line.includes(h))) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(startIdx, endIdx).join('\n');
}

/**
 * Helper functions
 */
function extractCompanyName(line) {
  // Try to extract company name from patterns like "Company Name | Title" or "Title @ Company"
  if (line.includes('|')) {
    return line.split('|')[0].trim();
  }
  if (line.includes('@')) {
    return line.split('@')[1].trim();
  }
  if (line.includes(' at ')) {
    return line.split(' at ')[1].trim();
  }
  return line;
}

function extractPeriod(line) {
  const dateMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current|Hiện tại)/i);
  return dateMatch ? dateMatch[0] : null;
}

function extractInstitution(line) {
  // Institution usually comes after degree
  const parts = line.split(/,|@|at/);
  return parts.length > 1 ? parts[1].trim() : line;
}

function extractYear(line) {
  const match = line.match(/\d{4}/);
  return match ? parseInt(match[0]) : null;
}

function extractTechnologies(line) {
  const techKeywords = ['React', 'Node', 'Python', 'Java', 'AWS', 'Docker', 'MongoDB'];
  return techKeywords.filter(tech => line.includes(tech));
}

/**
 * Calculate total years of experience
 */
export function calculateYearsOfExperience(experiences) {
  if (!experiences || experiences.length === 0) return 0;

  let totalMonths = 0;

  experiences.forEach(exp => {
    if (!exp.period) return;

    const match = exp.period.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current|Hiện tại)/i);
    if (!match) return;

    const startYear = parseInt(match[1]);
    const endYear = match[2].match(/\d{4}/)
      ? parseInt(match[2])
      : new Date().getFullYear();

    totalMonths += (endYear - startYear) * 12;
  });

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

/**
 * Detect career level based on CV data
 */
export function detectCareerLevel(cvData) {
  const { yearsOfExperience, skills, experience, education } = cvData;

  let score = 0;

  // Years of experience scoring
  if (yearsOfExperience < 2) score += 1;
  else if (yearsOfExperience < 5) score += 2;
  else if (yearsOfExperience < 8) score += 3;
  else score += 4;

  // Skills count scoring
  if (skills.length >= 15) score += 1;
  if (skills.length >= 25) score += 1;

  // Leadership indicators
  const hasLeadership = experience.some(exp =>
    /lead|manager|architect|principal|staff/i.test(exp.title)
  );
  if (hasLeadership) score += 2;

  // Education scoring
  const hasMaster = education.some(edu => /master|thạc sĩ/i.test(edu.degree));
  const hasPhd = education.some(edu => /phd|tiến sĩ/i.test(edu.degree));
  if (hasMaster) score += 1;
  if (hasPhd) score += 1;

  // Determine level
  if (score <= 2) return { level: 'junior', confidence: 80 };
  if (score <= 4) return { level: 'mid', confidence: 75 };
  if (score <= 6) return { level: 'senior', confidence: 80 };
  return { level: 'lead', confidence: 85 };
}

/**
 * Format CV data for embedding
 */
export function formatCVForEmbedding(cvData) {
  const parts = [];

  // Personal summary
  parts.push(`${cvData.personalInfo.name}`);

  // Skills
  if (cvData.skills.length > 0) {
    parts.push(`Skills: ${cvData.skills.join(', ')}`);
  }

  // Experience
  cvData.experience.forEach(exp => {
    parts.push(`${exp.title} at ${exp.company}`);
    if (exp.responsibilities.length > 0) {
      parts.push(exp.responsibilities.join('. '));
    }
  });

  // Education
  cvData.education.forEach(edu => {
    parts.push(`${edu.degree} from ${edu.institution}`);
  });

  // Projects
  cvData.projects.forEach(proj => {
    parts.push(`Project: ${proj.name}. ${proj.description.join(' ')}`);
  });

  return parts.join('\n\n');
}
