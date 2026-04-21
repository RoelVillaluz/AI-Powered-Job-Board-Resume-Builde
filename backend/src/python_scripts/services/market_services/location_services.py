""" Service for location-related operations """

from typing import Optional
from backend.src.python_scripts.config.database import db
from bson import ObjectId
import torch
import logging

logger = logging.getLogger(__name__)

class LocationService:

    @staticmethod
    def get_location_by_id(location_id: str) -> Optional[dict]:
        """ Single location fetch """
        try:
            location = db.locations.find_one(
                {'_id': ObjectId(location_id)},
                {
                    'name': 1,
                    'salaryData': 1,
                    'baselineFactor': 1,
                    'costOfLivingIndex': 1,
                    'demandMetrics': 1,
                }
            )

            return location
        except Exception as e:
            logger.error(f'Error fetching location: {location_id}: {e}')
            return None
    
    @staticmethod
    def get_location_by_name(location_name: str) -> Optional[dict]:
        """ Fallback method if no ObjectId reference exists yet. """
        try:
            location = db.locations.find_one(
                {'name': location_name},
                {
                    'name': 1,
                    'salaryData': 1,
                    'baselineFactor': 1,
                    'costOfLivingIndex': 1,
                    'demandMetrics': 1,
                }
            )

            return location
        except Exception as e:
            logger.error(f'Error fetching location: {location_name}: {e}')
            return None

    @staticmethod
    def extract_metrics(location_doc: dict) -> Optional[dict]:
        """Flatten location doc into prediction-ready metrics."""

        if not location_doc:
            return {}

        salary = location_doc.get('salaryData', {})
        salary_range = salary.get('salaryRange', {})
        demand = location_doc.get('demandMetrics', {})

        return {
            # Identity
            'name': location_doc.get('name'),

            # Salary signals
            'averageSalary': salary.get('averageSalary', 0),
            'medianSalary': salary.get('medianSalary', 0),
            'currency': salary.get('currency', '$'),
            'salaryRange': {
                'min': salary_range.get('min', 0),
                'max': salary_range.get('max', 0),
                'p25': salary_range.get('p25', 0),
                'p75': salary_range.get('p75', 0),
            },

            # Location normalization factor
            'baselineFactor': location_doc.get('baselineFactor', 0),

            # Demand signals
            'totalPostings': demand.get('totalPostings', 0),
            'growthRate': demand.get('growthRate', 0),
        }
    
    @staticmethod
    def get_with_embedding_by_id(location_id: str) -> Optional[dict]:
        try:
            return db.locations.find_one(
                {"_id": ObjectId(location_id)},
                {
                    "name": 1,
                    "embedding": 1
                },
                collation={"locale": "en", "strength": 2}  # ✅ passed as parameter
            )
        except Exception as e:
            logger.error(f"Error fetching location embedding by id {location_id}: {e}")
            return None
        
    @staticmethod
    def get_with_embedding_by_name(location_name: str) -> Optional[dict]:
        try:
            return db.locations.find_one(
                {"name": location_name},
                {
                    "name": 1,
                    "embedding": 1
                },
                collation={"locale": "en", "strength": 2}  # ✅ passed as parameter
            )
        except Exception as e:
            logger.error(f"Error fetching location embedding by name {location_name}: {e}")
            return None