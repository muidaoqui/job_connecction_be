# HỆ THỐNG TÌM KIẾM NGỮ NGHĨA & GỢI Ý (SEMANTIC SEARCH FLOW)
<img width="2816" height="1536" alt="image" src="https://github.com/user-attachments/assets/515d6bc7-38c1-42cf-a974-292ce71ac06f" />
## Tổng Quan

Hệ thống sử dụng **Vector Embeddings** và **Semantic Search** để:
- Tìm kiếm ứng viên/công việc theo ngữ nghĩa (không chỉ keyword)
- Gợi ý công việc phù hợp cho ứng viên
- Gợi ý ứng viên phù hợp cho công việc

---

## 1️⃣ QUY TRÌNH TẠO EMBEDDING (Data Indexing)

### 1.1. Luồng Xử Lý

```
┌─────────────────────────────────────────────────────────────────────┐
│  BƯỚC 1: CHUẨN BỊ DỮ LIỆU                                           │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐
    │   MongoDB    │         │   MongoDB    │
    │              │         │              │
    │    Jobs      │         │  Candidates  │
    │  (Raw Data)  │         │  (Raw Data)  │
    └──────┬───────┘         └──────┬───────┘
           │                        │
           │        Jobs            │
           └────────────┬───────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BƯỚC 2: XỬ LÝ & KẾT HỢP DỮ LIỆU                                   │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Data Preparation & Combined Text Summary                     │ │
│  │                                                                │ │
│  │  Jobs Example:                                                │ │
│  │  "Backend Developer - Python, Django, PostgreSQL              │ │
│  │   3+ years experience. Remote work. Salary: $3000-5000"       │ │
│  │                                                                │ │
│  │  Candidates Example:                                          │ │
│  │  "Frontend Developer - React, TypeScript, 2 years             │ │
│  │   experience. Ho Chi Minh City. Looking for remote work"      │ │
│  └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BƯỚC 3: TẠO VECTOR EMBEDDING                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │         🧠 AI Embedding Model                                 │ │
│  │      (Xenova/nomic-embed-text)                                │ │
│  │                                                                │ │
│  │  Input: Text Summary                                          │ │
│  │  Output: Vector [0.12, -0.45, 0.88, ...]                     │ │
│  │                                                                │ │
│  │  Dimension: 768 dimensions                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Vector Embedding    │
                    │                       │
                    │  [0.12, -0.45, 0.88,  │
                    │   0.23, 0.67, -0.11,  │
                    │   ... 768 values]     │
                    └───────────┬───────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BƯỚC 4: LƯU TRỮ VECTOR VÀO DATABASE                               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │        MongoDB (Stored Vectors)                               │ │
│  │                                                                │ │
│  │  Jobs Collection:                                             │ │
│  │  {                                                             │ │
│  │    _id: "job123",                                             │ │
│  │    title: "Backend Developer",                                │ │
│  │    embedding: [0.12, -0.45, 0.88, ...]                       │ │
│  │  }                                                             │ │
│  │                                                                │ │
│  │  Candidates Collection:                                       │ │
│  │  {                                                             │ │
│  │    _id: "candidate456",                                       │ │
│  │    name: "Nguyen Van A",                                      │ │
│  │    embedding: [0.15, -0.40, 0.82, ...]                       │ │
│  │  }                                                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2. Code Implementation

```javascript
// service/embedding.service.js
import { pipeline } from '@xenova/transformers';

let embedder;

async function initEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/nomic-embed-text'
    );
  }
  return embedder;
}

async function generateEmbedding(text) {
  const model = await initEmbedder();
  const output = await model(text, { 
    pooling: 'mean', 
    normalize: true 
  });
  return Array.from(output.data);
}

// Tạo embedding cho Job
export async function createJobEmbedding(jobId) {
  const job = await Job.findById(jobId);
  
  // Kết hợp thông tin thành text
  const text = `
    ${job.title}
    ${job.description}
    Skills: ${job.requiredSkills.join(', ')}
    Location: ${job.location}
    Salary: ${job.salaryRange}
  `.trim();
  
  const embedding = await generateEmbedding(text);
  
  await Job.updateOne(
    { _id: jobId },
    { $set: { embedding } }
  );
}

// Tạo embedding cho Candidate
export async function createCandidateEmbedding(candidateId) {
  const candidate = await Candidate.findById(candidateId);
  
  const text = `
    ${candidate.profileSummary}
    Skills: ${candidate.skills.join(', ')}
    Experience: ${candidate.experience}
    Location: ${candidate.address}
  `.trim();
  
  const embedding = await generateEmbedding(text);
  
  await Candidate.updateOne(
    { _id: candidateId },
    { $set: { embedding } }
  );
}
```

---

## 2️⃣ QUY TRÌNH TÌM KIẾM NGỮ NGHĨA (Semantic Search)

### 2.1. Luồng Xử Lý

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER INPUT                                                         │
└─────────────────────────────────────────────────────────────────────┘

         👤 User
         │
         │ Query: "tìm việc làm react lương cao"
         │
         ▼
    ┌─────────────┐
    │   Search    │
    │   Input     │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BƯỚC 1: CHUYỂN QUERY THÀNH VECTOR                                  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │         🧠 AI Embedding Model                                 │ │
│  │      (Xenova/nomic-embed-text)                                │ │
│  │                                                                │ │
│  │  Input: "tìm việc làm react lương cao"                       │ │
│  │  Output: Query Vector [0.15, -0.40, 0.82, ...]               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    Query Vector       │
                    │  [0.15, -0.40, 0.82,  │
                    │   0.22, 0.55, ...]    │
                    └───────────┬───────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BƯỚC 2: TÌM KIẾM VECTOR TƯƠNG TỰ                                  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │      MongoDB $vectorSearch                                    │ │
│  │                                                                │ │
│  │  So sánh Query Vector với tất cả Stored Vectors               │ │
│  │  Sử dụng: Cosine Similarity                                   │ │
│  │                                                                │ │
│  │  Score = cos(θ) = (A · B) / (||A|| × ||B||)                  │ │
│  │                                                                │ │
│  │  Query Vector: [0.15, -0.40, 0.82, ...]                      │ │
│  │     vs                                                         │ │
│  │  Job1 Vector:  [0.18, -0.38, 0.85, ...] → Score: 0.95        │ │
│  │  Job2 Vector:  [0.12, -0.42, 0.80, ...] → Score: 0.92        │ │
│  │  Job3 Vector:  [0.20, -0.35, 0.88, ...] → Score: 0.89        │ │
│  └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Ranked Results      │
                    │                       │
                    │  📄 Job1 (Score: 0.95)│
                    │  📄 Job2 (Score: 0.92)│
                    │  📄 Job3 (Score: 0.89)│
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Return to User      │
                    │   👤                  │
                    │   Display Results     │
                    └───────────────────────┘
```

### 2.2. Code Implementation

```javascript
// service/search.service.js
export async function semanticSearchJobs(query, limit = 10) {
  // 1. Tạo embedding cho query
  const queryVector = await generateEmbedding(query);
  
  // 2. Tìm kiếm vector trong MongoDB
  const results = await Job.aggregate([
    {
      $vectorSearch: {
        index: "job_vector_index",
        path: "embedding",
        queryVector: queryVector,
        numCandidates: 100,
        limit: limit
      }
    },
    {
      $project: {
        title: 1,
        description: 1,
        company: 1,
        salaryRange: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ]);
  
  return results;
}

// Controller
export const searchJobsController = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required"
      });
    }
    
    const results = await semanticSearchJobs(query);
    
    res.json({
      success: true,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

## 3️⃣ GỢI Ý & TÌM TƯƠNG TỰ (Matching & Recommendation)

### 3.1. Luồng Xử Lý

```
┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 1: TÌM JOBS PHÙ HỢP CHO CANDIDATE                         │
└─────────────────────────────────────────────────────────────────────┘

    Input: Candidate ID "Y"
         │
         ▼
    ┌─────────────────────┐
    │  Retrieve Stored    │
    │  Candidate Vector   │
    └──────────┬──────────┘
               │
               │ Source Vector: [0.15, -0.40, 0.82, ...]
               │
               ▼
    ┌─────────────────────────────────────────┐
    │    MongoDB $vectorSearch                │
    │                                          │
    │  Tìm Jobs có vector gần với             │
    │  Candidate vector                       │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │   Similar Jobs Recommendations          │
    │                                          │
    │  👔 Senior React Developer (95%)        │
    │  👔 Frontend Lead (92%)                 │
    │  👔 Full-stack Engineer (88%)           │
    └─────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 2: TÌM CANDIDATES PHÙ HỢP CHO JOB                         │
└─────────────────────────────────────────────────────────────────────┘

    Input: Job ID "X"
         │
         ▼
    ┌─────────────────────┐
    │  Retrieve Stored    │
    │  Job Vector         │
    └──────────┬──────────┘
               │
               │ Source Vector: [0.18, -0.38, 0.85, ...]
               │
               ▼
    ┌─────────────────────────────────────────┐
    │    MongoDB $vectorSearch                │
    │                                          │
    │  Tìm Candidates có vector gần với       │
    │  Job vector                             │
    └──────────┬──────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────┐
    │   Similar Candidates Recommendations    │
    │                                          │
    │  👤 Nguyen Van A (94%)                  │
    │  👤 Tran Thi B (91%)                    │
    │  👤 Le Van C (87%)                      │
    └─────────────────────────────────────────┘
```

### 3.2. Code Implementation

```javascript
// service/recommendation.service.js

// Gợi ý Jobs cho Candidate
export async function recommendJobsForCandidate(candidateId, limit = 10) {
  // 1. Lấy embedding của candidate
  const candidate = await Candidate.findById(candidateId);
  
  if (!candidate.embedding) {
    throw new Error("Candidate embedding not found. Please create embedding first.");
  }
  
  // 2. Tìm jobs tương tự
  const results = await Job.aggregate([
    {
      $vectorSearch: {
        index: "job_vector_index",
        path: "embedding",
        queryVector: candidate.embedding,
        numCandidates: 100,
        limit: limit
      }
    },
    {
      $project: {
        title: 1,
        company: 1,
        location: 1,
        salaryRange: 1,
        matchScore: { $meta: "vectorSearchScore" }
      }
    }
  ]);
  
  return results;
}

// Gợi ý Candidates cho Job
export async function recommendCandidatesForJob(jobId, limit = 10) {
  // 1. Lấy embedding của job
  const job = await Job.findById(jobId);
  
  if (!job.embedding) {
    throw new Error("Job embedding not found. Please create embedding first.");
  }
  
  // 2. Tìm candidates tương tự
  const results = await Candidate.aggregate([
    {
      $vectorSearch: {
        index: "candidate_vector_index",
        path: "embedding",
        queryVector: job.embedding,
        numCandidates: 100,
        limit: limit
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        skills: 1,
        experience: 1,
        matchScore: { $meta: "vectorSearchScore" }
      }
    }
  ]);
  
  return results;
}

// Controllers
export const getJobRecommendationsController = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { limit = 10 } = req.query;
    
    const recommendations = await recommendJobsForCandidate(
      candidateId, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
    
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCandidateRecommendationsController = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit = 10 } = req.query;
    
    const recommendations = await recommendCandidatesForJob(
      jobId, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
    
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

## 4️⃣ CẤU HÌNH MONGODB ATLAS VECTOR SEARCH

### 4.1. Tạo Vector Search Index cho Jobs

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

### 4.2. Tạo Vector Search Index cho Candidates

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

### 4.3. Database Schema

```javascript
// models/job.model.js
const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  company: String,
  location: String,
  salaryRange: {
    min: Number,
    max: Number
  },
  requiredSkills: [String],
  embedding: {
    type: [Number],
    required: false
  }
}, { timestamps: true });

// models/candidate.model.js
const candidateSchema = new mongoose.Schema({
  name: String,
  email: String,
  profileSummary: String,
  skills: [String],
  experience: String,
  address: String,
  embedding: {
    type: [Number],
    required: false
  }
}, { timestamps: true });
```

---

## 5️⃣ API ENDPOINTS

### 5.1. Embedding Management

```
POST /api/jobs/:jobId/create-embedding
- Tạo embedding cho 1 job cụ thể

POST /api/candidates/:candidateId/create-embedding
- Tạo embedding cho 1 candidate cụ thể

POST /api/jobs/batch-create-embeddings
- Tạo embedding cho tất cả jobs chưa có embedding

POST /api/candidates/batch-create-embeddings
- Tạo embedding cho tất cả candidates chưa có embedding
```

### 5.2. Search & Recommendations

```
POST /api/search/jobs
Body: { query: "react developer remote" }
- Tìm kiếm jobs theo ngữ nghĩa

POST /api/search/candidates
Body: { query: "senior python developer" }
- Tìm kiếm candidates theo ngữ nghĩa

GET /api/recommendations/jobs
- Gợi ý jobs phù hợp với candidate hiện tại

GET /api/recommendations/candidates/:jobId
- Gợi ý candidates phù hợp với job
```

---

## 6️⃣ COSINE SIMILARITY - CÔNG THỨC TÍNH

### 6.1. Giải Thích

**Cosine Similarity** đo độ tương đồng giữa 2 vectors bằng cách tính góc giữa chúng:

```
cos(θ) = (A · B) / (||A|| × ||B||)

Trong đó:
- A · B = tích vô hướng (dot product)
- ||A|| = độ dài vector A
- ||B|| = độ dài vector B
- θ = góc giữa 2 vectors

Kết quả:
- 1.0 = hoàn toàn giống nhau
- 0.0 = không liên quan
- -1.0 = hoàn toàn trái ngược
```

### 6.2. Ví Dụ Thực Tế

```javascript
// Vector A (Job): [0.5, 0.8, 0.3]
// Vector B (Candidate): [0.6, 0.7, 0.4]

// Bước 1: Tích vô hướng (A · B)
A · B = (0.5 × 0.6) + (0.8 × 0.7) + (0.3 × 0.4)
      = 0.3 + 0.56 + 0.12
      = 0.98

// Bước 2: Độ dài vectors
||A|| = √(0.5² + 0.8² + 0.3²) = √0.98 ≈ 0.99
||B|| = √(0.6² + 0.7² + 0.4²) = √1.01 ≈ 1.005

// Bước 3: Cosine Similarity
cos(θ) = 0.98 / (0.99 × 1.005) ≈ 0.985

// Kết quả: 98.5% tương đồng → Very Good Match!
```

---

## 7️⃣ BEST PRACTICES

### 7.1. Performance Optimization

```javascript
// ✅ Tạo embedding bất đồng bộ khi tạo/update record
jobSchema.post('save', async function() {
  // Chạy background job để tạo embedding
  queue.add('create-job-embedding', { jobId: this._id });
});

// ✅ Cache query embeddings
const queryCache = new Map();

async function getCachedQueryEmbedding(query) {
  if (!queryCache.has(query)) {
    const embedding = await generateEmbedding(query);
    queryCache.set(query, embedding);
  }
  return queryCache.get(query);
}

// ✅ Batch processing
async function batchCreateEmbeddings(ids, model) {
  const batchSize = 10;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(
      batch.map(id => createEmbedding(id, model))
    );
  }
}
```

### 7.2. Error Handling

```javascript
async function safeCreateEmbedding(id, model) {
  try {
    await createEmbedding(id, model);
  } catch (error) {
    console.error(`Failed to create embedding for ${id}:`, error);
    // Log to monitoring service
    // Retry with exponential backoff
  }
}
```

### 7.3. Data Quality

```javascript
// ✅ Chuẩn hóa text trước khi tạo embedding
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/gi, '');
}

// ✅ Kết hợp đủ thông tin quan trọng
function buildJobText(job) {
  return `
    Title: ${job.title}
    Description: ${job.description}
    Skills: ${job.requiredSkills.join(', ')}
    Experience: ${job.experienceLevel}
    Location: ${job.location}
    Salary: ${job.salaryRange.min}-${job.salaryRange.max}
  `.trim();
}
```

---

## 8️⃣ SO SÁNH: KEYWORD SEARCH vs SEMANTIC SEARCH

| Tiêu chí | Keyword Search | Semantic Search |
|----------|---------------|-----------------|
| **Phương pháp** | Tìm từ khóa chính xác | Hiểu nghĩa câu truy vấn |
| **Query**: "react developer" | Chỉ tìm "react" và "developer" | Tìm cả "frontend engineer", "javascript expert" |
| **Xử lý typo** | ❌ Không | ✅ Có (thông qua ngữ nghĩa) |
| **Hiểu ngữ cảnh** | ❌ Không | ✅ Có |
| **Performance** | ⚡ Rất nhanh | 🐢 Chậm hơn |
| **Độ chính xác** | 📊 Trung bình | 📊 Cao |
| **Use case** | Tìm kiếm đơn giản | Tìm kiếm phức tạp, gợi ý |

---

## 9️⃣ KẾT LUẬN

### ✅ Ưu Điểm
- **Hiểu ngữ nghĩa**: Không cần từ khóa chính xác
- **Gợi ý thông minh**: Tìm candidates/jobs phù hợp dựa trên similarity
- **Linh hoạt**: Hoạt động với nhiều ngôn ngữ
- **Scalable**: MongoDB Atlas hỗ trợ tốt vector search

### ⚠️ Hạn Chế
- **Latency**: Tạo embedding tốn thời gian
- **Cost**: Vector storage tốn không gian
- **Complexity**: Phức tạp hơn keyword search
- **Model dependency**: Phụ thuộc vào AI model

### 🎯 Khi Nào Nên Dùng
- ✅ Hệ thống gợi ý (recommendation)
- ✅ Tìm kiếm ngữ nghĩa phức tạp
- ✅ Matching jobs/candidates
- ❌ Tìm kiếm đơn giản, cần real-time
