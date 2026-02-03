"""Date and time utilities."""
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def parse_date(date_string: Optional[str]) -> Optional[datetime]:
    """
    Parse ISO date string to datetime object.
    
    Args:
        date_string: ISO format date string or None
        
    Returns:
        datetime object or None if parsing fails
    """
    if not date_string:
        return None
    
    try:
        return datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        try:
            # Try without milliseconds
            return datetime.strptime(date_string, "%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            logger.warning(f"Could not parse date: {date_string}")
            return None


def calculate_years_between(start_date: datetime, end_date: Optional[datetime] = None) -> float:
    """
    Calculate years between two dates.
    
    Args:
        start_date: Start datetime
        end_date: End datetime (defaults to now if None)
        
    Returns:
        Number of years as float
    """
    if end_date is None:
        end_date = datetime.now()
    
    days_diff = (end_date - start_date).days
    years = days_diff / 365.25
    
    return max(0.0, years)

def calculate_total_experience(work_experiences: list[dict]) -> float:
    """
        Calculate total years of work experience from list of work entries.
        
        Args:
            work_experiences: List of work experience dictionaries
            
        Returns:
            Total years of experience
    """
    total_years = 0.0

    for exp in work_experiences:
        try:
            start_date = parse_date(exp.get('startDate'))
            if not start_date:
                continue

            # Handle "present" or missing end dates
            end_date_raw = exp.get('endDate')
            if end_date_raw and end_date_raw.lower() != 'present':
                end_date = parse_date(end_date_raw)
            else:
                end_date = None

            years = calculate_years_between(start_date, end_date)
            total_years += years
        except Exception as e:
            logger.warning(f"Error calculating experience for entry: {e}")
            continue

    return total_years