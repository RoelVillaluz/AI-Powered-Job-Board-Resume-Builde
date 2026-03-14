import Joi from "joi";

export const createSkillSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Skill name is required',
            'string.min': 'Skill name must be at least 1 character',
            'string.max': 'Skill name must not exceed 100 characters',
            'any.required': 'Skill name is required'
        })
});

export const updateSkillSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'Skill name cannot be empty',
            'string.min': 'Skill name must be at least 1 character',
            'string.max': 'Skill name must not exceed 100 characters',
        })
}).min(1).messages({
    // Reject empty update payload — must provide at least one field
    'object.min': 'At least one field must be provided to update'
});