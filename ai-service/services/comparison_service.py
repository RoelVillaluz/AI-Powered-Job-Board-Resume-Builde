"""
Service for resume-to-job comparison and similarity scoring.

ARCHITECTURE NOTE:
    This is a pure compute layer. Zero DB access.

    The old compare_resume_to_job / calculate_resume_job_similarity_with_cache
    methods fetched resumes, jobs, and cached embeddings from the DB internally.
    That responsibility now belongs entirely to Node.js, which:

        1. Fetches the resume and job documents
        2. Fetches cached embeddings (resume_embeddings, job_posting_embeddings)
        3. Fetches skill/title/location docs needed for fallback embedding
        4. Calls the AI service with the fully hydrated payload

    Python receives the payload and runs math — nothing else.

Node payload contract for compare():
    {
        "resumeEmbeddings": {
            "skills":         float[] | null,
            "workExperience": float[] | null,
            "certifications": float[] | null,
        },
        "jobEmbeddings": {
            "skills":       float[] | null,
            "requirements": float[] | null,
            "title":        float[] | null,
        },
        "resume": {          # only needed for detailed skill analysis
            "skills": [{ "name": str }, ...]
        },
        "job": {             # only needed for detailed skill analysis
            "skills": [{ "name": str }, ...]
        }
    }
"""

import torch
from typing import Optional, Dict
import logging
from services.similarity_service import SimilarityService, SimilarityWeights

logger = logging.getLogger(__name__)


class ComparisonService:
    """Handles resume-to-job comparison. Pure compute — no DB access."""

    # ──────────────────────────────────────────────────────────────────────
    # Tensor helpers
    # ──────────────────────────────────────────────────────────────────────

    @staticmethod
    def _to_tensor(value) -> Optional[torch.Tensor]:
        """Convert a list or existing tensor to a torch.Tensor, or return None."""
        if value is None:
            return None
        if isinstance(value, torch.Tensor):
            return value
        if isinstance(value, list) and value:
            return torch.tensor(value)
        return None

    # ──────────────────────────────────────────────────────────────────────
    # Core comparison — pure compute
    # ──────────────────────────────────────────────────────────────────────

    @staticmethod
    def compare(
        resume_embeddings: dict,
        job_embeddings: dict,
        resume: Optional[dict] = None,
        job: Optional[dict] = None,
        weights: Optional[SimilarityWeights] = None,
    ) -> Dict:
        """
        Compare a resume to a job using pre-computed embedding vectors.

        Node fetches and caches embeddings; Python receives them as plain lists
        and runs cosine similarity. No DB access whatsoever.

        Args:
            resume_embeddings: Dict of { skills, workExperience, certifications }
                               where each value is a float[] or None.
            job_embeddings:    Dict of { skills, requirements, title }
                               where each value is a float[] or None.
            resume:            Optional resume dict for detailed skill gap analysis.
                               Only needs { skills: [{ name }] }.
            job:               Optional job dict for detailed skill gap analysis.
                               Only needs { skills: [{ name }] }.
            weights:           Optional custom similarity weights.

        Returns:
            Dict with similarity scores, percentages, recommendation level,
            and optional skill gap analysis.
        """
        to_t = ComparisonService._to_tensor

        resume_skills_t = to_t(resume_embeddings.get("skills"))
        resume_work_t = to_t(resume_embeddings.get("workExperience"))
        resume_certs_t = to_t(resume_embeddings.get("certifications"))

        job_skills_t = to_t(job_embeddings.get("skills"))
        job_reqs_t = to_t(job_embeddings.get("requirements"))
        job_title_t = to_t(job_embeddings.get("title"))

        if weights is None:
            weights = SimilarityWeights()

        skill_sim = SimilarityService.cosine_similarity(resume_skills_t, job_skills_t)
        exp_sim = SimilarityService.cosine_similarity(resume_work_t, job_title_t)
        req_sim = SimilarityService.cosine_similarity(resume_certs_t, job_reqs_t)

        total_score = skill_sim * weights.skills + exp_sim * weights.experience

        result: Dict = {
            "skillSimilarity": float(skill_sim) if skill_sim is not None else None,
            "experienceSimilarity": float(exp_sim) if exp_sim is not None else None,
            "requirementSimilarity": float(req_sim) if req_sim is not None else None,
            "totalScore": float(total_score),
            "matchPercentage": round(float(total_score) * 100, 2),
            "skillMatchPercentage": round(float(skill_sim) * 100, 2)
            if skill_sim is not None
            else None,
            "experienceMatchPercentage": round(float(exp_sim) * 100, 2)
            if exp_sim is not None
            else None,
            "requirementMatchPercentage": round(float(req_sim) * 100, 2)
            if req_sim is not None
            else None,
        }

        # Recommendation level
        pct = result["matchPercentage"]
        if pct >= 80:
            result["recommendationLevel"] = "Excellent Match"
        elif pct >= 65:
            result["recommendationLevel"] = "Good Match"
        elif pct >= 50:
            result["recommendationLevel"] = "Fair Match"
        else:
            result["recommendationLevel"] = "Poor Match"

        # Skill gap analysis — only if both resume and job skill lists are provided
        result["matchedSkills"] = []
        result["missingSkills"] = []
        result["strengths"] = []
        result["improvements"] = []

        if resume and job:
            resume_skill_names = {
                s.get("name", "").lower() for s in resume.get("skills", [])
            }
            job_skill_names = {s.get("name", "").lower() for s in job.get("skills", [])}

            matched = list(resume_skill_names & job_skill_names)
            missing = list(job_skill_names - resume_skill_names)

            strengths = []
            improvements = []

            if skill_sim is not None and skill_sim >= 0.7:
                strengths.append("Strong skills alignment")
            if exp_sim is not None and exp_sim >= 0.7:
                strengths.append("Relevant work experience")
            if req_sim is not None and req_sim >= 0.7:
                strengths.append("Meets certification requirements")
            if matched and job_skill_names:
                if len(matched) > len(job_skill_names) * 0.7:
                    strengths.append(
                        f"Matches {len(matched)} of {len(job_skill_names)} required skills"
                    )

            if skill_sim is not None and skill_sim < 0.5:
                improvements.append("Develop more relevant technical skills")
            if exp_sim is not None and exp_sim < 0.5:
                improvements.append("Gain more experience in similar roles")
            if missing:
                improvements.append(f"Consider learning: {', '.join(missing[:3])}")
            if job_skill_names and len(matched) < len(job_skill_names) * 0.5:
                improvements.append(
                    f"Only {len(matched)} of {len(job_skill_names)} required skills match"
                )

            result["matchedSkills"] = matched
            result["missingSkills"] = missing
            result["strengths"] = strengths
            result["improvements"] = improvements

        return result

    # ──────────────────────────────────────────────────────────────────────
    # Batch comparison — one resume vs many jobs
    # ──────────────────────────────────────────────────────────────────────

    @staticmethod
    def compare_batch(
        resume_embeddings: dict,
        jobs_payload: list[dict],
        weights: Optional[SimilarityWeights] = None,
    ) -> list[Dict]:
        """
        Compare one resume against multiple jobs.

        Args:
            resume_embeddings: Same shape as compare() — pre-converted float[].
            jobs_payload:      List of { jobId, jobEmbeddings } dicts.
            weights:           Optional custom weights.

        Returns:
            List of comparison result dicts, each including the jobId.
        """
        results = []
        for job_payload in jobs_payload:
            result = ComparisonService.compare(
                resume_embeddings=resume_embeddings,
                job_embeddings=job_payload.get("jobEmbeddings", {}),
                weights=weights,
            )
            result["jobId"] = job_payload.get("jobId")
            results.append(result)
        return results
