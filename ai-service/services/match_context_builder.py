# services/match_context_builder.py — drop the question param and boosting logic,
# it only ever gets one match now so there's nothing to prioritize
MAX_MATCHES_IN_CONTEXT = 1


def build_match_context(resume: dict, matches: list[dict]) -> str:
    """Formats the single job match for the prompt."""
    lines = []
    for m in matches[:MAX_MATCHES_IN_CONTEXT]:
        meta = m.get("metadata", {})
        lines.append(
            f"- {meta.get('title', 'Unknown role')} — score {m.get('finalScore', 0)}/100 "
            f"({m.get('recommendationType', 'Unrated')}), "
            f"location: {meta.get('location', 'n/a')}, "
            f"salary: {meta.get('salaryMin', '?')}-{meta.get('salaryMax', '?')} "
            f"{meta.get('salaryCurrency', '')}/{meta.get('salaryFrequency', '')}\n"
            f"  matched skills: {', '.join(m.get('matchedSkills', [])[:6]) or 'none'}\n"
            f"  missing skills: {', '.join(m.get('missingSkills', [])[:6]) or 'none'}\n"
            f"  strengths: {'; '.join(m.get('strengths', [])) or 'none noted'}\n"
            f"  improvements: {'; '.join(m.get('improvements', [])) or 'none noted'}"
        )

    resume_skills = [s.get("name", "") for s in resume.get("skills", [])][:15]
    resume_level = resume.get("experienceLevel", "unspecified")

    return (
        f"CANDIDATE PROFILE\n"
        f"Experience level: {resume_level}\n"
        f"Key skills: {', '.join(resume_skills) or 'none listed'}\n\n"
        f"JOB MATCH\n" + "\n".join(lines)
    )
