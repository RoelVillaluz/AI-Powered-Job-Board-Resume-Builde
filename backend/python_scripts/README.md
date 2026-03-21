# Python AI Services

AI-powered resume scoring, job matching, and recommendations using semantic embeddings.

## Quick Start

```bash
# Install dependencies
cd backend/python_scripts
pip freeze > requirements.txt
pip install -r requirements.txt

# Test manually
python main.py score_resume <resume_id>
python main.py generate_resume_embeddings <resume_id>
python main.py compare_resume_job <resume_id> <job_id>
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Node.js (Express/BullMQ)               │
│  - API endpoints                        │
│  - Queue management                     │
│  - Cache checking                       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Python Scripts (AI/ML Layer)           │
│  - Embedding generation                 │
│  - Similarity calculations              │
│  - Resume scoring                       │
└─────────────────────────────────────────┘
```

## Available Commands

### 1. Resume Scoring
Calculate comprehensive resume quality score (0-100) with letter grade.

```bash
python main.py score_resume <resume_id>
```

**Response:**
```json
{
  "resume_id": "...",
  "overall_score": 85.5,
  "grade": "B+",
  "breakdown": {
    "completeness": 90,
    "experience": 80,
    "skills": 85,
    "certifications": 75
  },
  "total_experience_years": 5.2,
  "strengths": ["Strong backend skills"],
  "improvements": ["Add more certifications"],
  "recommendations": ["Learn AWS"]
}
```

**Grading Scale:**
- A+ (95-100): Exceptional
- A (90-94): Excellent
- B+ (85-89): Very Good
- B (80-84): Good
- C+ (75-79): Above Average
- C (70-74): Average
- D (60-69): Below Average
- F (0-59): Needs Improvement

### 2. Resume Embeddings
Generate semantic embeddings for resume content.

```bash
python main.py generate_resume_embeddings <resume_id>
```

**Response:**
```json
{
  "resume_id": "...",
  "meanEmbeddings": {
    "skills": [0.23, 0.45, ...],           // 768-dim vector
    "workExperience": [0.12, 0.88, ...],   // 768-dim vector
    "certifications": [0.34, 0.56, ...]    // 768-dim vector
  },
  "metrics": {
    "totalExperienceYears": 5.2
  }
}
```

### 3. Job Embeddings
Generate semantic embeddings for job postings.

```bash
python main.py generate_job_embeddings <job_id>
```

**Response:**
```json
{
  "job_id": "...",
  "meanEmbeddings": {
    "jobTitle": [0.44, 0.22, ...],
    "skills": [0.33, 0.11, ...],
    "requirements": [0.55, 0.77, ...],
    "experienceLevel": [0.66, 0.88, ...],
    "location": [0.77, 0.99, ...]
  }
}
```

### 4. Resume-Job Comparison
Calculate match percentage between resume and job.

```bash
python main.py compare_resume_job <resume_id> <job_id>
```

**Response:**
```json
{
  "resume_id": "...",
  "job_id": "...",
  "job_title": "Senior Developer",
  "company": "Tech Corp",
  "match_percentage": 72.1,
  "recommendation_level": "Good Match",
  "breakdown": {
    "skills_match": 75.0,
    "experience_match": 68.0,
    "requirements_match": 55.0
  },
  "matched_skills": ["Python", "React"],
  "missing_skills": ["AWS", "Docker"],
  "strengths": ["Strong technical skills"],
  "improvements": ["Gain cloud experience"]
}
```

**Matching Algorithm:**
```
Total Score = (skills_match × 0.65) + (experience_match × 0.35)

Comparisons:
- Skills: resume.skills ↔ job.skills
- Experience: resume.workExperience ↔ job.title
- Requirements: resume.certifications ↔ job.requirements (informational only)
```

### 5. Batch Operations
Compare resume to multiple jobs at once.

```bash
python main.py batch_compare <resume_id> '["job1","job2"]' 20
```

### 6. Job Recommendations
Get personalized job recommendations for a user.

```bash
python main.py get_recommendations <user_id> <resume_id> 20
```

## Project Structure

```
backend/python_scripts/
├── main.py                    # CLI entry point (Node.js calls this)
├── requirements.txt           # Python dependencies
│
├── config/
│   └── database.py           # MongoDB connection
│
├── models/
│   └── embeddings.py         # Sentence transformer model (all-mpnet-base-v2)
│
├── services/
│   ├── resume_service.py     # Resume data & embeddings
│   ├── job_service.py        # Job data & embeddings
│   ├── scoring_service.py    # Resume scoring logic
│   ├── similarity_service.py # Cosine similarity calculations
│   ├── comparison_service.py # Resume-job matching
│   └── analytics_service.py  # Insights & recommendations
│
├── utils/
│   ├── embedding_utils.py    # Extract embeddings from documents
│   ├── date_utils.py         # Calculate experience years
│   └── tensor_utils.py       # PyTorch tensor helpers
│
└── clustering/
    └── job_clustering.py     # K-Means clustering for jobs
```

## Integration with Node.js

### From Controller (Direct Call)
```javascript
import { runPython } from '../utils/pythonRunner.js';

const result = await runPython('score_resume', [resumeId]);
```

### From Queue Processor (Async Job)
```javascript
export const resumeScoreProcessor = async (job) => {
    const { resumeId } = job.data;
    
    // Call service which internally uses runPython
    const result = await calculateResumeScoreService(resumeId, job);
    
    return result;
};
```

### From Webhook (Direct Call)
```javascript
export const onResumeUpdate = async (resumeId) => {
    // Invalidate cache and regenerate
    await createResumeEmbeddingService(resumeId, true);
};
```

## Caching Strategy

All operations check cache first to avoid redundant calculations:

| Operation | Cache Collection | TTL | Cache Key |
|-----------|-----------------|-----|-----------|
| Resume Embeddings | `resumeembeddings` | 90 days | `resume: ObjectId` |
| Resume Score | `resumescores` | 7 days | `resume: ObjectId` |
| Job Embeddings | `jobpostingembeddings` | 90 days | `jobPosting: ObjectId` |
| Resume-Job Comparison | `resumejobcomparisons` | 30 days | `resume + jobPosting` |

**Performance Impact:**
- Cache Hit: ~20ms (database lookup only)
- Cache Miss: ~500ms (Python execution + embedding generation)
- **Speedup: 25x faster with caching!**

## ML Model

**Model:** `all-mpnet-base-v2` (Sentence Transformers)
- **Embedding Size:** 768 dimensions
- **Max Sequence Length:** 384 tokens
- **Use Case:** Semantic similarity between text
- **Performance:** ~50-100ms per encoding

**Why this model?**
- State-of-the-art semantic understanding
- Balanced speed vs accuracy
- Pre-trained on diverse text corpus
- Works well for resume/job matching

## Database Schema Requirements

### Resumes Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  summary: String,
  skills: [{ name: String, proficiency: String }],
  workExperience: [{
    jobTitle: String,
    company: String,
    startDate: Date,  // ISO format: "2020-01-15T00:00:00.000Z"
    endDate: Date,    // or "present"
    responsibilities: [String]
  }],
  education: [{
    degree: String,
    institution: String,
    graduationDate: Date
  }],
  certifications: [{ name: String, issuer: String }]
}
```

### Job Postings Collection
```javascript
{
  _id: ObjectId,
  title: String,
  company: String,
  location: String,
  experienceLevel: String,  // "Entry", "Mid", "Senior"
  status: String,           // "active", "closed"
  skills: [{ name: String }],
  requirements: [String],
  description: String
}
```

## Error Handling

All functions return JSON with error field on failure:

```json
{
  "error": "Resume not found: invalid_id",
  "traceback": "..." // Only in development
}
```

**Common Errors:**
- `Resume not found` - Invalid resume_id or resume doesn't exist
- `Job not found` - Invalid job_id or job doesn't exist
- `Failed to generate embedding` - Model loading failed or input too long
- `MongoDB connection error` - Database unreachable

## Performance Optimization

### 1. Use Field Projections
```python
# Good - Only fetch needed fields (3-8 KB)
resume = ResumeService.get_job_relevant_resume(resume_id)

# Bad - Fetch entire document (15-25 KB)
resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
```

### 2. Leverage Caching
```javascript
// Always check cache first
const cached = await getResumeEmbeddingsRepo(resumeId);
if (cached && isFresh(cached)) {
    return cached; // 95% faster!
}
```

### 3. Batch Operations
```python
# Process multiple jobs in one call
batch_compare(resume_id, job_ids, limit=50)
```

## Testing

```bash
# Run all tests
pytest tests/

# Test specific service
pytest tests/test_scoring_service.py

# Test with coverage
pytest --cov=services tests/
```

## Troubleshooting

### Python Script Not Found
```bash
# Make sure you're running from project root
node backend/server.js

# Not from:
cd backend/python_scripts && node ../server.js  # Wrong!
```

### Module Import Errors
```bash
# Ensure Python can find modules
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend/python_scripts"
```

### Embedding Model Download
```bash
# First run downloads ~400MB model
# Takes ~1-2 minutes
# Cached in: ~/.cache/torch/sentence_transformers/
```

### Memory Issues
```bash
# Reduce batch size if running out of memory
BATCH_SIZE=16 python main.py batch_compare ...
```

## Future Enhancements

- [ ] Add education level matching
- [ ] Implement experience level validation
- [ ] Add location-based scoring
- [ ] Extract soft skills from descriptions
- [ ] Add role type detection (Frontend/Backend/Full Stack)
- [ ] Implement weighted skill importance
- [ ] Add collaborative filtering
- [ ] Support for multiple languages

## Contributing

When adding new commands:

1. Add function to `main.py`
2. Add corresponding service in `services/`
3. Update this README with examples
4. Add tests in `tests/`
