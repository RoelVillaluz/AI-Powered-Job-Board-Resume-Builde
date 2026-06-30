from utils.tensor_utils import tensor_to_list


def serialize_resume_embeddings(resume_id, emb) -> dict:
    return {
        "resume_id": resume_id,
        "embeddings": {
            "jobTitle": tensor_to_list(emb.job_title),
            "location": tensor_to_list(emb.location),
        },
        "meanEmbeddings": {
            "skills": tensor_to_list(emb.skills),
            "workExperience": tensor_to_list(emb.work_experience),
            "certifications": tensor_to_list(emb.certifications),
        },
        "metrics": {
            "totalExperienceYears": emb.total_experience_years,
        },
        "skill_ids_to_backfill": emb.skill_ids_to_backfill,
        "skill_embeddings_to_backfill": [
            tensor_to_list(e) for e in emb.skill_embeddings_to_backfill
        ],
        "job_title_id_to_backfill": emb.job_title_id_to_backfill,
        "location_id_to_backfill": emb.location_id_to_backfill,
    }


def serialize_resume_score(resume_id, score, insights, total_exp) -> dict:
    return {
        "resume_id": str(resume_id),
        "overall_score": score.overall_score,
        "grade": score.grade,
        "breakdown": {
            "completeness": score.completeness_score,
            "experience": score.experience_score,
            "skills": score.skills_score,
            "certifications": score.certification_score,
            "career_progression": score.career_progression_score,
        },
        "total_experience_years": total_exp,
        "strengths": insights.strengths if insights else [],
        "improvements": insights.improvement_suggestions if insights else [],
        "recommendations": insights.skill_gaps if insights else [],
    }
