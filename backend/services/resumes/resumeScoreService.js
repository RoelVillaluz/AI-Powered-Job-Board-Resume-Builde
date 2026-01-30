import { resumeScoringQueue } from "../../queues/index.js";
import { getResumeScoreRepo, createResumeScoreRepo } from "../../repositories/resumes/resumeScoreRepository.js"
import logger from "../../utils/logger.js";
import { runPython } from "../../utils/pythonRunner.js";

/**
 * Main service function called by controller
 * 
 * Handles ALL business logic:
 * - Cache checking
 * - Queue decision
 * - Response formatting
 * 
 * Returns either:
 * - { cached: true, data: scoreObject } - Immediate result
 * - { cached: false, jobId: "123" } - Queued for processing
 */
export const getOrGenerateResumeScoreService = async (resumeId) => {
    // Check cache first
    const cachedResult = getResumeScoreService(resumeId);

    if (cachedResult.cache) {
        return {
            data: cachedResult.data,
            cached: true
        }
    }

    // Cache miss - queue the calculation
    logger.info(`Queueing score generation for resume: ${resumeId}`);

    const job = await resumeScoringQueue.add('calculate-score', {
        resumeId,
        invalidateCache: false
    }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 60000
    })

    // Return job info for polling
    return {
        cached: false,
        jobId: job.id
    };
}

/**
 * Calculate score using Python and save to database
 * (Business logic - can be called from queue or direct)
 */
export const getResumeScoreService = async (resumeId) => {
    const cachedScore = await getResumeScoreRepo(resumeId);
    
    if (cachedScore) {
        const daysSinceCalculation = 
            (Date.now() - new Date(cachedScore.calculatedAt).getTime()) / 
            (1000 * 60 * 60 * 24);
        
        if (daysSinceCalculation < 7) {
            logger.info(`Cache hit for resume score: ${resumeId}`);
            return { cached: true, data: cachedScore };
        }
    }
    
    logger.info(`Cache miss for resume score: ${resumeId}`);
    return { cached: false, data: null };
};

/**
 * Calculate score using Python and save to database
 * (Business logic - can be called from queue or direct)
 */
export const generateResumeScoreService = async (resumeId, job = null) => {
    try {
        await job?.updateProgress(10);

        logger.info(`Calculating score for resume: ${resumeId}`);

        // Call Python
        await job?.updateProgress(30);
        const pythonResponse = await runPython('score_resume', [resumeId]);

        await job?.updateProgress(70);
        
        if (pythonResponse.error) {
            throw new Error(pythonResponse.error);
        }
        
        // Save to database
        const scoreData = {
            resume: resumeId,
            completenessScore: pythonResponse.breakdown?.completeness || 0,
            experienceScore: pythonResponse.breakdown?.experience || 0,
            skillsScore: pythonResponse.breakdown?.skills || 0,  
            certificationScore: pythonResponse.breakdown?.certifications || 0,
            totalScore: pythonResponse.overall_score || 0,
            estimatedExperienceYears: pythonResponse.total_experience_years || 0,
            strengths: pythonResponse.strengths || [],
            improvements: pythonResponse.improvements || [],
            recommendations: pythonResponse.recommendations || [],
            calculatedAt: new Date()
        };
        
        const existing = await getResumeScoreRepo(resumeId);
        
        let savedScore;
        if (existing) {
            Object.assign(existing, scoreData);
            savedScore = await existing.save();
        } else {
            savedScore = await createResumeScoreRepo(scoreData);
        }
        
        await job?.updateProgress(100);
        
        logger.info(`Score calculated successfully for resume: ${resumeId}`);
        
        return { cached: false, data: savedScore };
    } catch (error) {
        logger.error(`Error calculating score for resume ${resumeId}:`, error);
        throw error;
    }
}