"""Service for user-related operations."""
from typing import Optional, NamedTuple
from bson import ObjectId
import logging
from config.database import db

logger = logging.getLogger(__name__)


class UserInteractions(NamedTuple):
    """Container for user job interactions."""
    saved_jobs: list[ObjectId]
    applied_jobs: list[ObjectId]

class UserService:
    """Handles user data retrieval and processing."""

    @staticmethod
    def get_interacted_jobs(user_id: str) -> UserInteractions:
        """
        Fetch all jobs that a user has saved or applied to.
        
        Args:
            user_id: User ObjectId as string
            
        Returns:
            UserInteractions containing saved and applied job IDs
        """
        if not user_id:
            return UserInteractions(saved_jobs=[], applied_jobs=[])
        
        try:
            # Fetch user data
            user_data = db.users.find_one({"_id": ObjectId(user_id)})
            
            # Get saved jobs
            saved_jobs = []
            if user_data:
                saved_jobs = user_data.get('savedJobs', [])
            
            # Get applied jobs from applications collection
            applied_jobs = []
            applications = db.applications.find({"applicant": ObjectId(user_id)})
            applied_jobs = [app['jobPosting'] for app in applications if 'jobPosting' in app]
            
            return UserInteractions(
                saved_jobs=saved_jobs,
                applied_jobs=applied_jobs
            )
            
        except Exception as e:
            logger.error(f"Error fetching interacted jobs for user {user_id}: {e}")
            return UserInteractions(saved_jobs=[], applied_jobs=[])