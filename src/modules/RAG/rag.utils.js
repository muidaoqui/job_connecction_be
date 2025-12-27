export function smartChunking(sentences, chunkSize, chunkOverlap) {
  const chunks = [];
  let chunk = "";

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    // Nếu gặp section header, bắt đầu chunk mới
    if (sentence.includes('###SECTION:')) {
      if (chunk.trim()) chunks.push(chunk.trim());
      chunk = sentence + " ";
      continue;
    }

    if ((chunk + sentence).length <= chunkSize) {
      chunk += sentence + " ";
    } else {
      if (chunk.trim()) chunks.push(chunk.trim());

      // Overlap: lấy lại phần cuối chunk trước
      if (chunkOverlap > 0 && chunks.length > 0) {
        const prev = chunks[chunks.length - 1];
        const overlapText = prev.slice(-chunkOverlap);
        chunk = overlapText + sentence + " ";
      } else {
        chunk = sentence + " ";
      }
    }
  }

  if (chunk.trim()) chunks.push(chunk.trim());
  return chunks;
}

/**
 * Parse Resume structure từ raw text
 */
export function parseResumeStructure(text, language) {
  // 1. Chuẩn hóa text
  let cleanText = text.replace(/\r\n|\r/g, "\n");
  cleanText = cleanText.replace(/[ \t]+/g, " ");

  // 2. Tách thành các dòng
  const lines = cleanText.split("\n").map(line => line.trim()).filter(line => line.length > 0);

  // 3. Trích xuất contact info
  const contactInfo = extractContactInfo(lines);

  // 4. Nhận diện sections
  const sections = extractSections(lines, language);

  // 5. Trích xuất bullets
  const bullets = extractBullets(lines);

  // 6. Trích xuất dates
  const dates = extractDates(lines);

  // 7. Tạo clean text (loại bỏ nhiễu)
  const finalCleanText = lines.join("\n");

  return {
    cleanText: finalCleanText,
    sections,
    contactInfo,
    bullets,
    dates,
  };
}


/**
 * Trích xuất thông tin liên hệ (email, phone, links)
 */
export function extractContactInfo(lines) {
  const contactInfo = {
    emails: [],
    phones: [],
    urls: [],
    linkedin: null,
    github: null,
  };

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /\b(\+84|0)[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3,4}\b/g;
  const urlRegex = /https?:\/\/[^\s]+/g;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /github\.com\/[\w-]+/gi;

  const firstFewLines = lines.slice(0, 10).join(" "); // Check first 10 lines

  // Extract emails
  const emails = firstFewLines.match(emailRegex);
  if (emails) contactInfo.emails = [...new Set(emails)];

  // Extract phones
  const phones = firstFewLines.match(phoneRegex);
  if (phones) contactInfo.phones = [...new Set(phones)];

  // Extract URLs
  const urls = firstFewLines.match(urlRegex);
  if (urls) contactInfo.urls = [...new Set(urls)];

  // Extract LinkedIn
  const linkedin = firstFewLines.match(linkedinRegex);
  if (linkedin) contactInfo.linkedin = linkedin[0];

  // Extract GitHub
  const github = firstFewLines.match(githubRegex);
  if (github) contactInfo.github = github[0];

  return contactInfo;
}


/**
 * Nhận diện Sections (EXPERIENCE, EDUCATION, SKILLS...)
 */
export function extractSections(lines, language) {
  const sections = [];

  // Section patterns cho tiếng Anh
  const enSectionPatterns = [
    /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY)$/i,
    /^(EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS)$/i,
    /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERTISE)$/i,
    /^(PROJECTS|KEY PROJECTS|NOTABLE PROJECTS)$/i,
    /^(CERTIFICATIONS|CERTIFICATES|LICENSES)$/i,
    /^(AWARDS|HONORS|ACHIEVEMENTS)$/i,
    /^(SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE)$/i,
    /^(LANGUAGES|LANGUAGE SKILLS)$/i,
    /^(PUBLICATIONS|RESEARCH)$/i,
    /^(VOLUNTEER|VOLUNTEER EXPERIENCE)$/i,
  ];

  // Section patterns cho tiếng Việt
  const viSectionPatterns = [
    /^(KINH NGHIỆM|KINH NGHIỆM LÀM VIỆC|QUÁ TRÌNH CÔNG TÁC)$/i,
    /^(HỌC VẤN|TRÌNH ĐỘ|BẰNG CẤP)$/i,
    /^(KỸ NĂNG|KỸ NĂNG CHUYÊN MÔN|NĂNG LỰC)$/i,
    /^(DỰ ÁN|CÁC DỰ ÁN)$/i,
    /^(CHỨNG CHỈ|BẰNG CẤP CHỨNG CHỈ)$/i,
    /^(GIẢI THƯỞNG|THÀNH TÍCH)$/i,
    /^(TÓMPUBLIC TẮT|MỤC TIÊU NGHỀ NGHIỆP|GIỚI THIỆU)$/i,
    /^(NGOẠI NGỮ|KỸ NĂNG NGOẠI NGỮ)$/i,
  ];

  const patterns = language === 'vie' ? viSectionPatterns : enSectionPatterns;

  lines.forEach((line, index) => {
    // Check if line is all uppercase and matches pattern
    const isAllCaps = line === line.toUpperCase() && line.length > 2;
    const matchesPattern = patterns.some(pattern => pattern.test(line));

    if (isAllCaps || matchesPattern) {
      sections.push({
        title: line,
        lineNumber: index,
        type: detectSectionType(line),
      });
    }
  });

  // Add content to each section
  sections.forEach((section, idx) => {
    const startLine = section.lineNumber + 1;
    const endLine = idx < sections.length - 1
      ? sections[idx + 1].lineNumber
      : lines.length;

    section.content = lines.slice(startLine, endLine).join("\n");
    section.lineCount = endLine - startLine;
  });

  return sections;
}


/**
 * Xác định loại section
 */
export function detectSectionType(title) {
  const titleUpper = title.toUpperCase();

  if (/EXPERIENCE|KINH NGHIỆM/.test(titleUpper)) return 'experience';
  if (/EDUCATION|HỌC VẤN/.test(titleUpper)) return 'education';
  if (/SKILLS|KỸ NĂNG/.test(titleUpper)) return 'skills';
  if (/PROJECT|DỰ ÁN/.test(titleUpper)) return 'projects';
  if (/CERT|CHỨNG CHỈ/.test(titleUpper)) return 'certifications';
  if (/AWARD|GIẢI THƯỞNG/.test(titleUpper)) return 'awards';
  if (/SUMMARY|TÓM TẮT|MỤC TIÊU/.test(titleUpper)) return 'summary';
  if (/LANGUAGE|NGOẠI NGỮ/.test(titleUpper)) return 'languages';

  return 'other';
}


/**
 * Trích xuất bullet points
 */
export function extractBullets(lines) {
  const bullets = [];
  const bulletRegex = /^[•●○■□▪▫\-–—]\s+(.+)/;

  lines.forEach((line, index) => {
    const match = line.match(bulletRegex);
    if (match) {
      bullets.push({
        text: match[1].trim(),
        lineNumber: index,
        symbol: match[0][0],
      });
    }
  });

  return bullets;
}


/**
 * Trích xuất dates (2020-2024, Jan 2020 - Present, etc.)
 */
export function extractDates(lines) {
  const dates = [];

  const datePatterns = [
    // English formats
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]\s*(\d{4}|Present|Current|Now)\b/gi,
    /\b\d{4}\s*[-–—]\s*(\d{4}|Present|Current|Now)\b/gi,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/gi,
    // Vietnamese formats
    /\b(tháng\s+)?\d{1,2}\/\d{4}\s*[-–—]\s*(\d{1,2}\/\d{4}|Hiện tại|Nay)\b/gi,
    /\b\d{4}\s*[-–—]\s*(Hiện tại|Nay)\b/gi,
  ];

  lines.forEach((line, index) => {
    datePatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          dates.push({
            text: match,
            lineNumber: index,
            context: line.trim(),
          });
        });
      }
    });
  });

  return dates;
}


/**
 * Phiên bản nâng cao: Parse từng section chi tiết
 * (Dùng khi cần parse experience entries, education entries riêng biệt)
 */
export const parseSectionDetails = (sectionContent, sectionType) => {
  switch (sectionType) {
    case 'experience':
      return parseExperienceSection(sectionContent);
    case 'education':
      return parseEducationSection(sectionContent);
    case 'skills':
      return parseSkillsSection(sectionContent);
    default:
      return { rawContent: sectionContent };
  }
};

export function parseExperienceSection(content) {
  // Parse job entries: Job Title | Company | Date | Bullets
  const entries = [];
  const lines = content.split("\n").filter(l => l.trim());

  let currentEntry = null;

  lines.forEach(line => {
    // Detect job title line (usually has company name and date)
    if (line.includes('|') || /\d{4}\s*[-–—]/.test(line)) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        title: line,
        bullets: [],
      };
    } else if (line.match(/^[•●○■□▪▫\-–—]\s+/)) {
      // Bullet point
      if (currentEntry) {
        currentEntry.bullets.push(line.replace(/^[•●○■□▪▫\-–—]\s+/, '').trim());
      }
    }
  });

  if (currentEntry) entries.push(currentEntry);

  return { entries };
}

export function parseEducationSection(content) {
  // Parse degree, university, date, GPA
  return { rawContent: content };
}

export function parseSkillsSection(content) {
  // Parse skills list (categories: Languages, Frameworks, Tools)
  const skills = content.split(/[,;•\n]/).map(s => s.trim()).filter(s => s.length > 0);
  return { skills };
}

/**
 * ============================================
 * HR-SPECIFIC UTILITY FUNCTIONS
 * ============================================
 */

/**
 * Extract skills from Job Description
 * @param {string} jdText - JD content
 * @returns {Array} - List of extracted skills
 */
export function extractSkillsFromJD(jdText) {
  const skills = [];

  // Common tech skills patterns
  const techSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Ruby', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
    // Frontend
    'React', 'Vue', 'Angular', 'Next\\.js', 'Nuxt', 'Svelte', 'HTML', 'CSS', 'SASS', 'Tailwind',
    // Backend
    'Node\\.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails', 'ASP\\.NET',
    // Database
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions', 'Terraform',
    // Tools
    'Git', 'Jira', 'Confluence', 'Figma', 'Postman',
    // Methodologies
    'Agile', 'Scrum', 'Kanban', 'CI/CD', 'TDD', 'Microservices', 'REST API', 'GraphQL',
  ];

  // Search for skills in text (case-insensitive)
  techSkills.forEach(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    if (regex.test(jdText)) {
      // Add only unique skills
      const normalizedSkill = skill.replace(/\\\\/g, '');
      if (!skills.includes(normalizedSkill)) {
        skills.push(normalizedSkill);
      }
    }
  });

  return skills;
}

/**
 * Detect seniority level from JD
 * @param {string} jdText - JD content
 * @returns {object} - Seniority level and confidence
 */
export function detectSeniorityLevel(jdText) {
  const textLower = jdText.toLowerCase();

  const seniorityIndicators = {
    junior: {
      keywords: ['junior', 'entry level', 'graduate', '0-2 years', 'fresher', 'beginner'],
      score: 0,
    },
    mid: {
      keywords: ['mid level', 'intermediate', '2-5 years', '3-5 years', 'experienced'],
      score: 0,
    },
    senior: {
      keywords: ['senior', '5+ years', '5-8 years', 'expert', 'advanced'],
      score: 0,
    },
    lead: {
      keywords: ['lead', 'principal', 'staff', 'architect', '8+ years', 'team lead', 'tech lead'],
      score: 0,
    },
  };

  // Count keyword occurrences
  for (const [level, data] of Object.entries(seniorityIndicators)) {
    data.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        data.score += matches.length;
      }
    });
  }

  // Find highest score
  let detectedLevel = 'unclear';
  let maxScore = 0;

  for (const [level, data] of Object.entries(seniorityIndicators)) {
    if (data.score > maxScore) {
      maxScore = data.score;
      detectedLevel = level;
    }
  }

  // Calculate confidence (0-100)
  const totalScore = Object.values(seniorityIndicators).reduce((sum, data) => sum + data.score, 0);
  const confidence = totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 0;

  return {
    level: detectedLevel,
    confidence: confidence,
    scores: seniorityIndicators,
  };
}

/**
 * Calculate readability score (simplified Flesch-Kincaid)
 * @param {string} text - Text to analyze
 * @returns {object} - Readability metrics
 */
export function calculateReadabilityScore(text) {
  // Count sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;

  // Count words
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Count syllables (simplified: count vowel groups)
  let syllableCount = 0;
  words.forEach(word => {
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
    syllableCount += vowelGroups ? vowelGroups.length : 1;
  });

  // Avoid division by zero
  if (sentenceCount === 0 || wordCount === 0) {
    return {
      score: 0,
      grade: 'N/A',
      assessment: 'insufficient_text',
    };
  }

  // Flesch Reading Ease formula
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Grade level
  let grade = '';
  let assessment = '';

  if (fleschScore >= 90) {
    grade = 'Very Easy';
    assessment = 'excellent';
  } else if (fleschScore >= 80) {
    grade = 'Easy';
    assessment = 'good';
  } else if (fleschScore >= 70) {
    grade = 'Fairly Easy';
    assessment = 'good';
  } else if (fleschScore >= 60) {
    grade = 'Standard';
    assessment = 'acceptable';
  } else if (fleschScore >= 50) {
    grade = 'Fairly Difficult';
    assessment = 'needs_improvement';
  } else if (fleschScore >= 30) {
    grade = 'Difficult';
    assessment = 'needs_improvement';
  } else {
    grade = 'Very Difficult';
    assessment = 'poor';
  }

  return {
    score: Math.round(fleschScore * 10) / 10,
    grade: grade,
    assessment: assessment,
    metrics: {
      sentences: sentenceCount,
      words: wordCount,
      syllables: syllableCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
    },
  };
}