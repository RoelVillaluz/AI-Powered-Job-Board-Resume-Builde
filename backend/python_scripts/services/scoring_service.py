"""Service for scoring resumes and calculating match percentages."""
from typing import NamedTuple, Optional
import logging

logger = logging.getLogger(__name__)


class ResumeScore(NamedTuple):
    """Container for resume scoring results."""
    completeness_score: float
    experience_score: float
    skills_score: float
    certification_score: float
    overall_score: float
    grade: str  # A+, A, B+, B, C+, C, D, F


class MatchScore(NamedTuple):
    """Container for resume-job match scoring."""
    match_percentage: float
    skill_match: float
    experience_match: float
    requirement_match: float
    recommendation_level: str  # "Excellent", "Good", "Fair", "Poor"
    matched_skills: list
    missing_skills: list
    strengths: list
    improvements: list


class ScoringService:
    """Handles scoring calculations for resumes and job matches."""
    
    # Score thresholds for grading
    GRADE_THRESHOLDS = {
        'A+': 95,
        'A': 90,
        'B+': 85,
        'B': 80,
        'C+': 75,
        'C': 70,
        'D': 60,
        'F': 0
    }
    
    @staticmethod
    def calculate_completeness_score(resume: dict) -> float:
        """
        Calculate how complete a resume is based on filled sections.
        
        Args:
            resume: Resume document dictionary
            
        Returns:
            Completeness score (0-100)
        """
        total_sections = 8
        completed_sections = 0
        
        # Check basic info
        if resume.get('firstName') and resume.get('lastName'):
            completed_sections += 1
        
        if resume.get('email'):
            completed_sections += 1
        
        if resume.get('phone'):
            completed_sections += 1
        
        # Check professional sections
        if resume.get('summary'):
            completed_sections += 1
        
        if resume.get('skills') and len(resume['skills']) > 0:
            completed_sections += 1
        
        if resume.get('workExperience') and len(resume['workExperience']) > 0:
            completed_sections += 1
        
        if resume.get('education') and len(resume['education']) > 0:
            completed_sections += 1
        
        if resume.get('certifications') and len(resume['certifications']) > 0:
            completed_sections += 1
        
        return (completed_sections / total_sections) * 100
    
    @staticmethod
    def calculate_experience_score(total_years: float, target_years: float = 5.0) -> float:
        """
        Calculate experience score based on years of experience.
        
        Args:
            total_years: Total years of work experience
            target_years: Target years for maximum score (default 5)
            
        Returns:
            Experience score (0-100)
        """
        if total_years >= target_years:
            return 100.0
        
        # Linear scaling up to target
        return (total_years / target_years) * 100
    
    @staticmethod
    def calculate_skills_score(resume: dict, min_skills: int = 5) -> float:
        """
        Calculate skills score based on number and diversity of skills.
        
        Args:
            resume: Resume document dictionary
            min_skills: Minimum number of skills for good score
            
        Returns:
            Skills score (0-100)
        """
        skills = resume.get('skills', [])
        num_skills = len(skills)
        
        if num_skills == 0:
            return 0.0
        
        # Base score on quantity
        quantity_score = min(100, (num_skills / min_skills) * 100)
        
        # Bonus for skill proficiency levels if available
        proficiency_bonus = 0
        for skill in skills:
            if skill.get('proficiency'):
                proficiency_bonus += 5
        
        total_score = min(100, quantity_score + proficiency_bonus)
        return total_score
    
    @staticmethod
    def calculate_certification_score(resume: dict) -> float:
        """
        Calculate certification score.
        
        Args:
            resume: Resume document dictionary
            
        Returns:
            Certification score (0-100)
        """
        certifications = resume.get('certifications', [])
        num_certs = len(certifications)
        
        if num_certs == 0:
            return 0.0
        
        # Each certification adds value, max out at 5
        return min(100, (num_certs / 5) * 100)
    
    @staticmethod
    def get_grade(score: float) -> str:
        """
        Convert numeric score to letter grade.
        
        Args:
            score: Numeric score (0-100)
            
        Returns:
            Letter grade
        """
        for grade, threshold in ScoringService.GRADE_THRESHOLDS.items():
            if score >= threshold:
                return grade
        return 'F'
    
    @staticmethod
    def calculate_resume_score(resume: dict, total_experience_years: float) -> ResumeScore:
        """
        Calculate overall resume score.
        
        Args:
            resume: Resume document dictionary
            total_experience_years: Total years of work experience
            
        Returns:
            ResumeScore with all component scores
        """
        completeness = ScoringService.calculate_completeness_score(resume)
        experience = ScoringService.calculate_experience_score(total_experience_years)
        skills = ScoringService.calculate_skills_score(resume)
        certifications = ScoringService.calculate_certification_score(resume)
        
        # Weighted overall score
        overall = (
            completeness * 0.25 +
            experience * 0.20 +
            skills * 0.40 +
            certifications * 0.15
        )
        
        grade = ScoringService.get_grade(overall)
        
        return ResumeScore(
            completeness_score=round(completeness, 2),
            experience_score=round(experience, 2),
            skills_score=round(skills, 2),
            certification_score=round(certifications, 2),
            overall_score=round(overall, 2),
            grade=grade
        )
    
    @staticmethod
    def get_recommendation_level(match_percentage: float) -> str:
        """
        Get recommendation level based on match percentage.
        
        Args:
            match_percentage: Match percentage (0-100)
            
        Returns:
            Recommendation level string
        """
        if match_percentage >= 80:
            return "Excellent Match"
        elif match_percentage >= 65:
            return "Good Match"
        elif match_percentage >= 50:
            return "Fair Match"
        else:
            return "Poor Match"
    
    @staticmethod
    def calculate_match_score(
        similarity_score,
        resume: Optional[dict] = None,
        job: Optional[dict] = None
    ) -> MatchScore:
        """
        Convert similarity scores to match percentages.
        
        This matches your compare_resume_to_job function.
        
        Args:
            similarity_score: SimilarityScore object
            resume: Optional resume document for detailed analysis
            job: Optional job document for detailed analysis
            
        Returns:
            MatchScore with percentage values and recommendation
        """
        # Convert 0-1 similarities to 0-100 percentages
        skill_match = similarity_score.skill_similarity * 100
        experience_match = similarity_score.experience_similarity * 100
        requirement_match = similarity_score.requirement_similarity * 100
        overall_match = similarity_score.total_score * 100
        
        recommendation = ScoringService.get_recommendation_level(overall_match)
        
        # Placeholder for detailed analysis (implement if resume and job are provided)
        matched_skills = []
        missing_skills = []
        strengths = []
        improvements = []
        
        if resume and job:
            # Analyze matched vs missing skills
            resume_skill_names = {skill.get('name', '').lower() for skill in resume.get('skills', [])}
            job_skill_names = {skill.get('name', '').lower() for skill in job.get('skills', [])}
            
            matched_skills = list(resume_skill_names & job_skill_names)
            missing_skills = list(job_skill_names - resume_skill_names)
            
            # Identify strengths
            if skill_match >= 70:
                strengths.append("Strong skills alignment")
            if experience_match >= 70:
                strengths.append("Relevant work experience")
            if requirement_match >= 70:
                strengths.append("Meets certification requirements")
            
            # Identify improvements
            if skill_match < 50:
                improvements.append("Develop more relevant technical skills")
            if experience_match < 50:
                improvements.append("Gain more experience in similar roles")
            if missing_skills:
                improvements.append(f"Consider learning: {', '.join(missing_skills[:3])}")
        
        return MatchScore(
            match_percentage=round(overall_match, 2),
            skill_match=round(skill_match, 2),
            experience_match=round(experience_match, 2),
            requirement_match=round(requirement_match, 2),
            recommendation_level=recommendation,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            strengths=strengths,
            improvements=improvements
        )