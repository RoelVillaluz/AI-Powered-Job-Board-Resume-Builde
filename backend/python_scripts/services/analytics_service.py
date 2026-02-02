"""Service for analytics and insights generation."""
from typing import List, Dict, NamedTuple
from collections import Counter
import logging
from config.database import db
from services.resume_service import ResumeService
from services.scoring_service import ScoringService
from clustering.job_clustering import JobClusteringService
from services.job_service import JobService
import numpy as np

logger = logging.getLogger(__name__)


class ResumeInsights(NamedTuple):
    """Container for resume analysis insights."""
    overall_score: float
    grade: str
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]
    skill_gaps: List[str]
    overall_message: str


class MarketInsights(NamedTuple):
    """Container for job market insights."""
    top_skills: List[tuple]  # (skill_name, frequency)
    top_locations: List[tuple]  # (location, count)
    experience_levels: Dict[str, int]
    avg_requirements_count: float
    trending_roles: List[str]


class AnalyticsService:
    """Handles analytics and insights generation."""
    
    @staticmethod
    def analyze_resume(user_id: str, resume_id: str) -> ResumeInsights:
        """
        Generate comprehensive insights for a resume.
        
        Args:
            user_id: User ID
            resume_id: Resume ID
            
        Returns:
            ResumeInsights with analysis results
        """
        try:
            # Get resume
            resume = ResumeService.get_by_id(resume_id)
            if not resume:
                logger.error(f"Resume {resume_id} not found")
                return None
            
            # Extract embeddings and calculate scores
            resume_embeddings = ResumeService.extract_embeddings(resume)
            resume_score = ScoringService.calculate_resume_score(
                resume,
                resume_embeddings.total_experience_years
            )
            
            # Identify strengths and weaknesses
            strengths = []
            weaknesses = []
            suggestions = []
            
            # Analyze completeness
            if resume_score.completeness_score >= 90:
                strengths.append("Comprehensive resume with all sections filled")
            elif resume_score.completeness_score < 70:
                weaknesses.append("Missing important resume sections")
                suggestions.append("Complete all resume sections for better visibility")
            
            # Analyze experience
            if resume_score.experience_score >= 80:
                strengths.append(f"Strong work experience ({resume_embeddings.total_experience_years:.1f} years)")
            elif resume_score.experience_score < 50:
                weaknesses.append("Limited work experience")
                suggestions.append("Highlight internships, projects, or volunteer work")
            
            # Analyze skills
            num_skills = len(resume.get('skills', []))
            if resume_score.skills_score >= 80:
                strengths.append(f"Diverse skill set ({num_skills} skills listed)")
            elif resume_score.skills_score < 60:
                weaknesses.append("Limited skills listed")
                suggestions.append("Add more relevant technical and soft skills")
            
            # Analyze certifications
            num_certs = len(resume.get('certifications', []))
            if num_certs >= 3:
                strengths.append(f"Strong certifications ({num_certs} listed)")
            elif num_certs == 0:
                suggestions.append("Consider adding relevant certifications to strengthen your profile")
            
            # Identify skill gaps based on market demand
            skill_gaps = AnalyticsService._identify_skill_gaps(resume)

            overall_message = AnalyticsService.get_overall_message(resume_score.overall_score)
            
            return ResumeInsights(
                overall_score=resume_score.overall_score,
                grade=resume_score.grade,
                strengths=strengths,
                weaknesses=weaknesses,
                improvement_suggestions=suggestions,
                skill_gaps=skill_gaps[:5],  # Top 5 gaps
                overall_message=overall_message
            )
            
        except Exception as e:
            logger.error(f"Error analyzing resume: {e}")
            return None
        
    def get_overall_message(score: float) -> str:
        if score >= 95:  # A+
            return "Nearly flawless resume that clearly communicates strong qualifications and is highly competitive in the job market."
        elif score >= 90:  # A
            return "Excellent resume with strong structure and content, needing only minor refinements to reach top-tier quality."
        elif score >= 85:  # B+
            return "Very strong resume with clear strengths, but a few targeted improvements could increase its impact."
        elif score >= 80:  # B
            return "Good resume with a solid foundation, though some sections would benefit from more detail and clarity."
        elif score >= 75:  # C+
            return "Above-average resume that is well organized but lacks depth in key areas."
        elif score >= 65:  # C
            return "Average resume that meets basic expectations but does not yet stand out to recruiters."
        elif score >= 50:  # D
            return "Below-average resume that needs clearer experience, stronger skills presentation, and better completeness."
        else:  # F
            return "Resume requires significant improvement and is missing critical information needed for effective evaluation."

    @staticmethod
    def _identify_skill_gaps(resume: dict, top_n: int = 10) -> List[str]:
        """
        Identify skills that are in demand but missing from resume.
        
        Args:
            resume: Resume document
            top_n: Number of top skills to check
            
        Returns:
            List of missing in-demand skills
        """
        try:
            # Get user's current skills
            user_skills = set(skill['name'].lower() for skill in resume.get('skills', []))
            
            # Get top skills from active job postings
            jobs = list(db.job_postings.find({"status": "active"}).limit(200))
            
            all_job_skills = []
            for job in jobs:
                job_skills = [skill['name'].lower() for skill in job.get('skills', [])]
                all_job_skills.extend(job_skills)
            
            # Count skill frequency
            skill_counts = Counter(all_job_skills)
            top_market_skills = skill_counts.most_common(top_n * 2)
            
            # Find gaps
            gaps = []
            for skill, count in top_market_skills:
                if skill not in user_skills and len(gaps) < top_n:
                    gaps.append(skill.title())
            
            return gaps
            
        except Exception as e:
            logger.error(f"Error identifying skill gaps: {e}")
            return []
    
    @staticmethod
    def get_market_insights(limit: int = 500) -> MarketInsights:
        """
        Generate job market insights from active postings.
        
        Args:
            limit: Number of job postings to analyze
            
        Returns:
            MarketInsights with market analysis
        """
        try:
            # Fetch active jobs
            jobs = list(db.job_postings.find({"status": "active"}).limit(limit))
            
            if not jobs:
                logger.warning("No active jobs found for market analysis")
                return None
            
            # Collect data
            all_skills = []
            all_locations = []
            experience_levels = []
            requirements_counts = []
            job_titles = []
            
            for job in jobs:
                # Skills
                job_skills = [skill['name'] for skill in job.get('skills', [])]
                all_skills.extend(job_skills)
                
                # Location
                if job.get('location'):
                    all_locations.append(job['location'])
                
                # Experience level
                if job.get('experienceLevel'):
                    experience_levels.append(job['experienceLevel'])
                
                # Requirements count
                requirements_counts.append(len(job.get('requirements', [])))
                
                # Job title
                if job.get('title'):
                    job_titles.append(job['title'])
            
            # Analyze data
            top_skills = Counter(all_skills).most_common(10)
            top_locations = Counter(all_locations).most_common(10)
            exp_level_dist = dict(Counter(experience_levels))
            avg_requirements = np.mean(requirements_counts) if requirements_counts else 0
            
            # Extract trending roles (most common job titles)
            title_counter = Counter(job_titles)
            trending_roles = [title for title, _ in title_counter.most_common(5)]
            
            return MarketInsights(
                top_skills=top_skills,
                top_locations=top_locations,
                experience_levels=exp_level_dist,
                avg_requirements_count=round(avg_requirements, 2),
                trending_roles=trending_roles
            )
            
        except Exception as e:
            logger.error(f"Error generating market insights: {e}")
            return None
    
    @staticmethod
    def cluster_and_analyze_jobs(limit: int = 200, num_clusters: int = 5) -> Dict:
        """
        Cluster jobs and provide insights on each cluster.
        
        Args:
            limit: Number of jobs to cluster
            num_clusters: Number of clusters to create
            
        Returns:
            Dictionary with clustering results and insights
        """
        try:
            # Fetch jobs
            jobs = list(db.job_postings.find({"status": "active"}).limit(limit))
            
            if len(jobs) < num_clusters:
                logger.warning(f"Not enough jobs ({len(jobs)}) for {num_clusters} clusters")
                return None
            
            # Extract embeddings (use title + skills + requirements combined)
            job_embeddings = []
            job_metadata = []
            
            for job in jobs:
                embeddings = JobService.extract_embeddings(job)
                
                # Combine embeddings (title + skills + requirements)
                combined_parts = []
                if embeddings.title is not None:
                    combined_parts.append(embeddings.title)
                if embeddings.skills is not None:
                    combined_parts.append(embeddings.skills)
                if embeddings.requirements is not None:
                    combined_parts.append(embeddings.requirements)
                
                if combined_parts:
                    import torch
                    combined = torch.mean(torch.stack(combined_parts), dim=0)
                    job_embeddings.append(combined.numpy())
                    job_metadata.append({
                        'id': str(job['_id']),
                        'title': job.get('title', 'Unknown'),
                        'company': job.get('company', 'Unknown'),
                        'location': job.get('location', 'Unknown')
                    })
            
            # Cluster
            cluster_result = JobClusteringService.cluster_jobs(
                job_embeddings,
                num_clusters=num_clusters
            )
            
            if not cluster_result:
                return None
            
            # Analyze each cluster
            cluster_insights = {}
            for cluster_id in range(num_clusters):
                cluster_jobs = [
                    job_metadata[i] for i, label in enumerate(cluster_result.labels)
                    if label == cluster_id
                ]
                
                cluster_insights[f"Cluster {cluster_id + 1}"] = {
                    'size': len(cluster_jobs),
                    'sample_jobs': cluster_jobs[:5],  # Top 5 jobs
                    'common_titles': list(set(job['title'] for job in cluster_jobs[:10]))
                }
            
            return {
                'num_clusters': num_clusters,
                'total_jobs': len(jobs),
                'cluster_insights': cluster_insights,
                'inertia': cluster_result.inertia
            }
            
        except Exception as e:
            logger.error(f"Error clustering jobs: {e}")
            return None