# Test Script for HR Agent

## Prerequisites
- Server running on http://localhost:8080
- MongoDB connected
- OpenAI API key configured in .env

## Test 1: Vector Store Stats
echo "=== Test 1: Vector Store Stats ==="
curl -X GET http://localhost:8080/api/rags/vector-store/stats

## Test 2: Analyze Job Description
echo "\n\n=== Test 2: Analyze JD ==="
curl -X POST http://localhost:8080/api/rags/hr-agent/analyze-jd \
  -H "Content-Type: application/json" \
  -d '{
    "jdText": "We are looking for a Senior Software Engineer with 5+ years of experience in React and Node.js. Must have strong problem-solving skills and experience with AWS. Salary: 40-60M VND.",
    "metadata": {
      "position": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "Ho Chi Minh City"
    }
  }'

## Test 3: Optimize JD
echo "\n\n=== Test 3: Optimize JD ==="
curl -X POST http://localhost:8080/api/rags/hr-agent/optimize-jd \
  -H "Content-Type: application/json" \
  -d '{
    "jdText": "We need a rockstar developer who can code in React. Must be a ninja at problem solving.",
    "focusAreas": ["tone", "skills"]
  }'

## Test 4: Benchmark Salary
echo "\n\n=== Test 4: Benchmark Salary ==="
curl -X POST http://localhost:8080/api/rags/hr-agent/benchmark-salary \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Senior Software Engineer",
    "experience": 5,
    "location": "Ho Chi Minh City",
    "skills": ["React", "Node.js", "AWS"]
  }'

## Test 5: Chat with Agent
echo "\n\n=== Test 5: Chat with Agent ==="
curl -X POST http://localhost:8080/api/rags/hr-agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Xin chào! Tôi cần giúp đỡ về cách viết JD cho Senior Engineer"
  }'

echo "\n\n=== All Tests Completed ==="
