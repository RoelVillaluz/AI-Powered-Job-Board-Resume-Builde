import { ResumeScoreDoc, ResumeScoreValidationReturn } from "../types/scores.types.js";

/**
 * Validates that a single score field is usable.
 * Rejects null/undefined, non-finite numbers, and zero values.
 *
 * @param {number | null | undefined} score - The score value to validate
 * @returns {{ isValid: boolean, message?: string }} Validation result with optional failure reason
 */
const isValidScore = (score: number | null | undefined): { isValid: boolean; message?: string } => {
    if (score === null || score === undefined) {
        return { 
            isValid: false, 
            message: 'Score is null or undefined' 
        };
    }

    if (!Number.isFinite(score)) {
        return { 
            isValid: false, 
            message: 'Score must be a finite number' 
        };
    }

    if (score === 0) {
        return { 
            isValid: false, 
            message: 'Score must not be zero' 
        };
    }
    return { isValid: true };
};

/**
 * Validates that a resume score document has meaningful calculated values.
 *
 * Required fields (errors if invalid):
 * - `totalScore` — overall score, must be non-zero
 * - `completenessScore` — resume completeness, must be non-zero
 * - `skillsScore` — required since all resumes must have skills listed
 *
 * Optional fields (warns if missing):
 * - `experienceScore` — can legitimately be 0 for entry-level candidates
 * - `certificationScore` — can legitimately be 0 for uncertified candidates
 *
 * @param {ResumeScoreDoc} scoreDoc - The resume score document from the database
 * @returns {ScoreValidationReturn} Validation result with errors and warnings
 */
export const validateResumeScore = (scoreDoc: ResumeScoreDoc): ResumeScoreValidationReturn => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!scoreDoc) {
        errors.push('Score document is null or undefined');
        return { valid: false, errors, warnings };
    }

    if (!scoreDoc.calculatedAt) {
        errors.push('Score has never been calculated');
        return { valid: false, errors, warnings };
    }

    const { completenessScore, experienceScore, skillsScore, certificationScore, totalScore } = scoreDoc;

    const totalValidation = isValidScore(totalScore);
    if (!totalValidation.isValid) {
        errors.push(`totalScore invalid: ${totalValidation.message}`);
    }

    const completenessValidation = isValidScore(completenessScore);
    if (!completenessValidation.isValid) {
        errors.push(`completenessScore invalid: ${completenessValidation.message}`);
    }

    const skillsValidation = isValidScore(skillsScore);
    if (!skillsValidation.isValid) {
        errors.push(`skillsScore invalid: ${skillsValidation.message}`);
    }

    if (experienceScore === null || experienceScore === undefined) {
        warnings.push('experienceScore is missing');
    }
    if (certificationScore === null || certificationScore === undefined) {
        warnings.push('certificationScore is missing');
    }

    if (errors.length > 0) {
        return { 
            valid: false, 
            errors, 
            warnings 
        };
    }

    return { valid: true, errors: [], warnings };
};