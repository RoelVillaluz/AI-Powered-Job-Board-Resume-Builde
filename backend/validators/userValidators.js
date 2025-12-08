import Joi from "joi";

export const userIdSchema = Joi.object({
    userId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
        'string.pattern.base': 'Invalid user ID format'
        })
})