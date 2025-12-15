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
  const phoneRegex =/\b(\+84|0)[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3,4}\b/g;
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