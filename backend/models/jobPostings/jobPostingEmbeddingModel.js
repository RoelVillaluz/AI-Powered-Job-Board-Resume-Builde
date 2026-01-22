import mongoose from "mongoose"

/**
 * JobPostingEmbedding Schema
 *
 * Stores **precomputed vector embeddings** for a job posting.
 *
 * - Raw embeddings are regenerated whenever the job posting changes
 * - Mean embeddings are computed once for fast similarity, scoring, and matching
 * - Includes a `sourceHash` to detect updates in the job posting content
 *
 * Example usage (maps directly to `extract_job_embeddings` Python function):
 * ```python
 * mean_skills, mean_requirements, exp_embedding, title_embedding, location_embedding = extract_job_embeddings(job)
 * ```
 * ```js
 * const newJobEmbedding = new JobEmbedding({
 *   jobPosting: job._id,
 *   embeddings: {
 *     jobTitle: [title_embedding],
 *     skills: skill_embeddings,
 *     experienceLevel: [exp_embedding],
 *     requirements: requirement_embeddings,
 *     location: [location_embedding],
 *   },
 *   meanEmbeddings: {
 *     jobTitle: title_embedding,
 *     skills: computeMean(skill_embeddings),
 *     requirements: computeMean(requirement_embeddings),
 *     experienceLevel: exp_embedding,
 *     location: location_embedding,
 *   },
 *   sourceHash: hashJob(job),
 * });
 * await newJobEmbedding.save();
 * ```
 *
 * @schema JobPostingEmbedding
 */
const jobPostingEmbeddingSchema = new mongoose.Schema(
  {
    jobPosting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: true,
      index: true,
    },
    embeddings: {
        jobTitle: {
            type: [Number],
            default: [],
        },
        skills: {
            type: [[Number]],
            default: [],
        },
        experienceLevel: {
            type: [Number],
            default: [],
        },
        requirements: {
            type: [[Number]],
            default: [],
        },
        location: {
            type: [Number],
            default: [],
        },
    },
    meanEmbeddings: {
        jobTitle: {
            type: [Number],
            default: null,
        },
        skills: {
            type: [Number],
            required: true,
        },
        requirements: {
            type: [Number],
            required: true,
        },
        experienceLevel: {
            type: [Number],
            default: null,
        },
        location: {
            type: [Number],
            default: null,
        },
    },
    sourceHash: {
        type: String,
        required: true,
        index: true,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — auto-delete embeddings after 90 days
jobPostingEmbeddingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const JobEmbedding = mongoose.model("JobPostingEmbedding", jobPostingEmbeddingSchema);

export default JobEmbedding;
