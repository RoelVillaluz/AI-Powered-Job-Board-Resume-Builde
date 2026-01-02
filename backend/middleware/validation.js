import { ValidationError } from "./errorHandler.js";

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        // Validate the request property against the schema
        const { error, value } = schema.validate(req[property], { 
            abortEarly: false,  // Collect all errors, not just the first
            stripUnknown: true  // Remove unknown fields
        });
        
        if (error) {
            // Extract and format error messages
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            
            // Throw BadRequestError which should have statusCode 400
            throw new ValidationError(errorMessage);
        }
        
        // Replace the property with the validated value (sanitized)
        req[property] = value;
        
        next();
    };
};