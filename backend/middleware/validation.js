import { ValidationError } from "./errorHandler.js";

/**
 * Validation middleware factory
 *
 * @param {import('joi').Schema} schema - Joi validation schema
 * @param {'body'|'params'|'query'} [property='body'] - Request property to validate
 * @returns {import('express').RequestHandler} Express middleware
 *
 * @example
 * router.post('/users', validate(createUserSchema, 'body'), UserController.createUser)
 */
export const validate = (schema, property = 'body') => {
    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details.map(d => d.message).join(', ');
            throw new ValidationError(errorMessage);
        }

        req[property] = value;
        next();
    };
};