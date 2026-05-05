""" Service for industry-related operations """

from typing import Dict, List, Optional
from config.database import db
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

INDUSTRY_COLLECTION = db.industrys  # mongo pluralization noted


class IndustryService:

    @staticmethod
    def get_by_id(industry_id: str) -> Optional[dict]:
        """
        Fetch a single industry by ObjectId.

        Used when the system already has an ObjectId reference
        (e.g., stored in a company profile or job posting).
        """
        try:
            return INDUSTRY_COLLECTION.find_one(
                {"_id": ObjectId(industry_id)},
                {
                    "name": 1,
                    "marketMetrics": 1,
                    "salaryBenchmarks": 1,
                    "topSkills": 1,
                    "topJobTitles": 1,
                    "emergingSkills": 1,
                    "decliningSkills": 1,
                    "dataQuality": 1
                }
            )
        except Exception as e:
            logger.error(f"Error fetching industry {industry_id}: {e}")
            return None


    @staticmethod
    def get_by_name(industry_name: str) -> Optional[dict]:
        """
        Fetch industry by name.

        This is commonly used because job postings often store
        industry as a string enum instead of an ObjectId reference.
        """
        try:
            return INDUSTRY_COLLECTION.find_one(
                {"name": industry_name},
                {
                    "name": 1,
                    "marketMetrics": 1,
                    "salaryBenchmarks": 1,
                    "topSkills": 1,
                    "topJobTitles": 1,
                    "emergingSkills": 1,
                    "decliningSkills": 1,
                    "dataQuality": 1
                }
            )
        except Exception as e:
            logger.error(f"Error fetching industry by name {industry_name}: {e}")
            return None


    @staticmethod
    def get_with_embedding_by_id(industry_id: str) -> Optional[dict]:
        """
        Fetch industry including its embedding vector using ObjectId.

        Embeddings are used for semantic similarity between industries
        (e.g., Technology vs FinTech vs SaaS).

        Only minimal fields are returned because embeddings are large
        vectors and typically used for AI similarity search.
        """
        try:
            return INDUSTRY_COLLECTION.find_one(
                {"_id": ObjectId(industry_id)},
                {
                    "name": 1,
                    "embedding": 1,
                    "marketMetrics": 1,
                    "salaryBenchmarks": 1
                }
            )
        except Exception as e:
            logger.error(f"Error fetching industry embedding by id {industry_id}: {e}")
            return None


    @staticmethod
    def get_with_embedding_by_name(industry_name: str) -> Optional[dict]:
        """
        Fetch industry including its embedding vector using industry name.

        Lookup strategy:
        1. Attempt exact match on `name`.
        2. Fallback to normalized lowercase match to handle minor
           formatting inconsistencies.

        Useful when industries come from:
        - job posting text
        - company profile data
        - parsed resume context
        """
        try:
            normalized = industry_name.lower().strip()

            return INDUSTRY_COLLECTION.find_one(
                {
                    "$or": [
                        {"name": industry_name},
                        {"name": normalized}
                    ]
                },
                {
                    "name": 1,
                    "embedding": 1,
                    "marketMetrics": 1,
                    "salaryBenchmarks": 1
                }
            )

        except Exception as e:
            logger.error(f"Error fetching industry embedding by name {industry_name}: {e}")
            return None


    @staticmethod
    def extract_metrics(industry_doc: dict) -> dict:
        """
        Flatten nested industry document into prediction-ready metrics.

        These metrics are used by the AI pipeline for:
        - salary prediction
        - job market analysis
        - demand estimation
        - skill trend analysis
        """
        if not industry_doc:
            return {}

        market = industry_doc.get("marketMetrics", {})
        salary = industry_doc.get("salaryBenchmarks", {})

        return {
            # Identity
            "name": industry_doc.get("name"),

            # Market signals
            "totalCompanies": market.get("totalCompanies", 0),
            "activeJobPostings": market.get("activeJobPostings", 0),
            "monthlyJobGrowth": market.get("monthlyJobGrowth", 0),
            "competitionLevel": market.get("competitionLevel", "Medium"),

            # Salary signals
            "overallMedianSalary": salary.get("overallMedian", 0),
            "salaryGrowthRate": salary.get("salaryGrowthRate", 0),
            "salaryBySeniority": salary.get("bySeniority", {}),

            # Skill demand signals
            "topSkills": [
                {
                    "name": s.get("skillName"),
                    "demandPercentage": s.get("demandPercentage", 0),
                    "salaryPremium": s.get("averageSalaryPremium", 0),
                    "growthRate": s.get("growthRate", 0),
                }
                for s in industry_doc.get("topSkills", [])
            ],

            # Trend indicators
            "emergingSkills": industry_doc.get("emergingSkills", []),
            "decliningSkills": industry_doc.get("decliningSkills", []),

            # Data reliability indicator
            "dataQuality": industry_doc.get("dataQuality", 0),
        }
    
    @staticmethod
    def get_industry_metrics_by_id(industry_id: str) -> Dict:
        if not industry_id:
            return {}

        try:
            doc = INDUSTRY_COLLECTION.find_one( 
                {"_id": ObjectId(industry_id)},
                {
                    "name": 1,
                    "marketMetrics": 1,
                    "salaryBenchmarks": 1,
                    "topSkills": 1,
                    "emergingSkills": 1,
                    "decliningSkills": 1,
                    "dataQuality": 1,
                }
            )

            return IndustryService.extract_metrics(doc)

        except Exception as e:
            logger.error(f"[IndustryMetrics] Failed fetch: {e}")
            return []