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
python main.py generate_job_embeddings <job_id>
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
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  DB Embedding Cache (Skills/Titles/Locs)│
│  - Pre-computed embeddings              │
│  - Backfill tracking for null entries   │
│  - Falls back to live model if missing  │
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
  "recommendations": ["Learn AWS"],
  "overall_message": "Great resume! A few tweaks could make it stand out."
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
Generate semantic embeddings for resume content. Returns both direct embeddings (jobTitle, location) and mean embeddings (skills, workExperience, certifications), plus backfill IDs for any DB entries missing embeddings.

```bash
python main.py generate_resume_embeddings <resume_id>
```

**Response:**
```json
{
  "resume_id": "...",
  "embeddings": {
    "jobTitle": [0.44, 0.22, ...],    // 768-dim vector
    "location": [0.77, 0.99, ...]     // 768-dim vector
  },
  "meanEmbeddings": {
    "skills": [0.23, 0.45, ...],           // 768-dim vector
    "workExperience": [0.12, 0.88, ...],   // 768-dim vector
    "certifications": [0.34, 0.56, ...]    // 768-dim vector
  },
  "metrics": {
    "totalExperienceYears": 5.2
  },
  "backfill": {
    "skillIds": ["skill_id_1", "skill_id_2"],  // Skills in DB with null embedding
    "jobTitleId": "title_id_or_null",           // Job title in DB with null embedding
    "locationId": "location_id_or_null"         // Location in DB with null embedding
  }
}
```

### 3. Job Embeddings
Generate semantic embeddings for job postings. Direct embeddings (jobTitle, experienceLevel, location) are separated from mean embeddings (skills, requirements).

```bash
python main.py generate_job_embeddings <job_id>
```

**Response:**
```json
{
  "job_id": "...",
  "embeddings": {
    "jobTitle": [0.44, 0.22, ...],          // 768-dim vector
    "experienceLevel": [0.66, 0.88, ...],   // 768-dim vector
    "location": [0.77, 0.99, ...]           // 768-dim vector
  },
  "meanEmbeddings": {
    "skills": [0.33, 0.11, ...],            // 768-dim vector
    "requirements": [0.55, 0.77, ...]       // 768-dim vector
  }
}
```

### 4. Skill Embeddings
Generate embedding for a single skill by its DB ID.

```bash
python main.py generate_skill_embeddings <skill_id>
```

**Response:**
```json
{
  "skill_id": "...",
  "embedding": [0.12, 0.34, ...]   // Flat float array (768-dim)
}
```

### 5. Job Title Embeddings
Generate embedding for a job title using its `normalizedTitle` field. Aliases like "Sr. Engineer" and "Senior Engineer" map to the same normalized form, keeping embeddings semantically consistent.

```bash
python main.py generate_job_title_embeddings <title_id>
```

**Response:**
```json
{
  "title_id": "...",
  "embedding": [0.23, 0.56, ...]   // Flat float array (768-dim)
}
```

### 6. Location Embeddings
Generate embedding for a location by its DB ID. Geographic and cultural proximity is captured — e.g. "New York, NY" and "Manhattan, NY" produce close vectors.

```bash
python main.py generate_location_embeddings <location_id>
```

**Response:**
```json
{
  "location_id": "...",
  "embedding": [0.77, 0.99, ...]   // Flat float array (768-dim)
}
```

### 7. Industry Embeddings
Generate embedding for an industry by its DB ID.

```bash
python main.py generate_industry_embeddings <industry_id>
```

**Response:**
```json
{
  "industry_id": "...",
  "embedding": [0.45, 0.67, ...]   // Flat float array (768-dim)
}
```

## Embedding Cache & Backfill Strategy

Embedding generation now prioritizes **pre-computed DB embeddings** over live model inference. This dramatically reduces latency and model load.

### How it works

For skills, job titles, and locations, the system:

1. Looks up the entity in the DB (`skills`, `jobtitles`, `locations` collections)
2. Uses the stored `embedding` field if present
3. Falls back to the live model if the entity is missing from DB **or** has a null embedding
4. Returns `backfill` IDs (for resume embeddings) so the caller can schedule embedding writes for null entries

```
DB hit with embedding  →  ~5ms  (tensor load only)
DB hit, null embedding →  ~50-100ms (model fallback) + backfill ID returned
Not in DB             →  ~50-100ms (model fallback)
```

### Backfill IDs (Resume Embeddings)

The `backfill` block in resume embedding responses lets the Node.js layer enqueue writes for DB entries that exist but have no stored embedding:

```json
"backfill": {
  "skillIds": ["abc123", "def456"],
  "jobTitleId": "ghi789",
  "locationId": null
}
```

Use `generate_skill_embeddings`, `generate_job_title_embeddings`, or `generate_location_embeddings` to produce and persist these.

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
    const result = await calculateResumeScoreService(resumeId, job);
    return result;
};
```

### From Webhook (Direct Call)
```javascript
export const onResumeUpdate = async (resumeId) => {
    await createResumeEmbeddingService(resumeId, true);
};
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
│   ├── analytics_service.py  # Insights & recommendations
│   └── market_services/
│       ├── skill_services.py      # DB cache lookup for skills
│       ├── job_title_services.py  # DB cache lookup for job titles
│       └── location_services.py   # DB cache lookup for locations
        └── industry_services.py   # DB cache lookup for industries
│
├── utils/
│   ├── embedding_utils.py    # Extract embeddings from documents (DB-cache aware)
│   ├── date_utils.py         # Calculate experience years
│   ├── tensor_utils.py       # PyTorch tensor helpers
│   └── websocket_utils.py    # Progress event emitter
│
└── clustering/
    └── job_clustering.py     # K-Means clustering for jobs
```

## Caching Strategy

All operations check cache first to avoid redundant calculations:

| Operation | Cache Collection | TTL | Cache Key |
|-----------|-----------------|-----|-----------|
| Resume Embeddings | `resumeembeddings` | 90 days | `resume: ObjectId` |
| Resume Score | `resumescores` | 7 days | `resume: ObjectId` |
| Job Embeddings | `jobpostingembeddings` | 90 days | `jobPosting: ObjectId` |
| Resume-Job Comparison | `resumejobcomparisons` | 30 days | `resume + jobPosting` |
| Skill Embeddings | `skills.embedding` | Permanent | `skill: ObjectId` |
| Job Title Embeddings | `jobtitles.embedding` | Permanent | `title: ObjectId` |
| Location Embeddings | `locations.embedding` | Permanent | `location: ObjectId` |
| Industry Embeddings | `industrys.embedding` | Permanent | `industry: ObjectId` |

**Performance Impact:**
- Cache Hit (DB embedding): ~5ms
- Cache Hit (result doc): ~20ms (database lookup only)
- Cache Miss: ~500ms (Python execution + embedding generation)
- **Speedup: 25-100x faster with caching!**

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
  skills: [{
    _id: ObjectId,        // ref: 'Skill'
    name: String,
    level: String,        // 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  }],
  jobTitle: {
    _id: ObjectId,        // ref: 'JobTitle'
    name: String,
  },
  location: {
    _id: ObjectId,        // ref: 'Location'
    name: String,
  },
  workExperience: [{
    jobTitle: String,
    company: String,
    startDate: Date,
    endDate: Date,        // or "present"
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
  location: {
    _id: ObjectId,        // ref: 'Location'
    name: String,
  },
  jobTitle: {
    _id: ObjectId,        // ref: 'JobTitle'
    name: String,
  },
  experienceLevel: String,        // "Entry", "Mid", "Senior"
  status: String,                 // "active", "closed"
  skills: [{
    _id: ObjectId,        // ref: 'Skill'
    name: String,
  }],
  requirements: String[] | {      // Old schema: array of strings
    description: String,          // New schema: structured object
    education: String,
    yearsOfExperience: Number,
    certifications: [String]
  },
  description: String
}
``

### Shared Entity Collections (Embedding Cache)
```javascript
// skills, jobtitles, locations, industries
{
  _id: ObjectId,
  name: String,           // or normalizedTitle for jobtitles
  embedding: [Number]     // 768-dim float array; null means backfill needed
}
```

## Error Handling

All functions return JSON with an `error` field on failure:

```json
{
  "error": "Resume not found: invalid_id"
}
```

**Common Errors:**
- `Resume not found` — Invalid `resume_id` or resume doesn't exist
- `Job not found` — Invalid `job_id` or job doesn't exist
- `Skill not found` — Invalid `skill_id` or skill doesn't exist
- `Job title not found` — Invalid `title_id`
- `Location not found` — Invalid `location_id`
- `Industry not found` — Invalid `industry_id`
- `Failed to generate embedding` — Model loading failed or input too long
- `MongoDB connection error` — Database unreachable

## Performance Optimization

### 1. Prefer DB-Cached Embeddings
```python
# embedding_utils.py checks DB first for skills, job titles, locations
# Only calls embedding_model.encode() as a fallback
skill_docs = SkillService.get_with_embeddings_by_names(skill_names)
```

### 2. Use Field Projections
```python
# Good — Only fetch needed fields (3-8 KB)
resume = ResumeService.get_job_relevant_resume(resume_id)

# Bad — Fetch entire document (15-25 KB)
resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
```

### 3. Leverage Result Caching
```javascript
// Always check cache first
const cached = await getResumeEmbeddingsRepo(resumeId);
if (cached && isFresh(cached)) {
    return cached; // Up to 100x faster!
}
```

### 4. Schedule Backfill Writes
After generating resume embeddings, check the `backfill` block and enqueue writes for any returned IDs. This keeps the DB cache warm and avoids repeated model fallback for common skills and titles.

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
# Run from project root
node backend/server.js

# Not from:
cd backend/python_scripts && node ../server.js  # Wrong!
```

### Module Import Errors
```bash
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
- [ ] Expose `compare_resume_job` and `get_recommendations` via `main.py` CLI

## Contributing

When adding new commands:

1. Add function to `main.py`
2. Add corresponding service in `services/`
3. Update this README with examples
4. Add tests in `tests/`