import mongoose from "mongoose";

/**
 * Sanitize job posting data before saving to the database.
 * Converts empty string ObjectId fields to `undefined` and trims string fields.
 *
 * @param {Object} data - The raw job posting data.
 * @param {Object} [data.title] - Job title object, e.g., { _id: string, name: string }.
 * @param {Object} [data.location] - Job location object, e.g., { _id: string, name: string }.
 * @returns {Object} Sanitized job posting data.
 */
export const sanitizeJobData = (data: any) => {
    const sanitized: any = { ...data };

    // Convert empty string ObjectId fields to undefined
    if (sanitized.title && sanitized.title._id === '') {
        sanitized.title._id = undefined;
    }

    if (sanitized.location && sanitized.location._id === '') {
        sanitized.location._id = undefined;
    }

    if (Array.isArray(sanitized.skills)) {
        sanitized.skills = sanitized.skills.map((skill: any) => ({
            ...skill,
            _id: skill._id === '' ? undefined : skill._id,
            name: typeof skill.name === "string" ? skill.name.trim() : skill.name
        }));
    }

    // Add any other sanitization rules you need
    // Example: trim strings
    Object.keys(sanitized).forEach((key) => {
        if (typeof sanitized[key] === "string") {
        sanitized[key] = sanitized[key].trim();
        }
    });

    return sanitized
}