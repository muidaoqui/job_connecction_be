# RAG + HR Agent - Hệ thống Tuyển dụng Thông Minh

Hệ thống AI Agent sử dụng RAG (Retrieval-Augmented Generation) để hỗ trợ HR phân tích, tối ưu Job Description và benchmark lương.
![alt text](image.png)
## 🌟 Tính năng

### 1. **Phân tích Job Description (JD Analysis)**
- Đánh giá độ dài và readability score
- Trích xuất skills và phát hiện skill gaps
- Phát hiện seniority level (Junior/Mid/Senior/Lead)
- Tính điểm competitiveness (0-100)
- So sánh với market trends và best practices

### 2. **Tối ưu Job Description (JD Optimization)**
- Gợi ý điều chỉnh seniority level
- Phân loại skills: Must-have vs Nice-to-have
- Phát hiện missing critical elements
- Cải thiện tone và language
- Recommendations về structure

### 3. **Benchmark Lương (Salary Benchmarking)**
- Market range (min-max-median)
- Competitor average
- Location-adjusted compensation
- Confidence level based on data availability
- Market insights và recommendations

### 4. **Chat với HR Agent**
- Multi-turn conversation
- Context-aware responses
- Tự động retrieve relevant knowledge
- Session management với conversation history

## 🎓 Candidate Agent (Hỗ trợ Ứng viên)

### 1. **Upload & Parse CV**
- Hỗ trợ PDF và DOCX format
- Tự động trích xuất thông tin:
  - Personal info (name, email, phone, LinkedIn, GitHub)
  - Skills (technical + soft skills)
  - Work experience (company, role, period, achievements)
  - Education (degree, institution, graduation year)
  - Projects và certifications
- Tính toán years of experience
- Phát hiện career level (Junior/Mid/Senior/Lead)

### 2. **CV Analysis (Phân tích CV)**
- **Strengths Assessment**: Top 3-5 competitive advantages
- **Gap Analysis**: So sánh skills với market requirements
- **Career Level Evaluation**: Đánh giá level hiện tại và readiness cho level tiếp theo
- **Skill Priority Matrix**: 
  - High priority (cần học ngay)
  - Medium priority (nên cải thiện)
  - Low priority (nice to have)
- **Red Flags Detection**: Employment gaps, job hopping, skill mismatches
- **Salary Range Estimation**: Dựa trên experience và skills

### 3. **Job Matching (Tìm việc phù hợp)**
- **Semantic Search**: Tìm jobs dựa trên CV embedding
- **Fit Score Calculation**: 
  - Skills match rate
  - Experience level match
  - Years of experience alignment
- **Ranked Recommendations**: Top 10-20 jobs phù hợp nhất
- **AI Explanations**: Giải thích tại sao job phù hợp với candidate

### 4. **CV Optimization (Tối ưu CV cho ATS)**
- **Keyword Extraction**: Trích xuất keywords từ target JD
- **ATS-Friendly Rewriting**: Viết lại CV theo chuẩn ATS
- **ATS Compatibility Check**:
  - Keyword match score (40%)
  - Format compliance (25%)
  - Readability score (15%)
  - Structure validation (20%)
- **Actionable Suggestions**: Cụ thể từng điểm cần sửa

## 🏗️ Kiến trúc

```
┌─────────────────┐
│   HR nhập JD    │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────┐
│      HR Agent Controller            │
│  (Task Classification & Routing)    │
└────────┬────────────────────────────┘
         │
         v
┌────────────────────────────────────────────┐
│           RAG Pipeline                      │
│  ┌──────────────────────────────────────┐  │
│  │  Vector Stores (ChromaDB)            │  │
│  │  • Market Trends                     │  │
│  │  • JD Templates & Best Practices     │  │
│  │  • Salary Database                   │  │
│  └──────────────────────────────────────┘  │
│                    │                        │
│                    v                        │
│  ┌──────────────────────────────────────┐  │
│  │  Semantic Search (Top-K Retrieval)   │  │
│  │  OpenAI Embeddings                   │  │
│  └──────────────────────────────────────┘  │
│                    │                        │
│                    v                        │
│  ┌──────────────────────────────────────┐  │
│  │  Context Assembly & Ranking          │  │
│  └──────────────────────────────────────┘  │
└────────┬───────────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│      LLM (GPT-4o-mini)              │
│  • JD Analysis Prompts              │
│  • Optimization Prompts             │
│  • Salary Benchmark Prompts         │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│      Agent Memory (MongoDB)         │
│  • Session Management               │
│  • Conversation History             │
│  • JD Versions Tracking             │
└─────────────────────────────────────┘
```

## 📦 Cài đặt

### 1. Prerequisites

- Node.js >= 18
- MongoDB
- ChromaDB server (optional, có thể chạy local)
- OpenAI API key

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cấu hình các biến môi trường:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/job_connection

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4o-mini

# ChromaDB (optional)
CHROMA_URL=http://localhost:8000

# Server
PORT=8080
NODE_ENV=development
```

### 4. Chạy ChromaDB (Optional)

Nếu muốn sử dụng ChromaDB local:

```bash
# Install ChromaDB
pip install chromadb

# Run ChromaDB server
chroma run --path ./chroma_data
```

Hoặc sử dụng Docker:

```bash
docker run -p 8000:8000 chromadb/chroma
```

### 5. Seed Vector Stores

Populate vector stores với sample data:

```bash
node scripts/seed-vector-stores.js
```

### 6. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## 🚀 API Endpoints

### HR Agent Endpoints
![alt text](image-1.png)
#### 1. Analyze Job Description

```bash
POST /api/rags/hr-agent/analyze-jd
```

**Request:**
```json
{
  "jdText": "We are looking for a Senior Software Engineer...",
  "metadata": {
    "position": "Senior Software Engineer",
    "company": "ABC Corp",
    "location": "Ho Chi Minh City"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "basic_stats": {
      "word_count": 450,
      "readability_score": 65.2
    },
    "extracted_features": {
      "skills": ["React", "Node.js", "AWS"],
      "seniority_level": { "level": "senior", "confidence": 85 }
    },
    "llm_analysis": {
      "length_analysis": { "assessment": "optimal" },
      "skill_gaps": [...],
      "competitiveness_score": { "score": 78 }
    }
  }
}
```

#### 2. Optimize Job Description

```bash
POST /api/rags/hr-agent/optimize-jd
```

**Request:**
```json
{
  "jdText": "...",
  "focusAreas": ["skills", "tone", "structure"]
}
```

#### 3. Benchmark Salary

```bash
POST /api/rags/hr-agent/benchmark-salary
```

**Request:**
```json
{
  "position": "Senior Software Engineer",
  "experience": 5,
  "location": "Ho Chi Minh City",
  "skills": ["React", "Node.js", "AWS"]
}
```

#### 4. Chat with Agent

```bash
POST /api/rags/hr-agent/chat
```

**Request:**
```json
{
  "message": "Phân tích JD này giúp tôi",
  "sessionId": "optional-session-id",
  "jdContext": "optional JD text"
}
```

#### 5. Get Conversation History

```bash
GET /api/rags/hr-agent/history/:sessionId
```

### Vector Store Endpoints

#### Add Documents

```bash
POST /api/rags/vector-store/add
```

**Request:**
```json
{
  "collectionName": "marketTrends",
  "documents": ["Market trend 1", "Market trend 2"],
  "metadatas": [
    { "source": "report1", "date": "2024-01" },
    { "source": "report2", "date": "2024-02" }
  ]
}
```

#### Get Statistics

```bash
GET /api/rags/vector-store/stats
```

### Candidate Agent Endpoints

#### 1. Upload CV

```bash
POST /api/rags/candidate-agent/upload-cv
```

**Request (multipart/form-data):**
```bash
curl -X POST http://localhost:8080/api/rags/candidate-agent/upload-cv \
  -F "cv=@/path/to/cv.pdf" \
  -F "userId=user123"
```

**Response:**
```json
{
  "success": true,
  "message": "CV uploaded and parsed successfully",
  "data": {
    "versionNumber": 1,
    "statistics": {
      "totalCharacters": 3542,
      "totalWords": 650,
      "yearsOfExperience": 5.2,
      "skillCount": 18
    },
    "parsedData": {
      "personalInfo": {
        "name": "Nguyen Van A",
        "email": "nguyenvana@example.com",
        "phone": "+84 123 456 789"
      },
      "skills": ["React", "Node.js", "MongoDB", "..."],
      "yearsOfExperience": 5.2,
      "careerLevel": {
        "level": "senior",
        "confidence": 80
      }
    }
  }
}
```

#### 2. Analyze CV

```bash
POST /api/rags/candidate-agent/analyze-cv
```

**Request:**
```json
{
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "overall_score": 78,
      "strengths": [
        "Strong full-stack development skills",
        "5+ years experience with modern tech stack",
        "Leadership experience in team projects"
      ],
      "critical_gaps": [
        "Missing cloud platform experience (AWS/Azure)",
        "No CI/CD pipeline knowledge",
        "Limited DevOps skills"
      ],
      "level_assessment": {
        "current": "senior",
        "ready_for_next": false,
        "timeline_to_next": "6-12 months with cloud and DevOps upskilling"
      },
      "skill_priority_matrix": {
        "high_priority": ["AWS", "Docker", "Kubernetes"],
        "medium_priority": ["System Design", "Microservices"],
        "low_priority": ["GraphQL", "TypeScript"]
      },
      "suitable_roles": [
        "Senior Full-stack Developer",
        "Backend Engineer",
        "Technical Lead"
      ],
      "salary_range_vnd": "35M - 50M",
      "recommendations": [
        "Complete AWS certification to boost cloud skills",
        "Build a microservices project to demonstrate architecture knowledge",
        "Contribute to open-source DevOps tools"
      ]
    }
  }
}
```

#### 3. Match Jobs

```bash
POST /api/rags/candidate-agent/match-jobs
```

**Request:**
```json
{
  "userId": "user123",
  "preferences": {
    "location": "Ho Chi Minh City",
    "topK": 10,
    "minSalary": 30000000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMatches": 45,
    "topMatches": [
      {
        "jobId": "job_001",
        "title": "Senior Full-stack Developer",
        "company": "Tech Startup XYZ",
        "location": "Ho Chi Minh City",
        "salary": "40M - 55M VND",
        "fitScore": 92,
        "skillMatchRate": 85,
        "matchedSkills": ["React", "Node.js", "MongoDB", "REST API"],
        "explanation": "Excellent match! Your 5 years of full-stack experience with React and Node.js aligns perfectly with their requirements. The role focuses on building scalable web applications, which matches your project history."
      },
      {
        "jobId": "job_002",
        "title": "Backend Engineer",
        "company": "Fintech Corp",
        "fitScore": 88,
        "explanation": "Strong fit based on your backend expertise. However, they prefer candidates with cloud experience (AWS), which you can develop."
      }
    ]
  }
}
```

#### 4. Optimize CV for Target JD

```bash
POST /api/rags/candidate-agent/optimize-cv
```

**Request:**
```json
{
  "userId": "user123",
  "targetJD": "We are looking for a Senior Full-stack Developer with React, Node.js, AWS experience..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimized_cv": "NGUYEN VAN A\nSenior Full-stack Developer\n...\n\nSKILLS\n• Frontend: React, Redux, JavaScript, HTML5, CSS3\n• Backend: Node.js, Express, RESTful APIs\n• Cloud: AWS (EC2, S3, Lambda) - Currently learning\n• Database: MongoDB, PostgreSQL\n...",
    "ats_score": {
      "overall_score": 85,
      "scores": {
        "keyword_match": 90,
        "format_score": 85,
        "readability_score": 80,
        "structure_score": 85
      },
      "ats_friendly": true,
      "issues": [
        {
          "type": "warning",
          "message": "Keyword 'AWS' appears only once - consider adding more context"
        }
      ],
      "suggestions": [
        "Add AWS projects or certifications to strengthen cloud experience",
        "Use more action verbs: 'Developed', 'Implemented', 'Optimized'",
        "Quantify achievements with metrics (e.g., 'Improved performance by 40%')"
      ]
    },
    "keywords_matched": 15
  }
}
```

#### 5. Get Candidate Profile

```bash
GET /api/rags/candidate-agent/profile/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "name": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "yearsOfExperience": 5.2,
      "careerLevel": {
        "level": "senior",
        "confidence": 80
      },
      "skillCount": 18,
      "topSkills": ["React", "Node.js", "MongoDB", "..."]
    },
    "totalVersions": 3,
    "currentVersion": 3,
    "jobMatches": 12
  }
}
```

## 📊 Testing

### Test với Sample JD

```bash
# Read sample JD
cat data/hr-knowledge-base/sample-jd-senior-engineer.md

# Analyze it
curl -X POST http://localhost:8080/api/rags/hr-agent/analyze-jd \
  -H "Content-Type: application/json" \
  -d "{\"jdText\": \"$(cat data/hr-knowledge-base/sample-jd-senior-engineer.md)\"}"
```

### Test Chat Flow

```bash
# Start conversation
curl -X POST http://localhost:8080/api/rags/hr-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào, tôi cần giúp đỡ về JD"}'

# Continue conversation (use sessionId from previous response)
curl -X POST http://localhost:8080/api/rags/hr-agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Làm sao để viết JD tốt cho Senior Engineer?", "sessionId": "your-session-id"}'
```

## 🔧 Configuration

### Vector Store Collections

- **marketTrends**: Job market trends, skill demands, industry insights
- **jdTemplates**: JD templates, best practices, writing guidelines
- **salaryData**: Salary benchmarks, compensation data, location adjustments

### LLM Models

Có thể thay đổi model trong `.env`:

```env
# OpenAI
LLM_MODEL=gpt-4o-mini  # hoặc gpt-4, gpt-3.5-turbo

# Hoặc sử dụng local model (cần cài Ollama)
# LLM_MODEL=qwen2.5:7b-instruct
```

## 📁 Project Structure

```
job_connecction_be/
├── src/modules/RAG/
│   # HR Agent Files
│   ├── rag.controller.js           # HR Agent API controllers
│   ├── rag.service.js              # HR Agent business logic & RAG pipeline
│   ├── rag.llm.js                  # LLM service (Qwen2.5 local model)
│   ├── rag.memory.js               # Agent memory manager
│   ├── agent-session.model.js      # MongoDB session model
│   │
│   # Candidate Agent Files
│   ├── candidate-agent.controller.js   # Candidate Agent API controllers
│   ├── candidate-agent.service.js      # Candidate Agent workflows
│   ├── candidate-agent.route.js        # Candidate Agent routes
│   ├── candidate-cv-parser.js          # CV parser (PDF/DOCX)
│   ├── candidate-cv.model.js           # Candidate CV database model
│   ├── candidate-ats-checker.js        # ATS compatibility checker
│   │
│   # Shared Infrastructure
│   ├── rag.route.js                # Main route definitions
│   ├── rag.vectorstore.js          # Vector store manager (ChromaDB)
│   ├── rag.embeddings.js           # Embeddings service (OpenAI)
│   └── rag.utils.js                # Utility functions
│
├── data/
│   ├── hr-knowledge-base/          # HR Agent data
│   │   ├── market-trends.json
│   │   ├── jd-templates.json
│   │   ├── salary-data.json
│   │   └── sample-jd-senior-engineer.md
│   │
│   └── candidate-knowledge-base/   # Candidate Agent data (to be created)
│       ├── skill-standards.json
│       ├── job-postings.json
│       └── cv-templates.json
│
├── scripts/
│   ├── seed-vector-stores.js       # Seed HR vector stores
│   └── seed-candidate-vectors.js   # Seed Candidate vector stores (to be created)
│
├── uploads/
│   ├── cvs/                        # Uploaded CV files
│   └── resumes/                    # Resume files
│
└── .env
```

## 🔄 System Workflow

### HR Agent Workflow
```
JD Input → Parse → RAG (Market/Templates/Salary) → LLM Analysis → Output
```

### Candidate Agent Workflow
```
CV Upload → Parse → Embedding → RAG (Skills/Jobs/Templates) → LLM Analysis → Output
```

## 📊 Vector Store Collections

### HR Agent Collections (3)
- `hr_market_trends` - Job market trends and skill demands
- `hr_jd_templates` - JD templates and best practices  
- `hr_salary_data` - Salary benchmarks and compensation data

### Candidate Agent Collections (3)
- `candidate_skill_standards` - Skill requirements by level
- `candidate_job_postings` - Available job postings
- `candidate_cv_templates` - ATS-friendly CV templates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT

## 🙋 Support

For issues and questions, please open an issue on GitHub.
