""" Service for skill-related operations """

from typing import Optional
from config.database import db
from bson import ObjectId
import torch
import logging

logger = logging.getLogger(__name__)

class SkillService:

    @staticmethod
    def get_by_id(skill_id: str) -> Optional[dict]:
        """Single skill — for admin, skill detail pages, etc."""
        try:
            return db.skills.find_one(
                {"_id": ObjectId(skill_id)},
                {"name": 1, "type": 1, "demandScore": 1, "growthRate": 1,
                 "seniorityMultiplier": 1, "salaryData": 1}
            )
        except Exception as e:
            logger.error(f"Error fetching skill {skill_id}: {e}")
            return None

    @staticmethod
    def get_by_names(skill_names: list[str]) -> list[dict]:
        """
        Bulk fetch by name — primary use case for resume/job matching.
        Single round-trip for all skills.
        """
        if not skill_names:
            return []
        try:
            return list(db.skills.find(
                {"name": {"$in": skill_names}},
                {"name": 1, "type": 1, "demandScore": 1, "growthRate": 1,
                 "seniorityMultiplier": 1, "salaryData": 1}
            ))
        except Exception as e:
            logger.error(f"Error fetching skills by names: {e}")
            return []

    @staticmethod
    def get_with_embedding_by_id(skill_id: str) -> Optional[dict]:
        """
        Fetch a skill including its embedding vector using the skill's ObjectId.

        This method is typically used when the system already has a reference
        to the skill document (e.g., from a resume or job posting that stores
        ObjectId references).

        Only minimal fields are returned because embeddings are large vectors
        and unnecessary fields increase payload size.

        @param skill_id {str} MongoDB ObjectId of the skill.
        @returns {Optional[dict]} Skill identity, embedding, and core market signals.
        """
        try:
            return db.skills.find_one(
                {"_id": ObjectId(skill_id)},
                {
                    "name": 1,
                    "embedding": 1,
                    "demandScore": 1,
                    "growthRate": 1,
                    "seniorityMultiplier": 1,
                    "salaryData": 1
                }
            )
        except Exception as e:
            logger.error(f"Error fetching skill embedding by id {skill_id}: {e}")
            return None
        
    @staticmethod
    def get_with_embedding_by_name(skill_name: str) -> Optional[dict]:
        """
        Fetch a skill including its embedding vector using a skill name.

        Lookup strategy:
        1. Attempt an exact match on the `name` field.
        2. Fallback to a normalized lowercase version to handle minor
        formatting differences (e.g., "Python" vs "python").

        This method is commonly used when skills are extracted from resumes,
        job descriptions, or user input where ObjectId references may not exist.

        Only minimal fields are returned because embeddings are large vectors
        and typically used for similarity search or AI scoring.

        @param skill_name {str} Skill name to search for.
        @returns {Optional[dict]} Skill identity, embedding, and key metrics.
        """
        try:
            normalized = skill_name.lower().strip()

            return db.skills.find_one(
                {
                    "$or": [
                        {"name": skill_name},
                        {"name": normalized}
                    ]
                },
                {
                    "name": 1,
                    "embedding": 1,
                    "demandScore": 1,
                    "growthRate": 1,
                    "seniorityMultiplier": 1,
                    "salaryData": 1
                }
            )

        except Exception as e:
            logger.error(f"Error fetching skill embedding by name {skill_name}: {e}")
            return None

    @staticmethod
    def extract_metrics(skill_docs: list[dict]) -> list[dict]:
        """
        Flatten skill documents into prediction-ready metrics.
        Mirrors JobTitleService.extract_metrics structure for consistency.
        Includes nested salaryData, seniorityMultiplier, and optional embedding.
        """
        metrics_list = []

        for doc in skill_docs:
            if not doc:
                continue

            salary = doc.get("salaryData", {})
            metrics_list.append({
                # Identity
                "name": doc.get("name"),
                "type": doc.get("type"),  # technical / soft

                # Demand & growth
                "demandScore": doc.get("demandScore", 0),
                "growthRate": doc.get("growthRate", 0),
                "seniorityMultiplier": doc.get("seniorityMultiplier", 1),

                # Salary signals
                "salaryData": {
                    "averageSalary": salary.get("averageSalary", 0),
                    "medianSalary": salary.get("medianSalary", 0),
                    "salaryRange": salary.get("salaryRange", {}),
                    "currency": salary.get("currency", "$"),
                    "lastCalculated": salary.get("lastCalculated"),
                },

                # Optional embedding (if precomputed)
                "embedding": doc.get("embedding", None),
            })

        return metrics_list