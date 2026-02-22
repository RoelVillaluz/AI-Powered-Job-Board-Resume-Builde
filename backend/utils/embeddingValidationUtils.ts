import { EmbeddingValidationReturn, EmbeddingVector, ResumeEmbeddings } from "../types/embeddings.types";

/**
 * Validates that a single embedding vector is usable.
 * Rejects null/undefined, empty arrays, all-zero arrays, and arrays with NaN/Infinity.
 *
 * @param {EmbeddingVector | undefined | null} embedding - The embedding vector to validate
 * @returns {boolean} Whether the embedding is valid and usable
 */
const isValidEmbedding = (embedding: EmbeddingVector | undefined | null): boolean => {
    if (!embedding || embedding.length === 0) return false;

    const allZeroes = embedding.every(val => val === 0);
    if (allZeroes) return false;

    const hasInvalidValues = embedding.some(val => !isFinite(val) || isNaN(val));
    if (hasInvalidValues) return false;

    return true;
};

/**
 * Validates that a resume embeddings document has all required valid embedding vectors.
 *
 * - `skills` is required — errors if missing or invalid
 * - `workExperience` and `certifications` are optional — warns if missing or invalid
 * - At least one valid embedding must exist for the document to be considered valid
 *
 * @param {ResumeEmbeddings} embeddings - The resume embeddings document from the database
 * @returns {EmbeddingValidationReturn} Validation result with errors, warnings, and valid sections
 */
export const validateResumeEmbeddings = (embeddings: ResumeEmbeddings): EmbeddingValidationReturn => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!embeddings.meanEmbeddings) {
        errors.push('meanEmbeddings field is missing');
        return { valid: false, errors, warnings };
    }

    const { skills, workExperience, certifications } = embeddings.meanEmbeddings;

    const validations = {
        skills: isValidEmbedding(skills),
        workExperience: isValidEmbedding(workExperience),
        certifications: isValidEmbedding(certifications),
    };

    const hasAtLeastOne = Object.values(validations).some(v => v);
    if (!hasAtLeastOne) {
        errors.push('No valid embeddings found for any section');
        return { valid: false, errors, warnings };
    }

    if (!validations.workExperience) warnings.push('Work experience embedding is invalid or missing');
    if (!validations.certifications) warnings.push('Certification embedding is invalid or missing');

    return {
        valid: true,
        errors: [],
        warnings,
        validSections: Object.entries(validations)
            .filter(([_, isValid]) => isValid)
            .map(([section]) => section),
    };
};