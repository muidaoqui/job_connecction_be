# API curl tests (replace TOKEN / IDs)

> Thay `YOUR_JWT_TOKEN`, `JOB_ID`, `CANDIDATE_ID`, `COMPANY_ID`, `APPLICATION_ID`, `SKILL_ID` theo dữ liệu thật.  
> Windows (cmd / PowerShell) và Bash snippets đều có sẵn.

---

## Set token (Bash)
```bash
export TOKEN="YOUR_JWT_TOKEN"
API="http://localhost:8080"
```

## Set token (PowerShell / Windows cmd)
```powershell
$env:TOKEN="YOUR_JWT_TOKEN"
$env:API="http://localhost:8080"
```

---

## Auth - get token
```bash
curl -X POST "http://localhost:8080/api/auth/login" -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"password"}'
```

---

## Candidate / Profile
Create profile:
```bash
curl -X POST "http://localhost:8080/api/candidate" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Nguyen Van A","dateOfBirth":"1995-01-01T00:00:00.000Z","gender":"male","address":"Hanoi","profileSummary":"Backend dev"}'
```

Get profile:
```bash
curl -X GET "http://localhost:8080/api/candidate" -H "Authorization: Bearer $TOKEN"
```

Update profile (PUT assumed):
```bash
curl -X PUT "http://localhost:8080/api/candidate" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Nguyen Van A","address":"Hanoi, VN","profileSummary":"Updated summary"}'
```

Upload resume (multipart):
```bash
curl -X POST "http://localhost:8080/api/candidate/resume" -H "Authorization: Bearer $TOKEN" -F "file=@C:\path\to\cv.pdf"
```

Create skill:
```bash
curl -X POST "http://localhost:8080/api/candidate/skill" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"skillName":"Node.js","proficiency":"advanced"}'
```

List skills:
```bash
curl -X GET "http://localhost:8080/api/candidate/skill" -H "Authorization: Bearer $TOKEN"
```

---

## Jobs CRUD & actions
Create job (recruiter):
```bash
curl -X POST "http://localhost:8080/api/jobs" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Senior Backend Developer","description":"Build APIs","requirements":"Node.js, MongoDB","location":"Hanoi","salary":"1500-2500 USD","jobType":"Full-time","companyId":"COMPANY_ID"}'
```

Get all jobs:
```bash
curl -X GET "http://localhost:8080/api/jobs"
```

Get job by id:
```bash
curl -X GET "http://localhost:8080/api/jobs/JOB_ID"
```

Update job:
```bash
curl -X PUT "http://localhost:8080/api/jobs/JOB_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","salary":"2000-3000 USD"}'
```

Delete job:
```bash
curl -X DELETE "http://localhost:8080/api/jobs/JOB_ID" -H "Authorization: Bearer $TOKEN"
```

Save / Unsave job:
```bash
curl -X POST "http://localhost:8080/api/jobs/JOB_ID/save" -H "Authorization: Bearer $TOKEN"
curl -X DELETE "http://localhost:8080/api/jobs/JOB_ID/save" -H "Authorization: Bearer $TOKEN"
```

Apply to job (multipart):
```bash
curl -X POST "http://localhost:8080/api/jobs/JOB_ID/apply" -H "Authorization: Bearer $TOKEN" \
  -F "name=John Doe" -F "email=john@example.com" -F "message=I apply" -F "cvFile=@C:\path\to\cv.pdf"
```

Get applicants (recruiter):
```bash
curl -X GET "http://localhost:8080/api/jobs/JOB_ID/applicants" -H "Authorization: Bearer $TOKEN"
```

Update application status:
```bash
curl -X PUT "http://localhost:8080/api/jobs/applications/APPLICATION_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
```

Recruiter stats:
```bash
curl -X GET "http://localhost:8080/api/jobs/recruiter/COMPANY_ID/stats" -H "Authorization: Bearer $TOKEN"
```

Search jobs (traditional):
```bash
curl -X GET "http://localhost:8080/api/jobs?search=backend"
```

---

## Embeddings APIs
Generate job embedding:
```bash
curl -X POST "http://localhost:8080/api/embeddings/job/generate/JOB_ID" -H "Authorization: Bearer $TOKEN"
```

Generate candidate embedding:
```bash
curl -X POST "http://localhost:8080/api/embeddings/candidate/generate/CANDIDATE_ID" -H "Authorization: Bearer $TOKEN"
```

Search jobs (semantic):
```bash
curl -X POST "http://localhost:8080/api/embeddings/job/search" -H "Content-Type: application/json" -d '{"query":"backend developer nodejs","limit":10,"numCandidates":100}'
```

Search candidates (semantic):
```bash
curl -X POST "http://localhost:8080/api/embeddings/candidate/search" -H "Content-Type: application/json" -d '{"query":"python data scientist","limit":10}'
```

Find similar jobs:
```bash
curl -X GET "http://localhost:8080/api/embeddings/job/similar/JOB_ID?limit=5" -H "Authorization: Bearer $TOKEN"
```

Find similar candidates:
```bash
curl -X GET "http://localhost:8080/api/embeddings/candidate/similar/CANDIDATE_ID?limit=5" -H "Authorization: Bearer $TOKEN"
```

Get recommendations for logged-in candidate:
```bash
curl -X GET "http://localhost:8080/api/embeddings/recommendations/jobs?limit=6" -H "Authorization: Bearer $TOKEN"
```

Batch generation / update:
```bash
curl -X POST "http://localhost:8080/api/embeddings/job/batch-generate-all" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:8080/api/embeddings/job/batch-generate-missing" -H "Authorization: Bearer $TOKEN"
curl -X GET  "http://localhost:8080/api/embeddings/stats" -H "Authorization: Bearer $TOKEN"
```

Fallback batch update endpoints (if present):
```bash
curl -X POST "http://localhost:8080/api/embeddings/job/batch-update" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:8080/api/embeddings/candidate/batch-update" -H "Authorization: Bearer $TOKEN"
```

---

## Notes
- Các endpoint có thể khác tên/HTTP method nếu backend thay đổi — check routes.  
- Nếu server chạy trên khác port, sửa biến `API`.  
- Nếu route yêu cầu `verifyToken`, phải gửi header Authorization: Bearer <token>.  
- Trên Windows cmd, dùng `^` để tách dòng khi cần.  
- Dùng `-v` hoặc `--trace-ascii` với curl để debug headers/response.
