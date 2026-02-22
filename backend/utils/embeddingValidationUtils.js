/**
 * Validates that resume embeddings are actually usable
 * Checks for null, empty arrays, or arrays of zeros
 */
const isValidEmbedding = (embedding) => {
    if (!embedding || !Array.isArray(embedding)) {
        return false;
    }

    if (embedding.length === 0) {
        return false;
    }

    // Check if all values are zero (failed generation)
    const allZeroes = embedding.every(val => val === 0);
    if (allZeroes) {
        return false;
    }

    // Check if contains any NaN or Infinity
    const hasInvalidValues = embedding.some(val => !isFinite(val) || isNaN(val));

    if (hasInvalidValues) {
        return false;
    }

    return true
}

/**
 * Validates that resume embeddings object has all required valid embeddings
 */
export const validateResumeEmbeddings = (embeddings) => {
    let errors = [];
    let warnings = [];

    // Check structure exists
    if (!embeddings) {
        errors.push('Embedding object is null or undefined.');
        return { valid: false, errors, warnings }
    }

    // Check if mean embeddings have been calculated already
    if (!embeddings.meanEmbeddings) {
        errors.push('meanEmbeddings field is missing');
        return { valid: false, errors, warnings };
    }

    const { skills, workExperience, certifications } = embeddings.meanEmbeddings;

    // Validate each embedding type
    const validations = {
        skills: isValidEmbedding(skills),
        workExperience: isValidEmbedding(workExperience),
        certifications: isValidEmbedding(certifications)
    }

    // Check if at least one is valid
    const hasAtLeastOne = Object.values(validations).some(v => v);

    if (!hasAtLeastOne) {
        errors.push('No valid embeddings found for any section');
        return { valid: false, errors, warnings };
    }

    // Warnings for missing but non-critical sections
    if (!validations.workExperience) {
        warnings.push('Work experience embedding is invalid or missing')
    }

    if (!validations.certifications) {
        warnings.push('Certification embeddings is invalid or missing')
    }

    return {
        valid: true,
        errors: [],
        warnings,
        validSections: Object.entries(validations)
            .filter(([_, isValid]) => isValid)
            .map(([section]) => section)
    }
}