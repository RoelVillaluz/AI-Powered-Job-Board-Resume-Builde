import Joi from "joi";

export const createLocationSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Location name is required',
            'string.min': 'Location name must be at least 2 characters',
            'string.max': 'Location name must not exceed 100 characters',
            'any.required': 'Location name is required'
        }),
})