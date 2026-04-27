""" Service for job title-related operations """

from typing import Optional
from config.database import db
from bson import ObjectId
import torch
import logging

logger = logging.getLogger(__name__)

class JobTitleService:

    @staticmethod
    def get_by_id(title_id: str) -> Optional[dict]:
        """Single job title fetch — all market fields in one shot."""
        try:
            return db.jobtitles.find_one(
                {"_id": ObjectId(title_id)},
                {
                    "title": 1,
                    "normalizedTitle": 1,
                    "seniorityLevel": 1,
                    "industry": 1,
                    "demandMetrics": 1,
                    "salaryData": 1,
                    "trendData": 1,
                    "topSkills": 1,
                    "commonEducation": 1,
                    "experienceDistribution": 1,
                    "isActive": 1,
                }
            )
        except Exception as e:
            logger.error(f"Error fetching job title {title_id}: {e}")
            return None

    @staticmethod
    def get_by_normalized_title(normalized_title: str) -> Optional[dict]:
        """
        Lookup by normalized title string.
        Fallback for when job posting title hasn't been migrated to ObjectId ref yet,
        or when matching against free-text input.
        """
        try:
            return db.jobtitles.find_one(
                {"normalizedTitle": normalized_title},
                {
                    "title": 1,
                    "normalizedTitle": 1,
                    "seniorityLevel": 1,
                    "industry": 1,
                    "demandMetrics": 1,
                    "salaryData": 1,
                    "trendData": 1,
                    "topSkills": 1,
                    "commonEducation": 1,
                    "experienceDistribution": 1,
                    "isActive": 1,
                }
            )
        except Exception as e:
            logger.error(f"Error fetching job title by normalized title {normalized_title}: {e}")
            return None

    @staticmethod
    def extract_metrics(title_doc: dict) -> dict:
        """
        Flatten nested doc into prediction-ready metrics.
        Keeps salaryBySeniority separate from skill salary —
        they're distinct signals for the prediction pipeline.
        """
        if not title_doc:
            return {}

        demand = title_doc.get("demandMetrics", {})
        salary = title_doc.get("salaryData", {})
        trend  = title_doc.get("trendData", {})

        return {
            # Identity
            "title": title_doc.get("title"),
            "normalizedTitle": title_doc.get("normalizedTitle"),
            "seniorityLevel": title_doc.get("seniorityLevel"),
            "industry": title_doc.get("industry"),
            # Demand signals
            "demandScore": demand.get("demandScore", 0),
            "monthlyGrowth": demand.get("monthlyGrowth", 0),
            "competitionRatio": demand.get("competitionRatio", 1),
            "totalPostings": demand.get("totalPostings", 0),
            # Salary signals
            "averageSalary": salary.get("averageSalary", 0),
            "medianSalary": salary.get("medianSalary", 0),
            "salaryRange": salary.get("salaryRange", {}),
            # Seniority-aware salary — more accurate than flat average
            "salaryBySeniority": salary.get("bySeniority", {}),
            "currency": salary.get("currency", "$"),
            # Trend signals
            "isGrowing": trend.get("isGrowing", False),
            "growthRate": trend.get("growthRate", 0),
            # Role context — useful for candidate education/experience matching
            "commonEducation": title_doc.get("commonEducation", []),
            "experienceDistribution": title_doc.get("experienceDistribution", {}),
            "topSkills": [
                {
                    "name": s.get("skillName"),
                    "frequency": s.get("frequency", 0),
                    "importance": s.get("importance"),
                }
                for s in title_doc.get("topSkills", [])
            ],
        }
    
    @staticmethod
    def get_with_embedding_by_id(job_title_id: str) -> Optional[dict]:
        try:
            return db.jobtitles.find_one(
                {"_id": ObjectId(job_title_id)},
                {
                    "title": 1,
                    "embedding": 1
                }
            )
        except Exception as e:
            logger.error(f"Error fetching job title embedding by id {job_title_id}: {e}")
            return None
        
    @staticmethod
    def get_with_embedding_by_name(job_title_name: str) -> Optional[dict]:
        """
        Fetch a job title document including its embedding vector using a title string.

        Lookup strategy:
        1. Attempt an exact match on the `title` field.
        2. If no match is found, fallback to `normalizedTitle` to handle variations
        in casing, formatting, or minor naming differences.

        This fallback mechanism improves robustness when dealing with:
        - user-entered job titles
        - resume parsing results
        - legacy job postings without ObjectId references
        - inconsistent casing (e.g., "software engineer" vs "Software Engineer")

        Only minimal fields are returned to reduce payload size since embeddings
        are large vectors and typically used for similarity search or AI scoring.

        @param job_title_name {str} Job title string to search for.
        @returns {Optional[dict]} Object containing job title identity and embedding
        if found, otherwise None.

        Example return structure:
        {
            "title": "Software Engineer",
            "normalizedTitle": "software engineer",
            "embedding": [0.023, -0.104, ...]
        }
        """
        try:
            doc = db.jobtitles.find_one(
                {
                    "$or": [
                        {"title": job_title_name},
                        {"normalizedTitle": job_title_name.lower().strip()}
                    ]
                },
                {
                    "title": 1,
                    "normalizedTitle": 1,
                    "embedding": 1
                },
                collation={"locale": "en", "strength": 2}  # ✅ passed as parameter
            )

            return doc

        except Exception as e:
            logger.error(f"Error fetching jobtitle embedding by name {job_title_name}: {e}")
            return None