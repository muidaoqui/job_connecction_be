const http = require("http");

const url = 'http://localhost:8080/api/jobs/675d8a1234567890abcdef12';

const options = {
    method: 'PUT',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
};

const data = '{"title":"Updated Job Title","description":"New description"}';

let result = '';
const req = http.request(url, options, (res) => {
    console.log(res.statusCode);

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        result += chunk;
    });

    res.on('end', () => {
        console.log(result);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(data);
req.end();

// # Force update job embedding
// curl -X PUT "http://localhost:8080/api/embeddings/job/update/675d8a1234567890abcdef12"

// # Force update candidate embedding
// curl -X PUT "http://localhost:8080/api/embeddings/candidate/update/675d8a1234567890abcdef12"

// # Batch update all jobs without embeddings
// curl -X POST "http://localhost:8080/api/embeddings/job/batch-update"

// # Batch update all candidates without embeddings
// curl -X POST "http://localhost:8080/api/embeddings/candidate/batch-update"
