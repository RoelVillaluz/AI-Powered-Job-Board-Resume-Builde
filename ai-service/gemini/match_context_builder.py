# gemini/match_context_builder.py — drop the question param and boosting logic,
# it only ever gets one match now so there's nothing to prioritize
import re

MAX_MATCHES_IN_CONTEXT = 1
MAX_UNTRUSTED_VALUE_LENGTH = 48


def _sanitize(value: str) -> str:
    """Strip control characters and cap the length of untrusted text so
    injection payloads cannot survive verbatim in the prompt."""
    cleaned = re.sub(r"[\r\n\t]+", " ", str(value))
    return cleaned[:MAX_UNTRUSTED_VALUE_LENGTH].strip()


def _delimit(tag: str, value: str) -> str:
    """Wrap an untrusted field in an XML-style tag so the model can treat it
    as data, never as instructions."""
    return f"<{tag}>{_sanitize(value)}</{tag}>"


def build_match_context(resume: dict, matches: list[dict]) -> str:
    """Formats the single job match for the prompt.

    All user-controlled / employer-controlled text is wrapped in XML-style
    delimiters. The system instruction tells the model to treat anything inside
    these tags as DATA — never as instructions to follow.
    """
    lines = []
    for m in matches[:MAX_MATCHES_IN_CONTEXT]:
        meta = m.get("metadata", {})
        title = _delimit("job_title", str(meta.get("title", "Unknown role")))
        location = _delimit("location", str(meta.get("location", "n/a")))
        salary = _delimit(
            "salary",
            f"{meta.get('salaryMin', '?')}-{meta.get('salaryMax', '?')} "
            f"{meta.get('salaryCurrency', '')}/{meta.get('salaryFrequency', '')}",
        )
        matched_skills = ", ".join(
            _delimit("skill", s) for s in m.get("matchedSkills", [])[:6]
        ) or "none"
        missing_skills = ", ".join(
            _delimit("skill", s) for s in m.get("missingSkills", [])[:6]
        ) or "none"
        strengths = "; ".join(
            _delimit("strength", s) for s in m.get("strengths", [])
        ) or "none noted"
        improvements = "; ".join(
            _delimit("improvement", s) for s in m.get("improvements", [])
        ) or "none noted"
        fit_tier = _delimit("fit_tier", str(m.get("recommendationType", "Unrated")))
        lines.append(
            f"- {title} — score {m.get('finalScore', 0)}/100 ({fit_tier}), "
            f"location: {location}, salary: {salary}\n"
            f"  matched skills: {matched_skills}\n"
            f"  missing skills: {missing_skills}\n"
            f"  strengths: {strengths}\n"
            f"  improvements: {improvements}"
        )

    resume_skills = [
        _delimit("skill", s.get("name", ""))
        for s in resume.get("skills", [])
        if s.get("name")
    ][:15]
    resume_level = _delimit(
        "experience_level", str(resume.get("experienceLevel", "unspecified"))
    )

    return (
        f"CANDIDATE PROFILE\n"
        f"Experience level: {resume_level}\n"
        f"Key skills: {', '.join(resume_skills) or 'none listed'}\n\n"
        f"JOB MATCH\n" + "\n".join(lines)
    )
