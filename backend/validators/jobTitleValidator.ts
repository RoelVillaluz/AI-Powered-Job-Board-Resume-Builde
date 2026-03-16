// validators/market/jobTitleValidator.ts
import Joi from "joi";
import { SENIORITY_LEVELS, INDUSTRY_CHOICES } from "../../shared/constants/jobsAndIndustries/constants";

export const jobTitleId = Joi.object({
  _id: Joi.string().hex().length(24).required()
});

export const createJobTitleSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least 2 characters',
            'string.max': 'Title must not exceed 100 characters',
            'any.required': 'Title is required'
        }),
    normalizedTitle: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Normalized title is required',
            'any.required': 'Normalized title is required'
        }),
    industry: Joi.string()
        .valid(...Object.keys(INDUSTRY_CHOICES))
        .required()
        .messages({
            'any.only': 'Invalid industry',
            'any.required': 'Industry is required'
        }),
    seniorityLevel: Joi.string()
        .valid(...SENIORITY_LEVELS)
        .required()
        .messages({
            'any.only': 'Invalid seniority level',
            'any.required': 'Seniority level is required'
        }),
    aliases: Joi.array()
        .items(Joi.string().trim())
        .default([])
});

export const updateJobTitleSchema = Joi.object({
    title: Joi.string().trim().min(2).max(100),
    normalizedTitle: Joi.string().trim().min(2).max(100),
    aliases: Joi.array().items(Joi.string().trim()),
    isActive: Joi.boolean()
}).min(1).messages({
    'object.min': 'At least one field must be provided to update'
});