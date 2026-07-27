import { getPineconeIndex } from '../../config/pinecone.js';
import { buildResumeVector } from '../jobs/domains/embedding/vectorComposer.js';
import { ResumeEmbeddingsDocument } from '../../types/embeddings.types.js';
import logger from '../../utils/logger.js';

// ─── Filter Types ─────────────────────────────────────────────────────────────

/**
 * Hard filters applied to Pinecone BEFORE vector similarity search runs.
 *
 * How Pinecone filtering works:
 * 1. Pinecone first narrows the index to records matching these filters
 * 2. Then runs cosine similarity ONLY on that filtered subset
 * 3. Returns topK most similar results
 *
 * Only include filters here that are non-negotiable constraints.
 * Soft preferences (salary range, location) are better handled by
 * the LLM reranker after retrieval — hard-filtering them risks
 * cutting out good matches.
 */
export interface JobQueryFilters {
  /**
   * Candidate's experience level — 'Intern' | 'Entry' | 'Mid-Level' | 'Senior'
   * Pinecone will match this level plus one adjacent level above and below.
   * Example: 'Entry' → queries for ['Intern', 'Entry', 'Mid-Level']
   */
  experienceLevel?: string;

  /**
   * Total years of work experience from resumeEmbedding.metrics.totalExperienceYears.
   * Filters out jobs whose yearsOfExperience requirement exceeds this by more than 1.
   * Example: candidate has 3 years → only returns jobs requiring <= 4 years
   */
  totalExperienceYears?: number;

  /**
   * Candidate's preferred job type — 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship'
   * Only applied when the candidate has a strict preference.
   * Omit this filter to return all job types.
   */
  jobType?: string;
}

// ─── Result Types ─────────────────────────────────────────────────────────────

/**
 * The metadata fields returned on each Pinecone match.
 * Mirrors JobPineconeMetadata exactly — what was upserted is what comes back.
 *
 * These fields are passed directly to your hybrid scoring layer and
 * LLM reranker so neither needs to fetch from MongoDB for basic scoring.
 */
export interface JobMatchMetadata {
  title:                  string;
  location:               string;
  skills:                 string[];
  requiredSkills:         string[];
  experienceLevel:        string;
  jobType:                string;
  yearsOfExperience:      number;
  salaryMin:              number;
  salaryMax:              number;
  salaryCurrency:         string;
  salaryFrequency:        string;
  requiredCertifications: string[];
  postedAt:               number;
}

/**
 * A single job match returned from Pinecone.
 *
 * `vectorSimilarity` is the raw cosine score (0–1) from Pinecone.
 * It is a SUPPORTING signal — not the final match score.
 * Your hybrid scoring formula will combine it with skill overlap,
 * experience alignment, and seniority fit to produce the final score.
 *
 * Higher vectorSimilarity = more semantically similar overall profile,
 * but a score of 0.95 doesn't mean it's a good match — it just means
 * the composite vectors are geometrically close.
 */
export interface JobMatch {
  /** MongoDB ObjectId string of the JobPosting */
  jobId:            string;

  /**
   * Cosine similarity score from Pinecone (0–1).
   * 1.0 = identical vectors, 0.0 = completely unrelated.
   * Typical good matches land between 0.65–0.90.
   */
  vectorSimilarity: number;

  /** All filterable metadata upserted with this job's vector */
  metadata:         JobMatchMetadata;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Matches JobPosting.experienceLevel enum exactly.
 * Order matters — adjacency is computed by index position.
 */
const EXPERIENCE_LADDER = ['Intern', 'Entry', 'Mid-Level', 'Senior'] as const;
type ExperienceLevel = typeof EXPERIENCE_LADDER[number];

const MIN_POOL_SIZE = 5;

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * Queries Pinecone's `jobs` namespace to find the topK most semantically
 * similar job postings for a given resume.
 *
 * Flow:
 * 1. Builds a composite vector from the resume's field embeddings
 * 2. Applies hard metadata filters (experienceLevel, yearsOfExperience, jobType)
 * 3. Pinecone runs cosine similarity on the filtered subset
 * 4. Returns topK matches with similarity scores + metadata
 *
 * The returned matches are then passed to your hybrid scoring layer
 * and LLM reranker — this function only handles retrieval.
 *
 * @param doc     - Resume embedding document from MongoDB
 * @param filters - Hard constraints to apply before vector search
 * @param topK    - Number of candidates to retrieve (default 20).
 *                  Retrieve more than you need — the reranker will cut it down.
 *
 * @example
 * const matches = await queryJobsForResume(resumeEmbedding, {
 *   experienceLevel:      'Mid-Level',
 *   totalExperienceYears: resumeEmbedding.metrics?.totalExperienceYears,
 *   jobType:              'Full-Time',
 * });
 *
 * // matches is now ready for your hybrid scoring layer
 * const scored = matches.map(match => computeHybridScore(resumeData, match));
 */
export async function queryJobsForResume(
  doc: ResumeEmbeddingsDocument,
  filters: JobQueryFilters,
  topK = 20
): Promise<JobMatch[]> {
  const index = getPineconeIndex();
  const vector = buildResumeVector(doc);

  const filter: Record<string, unknown> = {};

  if (filters.experienceLevel) {
    filter.experienceLevel = { $in: getAdjacentLevels(filters.experienceLevel) };
  }

  if (filters.totalExperienceYears !== undefined) {
    /**
     * Buffer scales with candidate seniority. Junior candidates need a much
     * wider window than senior ones — most "2-4 yrs" postings are realistically
     * open to strong entry-level applicants, but that only shows up if we
     * retrieve them at all. A flat +1 buffer works fine at 5+ years but
     * silently starves 0-1 year candidates down to almost nothing.
     *
     * 0-1 yrs  → +3 buffer (catches the common "2-4 yrs" junior/tech range)
     * 2-4 yrs  → +2 buffer
     * 5+ yrs   → +1 buffer (original behavior, unchanged)
     */
    const years = filters.totalExperienceYears;
    const buffer = years <= 1 ? 3 : years <= 4 ? 2 : 1;

    filter.yearsOfExperience = { $lte: years + buffer };
  }

  if (filters.jobType) {
    filter.jobType = { $eq: filters.jobType };
  }

  /**
   * Location is intentionally NOT filtered here.
   * Reason: hard string matching causes false misses.
   * "Manila" and "Metro Manila" are the same place but won't match as strings.
   * The composite vector already encodes location semantics — let it handle proximity.
   * The LLM reranker will flag genuine location mismatches.
   */

  logger.info(
    `[Pinecone] Querying jobs for resume: ${doc.resume} | ` +
    `filters: ${JSON.stringify(filter)} | topK: ${topK}`
  );

  const results = await index.namespace('jobs').query({
    vector,
    topK,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    includeMetadata: true,
  });

  let matches = results.matches.map(match => ({
    jobId:            match.id,
    vectorSimilarity: match.score ?? 0,
    metadata:         match.metadata as unknown as JobMatchMetadata,
  }));

  /**
   * Safety net: hard filters should never starve the reranker down to a
   * near-empty pool. If the experience filter leaves us with too few
   * candidates, retry without it so the scorer has enough breadth to
   * actually differentiate and rank — instead of "recommending" whatever
   * the 1-2 survivors happened to be.
   */
  if (matches.length < MIN_POOL_SIZE && filter.yearsOfExperience) {
    logger.warn(
      `[Pinecone] Only ${matches.length} candidates after experience filter — ` +
      `retrying without it for resume: ${doc.resume}`
    );

    const relaxedFilter = { ...filter };
    delete relaxedFilter.yearsOfExperience;

    const fallbackResults = await index.namespace('jobs').query({
      vector,
      topK,
      filter: Object.keys(relaxedFilter).length > 0 ? relaxedFilter : undefined,
      includeMetadata: true,
    });

    const seen = new Set(matches.map(m => m.jobId));
    const extra = fallbackResults.matches
      .filter(m => !seen.has(m.id))
      .map(match => ({
        jobId:            match.id,
        vectorSimilarity: match.score ?? 0,
        metadata:         match.metadata as unknown as JobMatchMetadata,
      }));

    matches = [...matches, ...extra];
  }

  return matches;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the given experience level plus one adjacent level above and below.
 * Prevents over-filtering by keeping the candidate pool wide enough
 * for the reranker to meaningfully differentiate.
 *
 * Examples:
 * - 'Entry'    → ['Intern', 'Entry', 'Mid-Level']
 * - 'Mid-Level'→ ['Entry', 'Mid-Level', 'Senior']
 * - 'Intern'   → ['Intern', 'Entry']             (no level below)
 * - 'Senior'   → ['Mid-Level', 'Senior']          (no level above)
 * - unknown    → [level]                          (passthrough)
 */
function getAdjacentLevels(level: string): string[] {
  const idx = EXPERIENCE_LADDER.indexOf(level as ExperienceLevel);
  if (idx === -1) return [level];
  return [...EXPERIENCE_LADDER.slice(Math.max(0, idx - 1), idx + 2)];
}