import Joi from "joi";

export const createJobPostingSchema = Joi.object({
    title: Joi.string()
        .required()
        .messages({
            'string.empty': 'Job title is required'
        }),
    company: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid company ID format',
            'string.empty': 'Company is required'
        }),
    location: Joi.string()
        .required()
        .messages({
            'string.empty': 'Location is required'
        }),
    jobType: Joi.string()
        .valid('Full-Time', 'Part-Time', 'Contract', 'Internship')
        .required()
        .messages({
            'any.only': 'Job type must be one of: Full-Time, Part-Time, Contract, Internship',
            'string.empty': 'Job type is required'
        }),
    experienceLevel: Joi.string()
        .valid('Intern', 'Entry', 'Mid-Level', 'Senior')
        .optional()
        .messages({
            'any.only': 'Experience level must be one of: Intern, Entry, Mid-Level, Senior'
        }),
    salary: Joi.object({
        currency: Joi.string()
            .valid('$', '₱', '€', '¥', '£')
            .default('$')
            .messages({
                'any.only': 'Currency must be one of: $, ₱, €, ¥, £'
            }),
        amount: Joi.number()
            .min(0)
            .allow(null)
            .default(null)
            .messages({
                'number.min': 'Salary amount must be a positive number'
            }),
        frequency: Joi.string()
            .valid('hour', 'day', 'week', 'month', 'year')
            .default('year')
            .messages({
                'any.only': 'Frequency must be one of: hour, day, week, month, year'
            })
    }).optional(),
    requirements: Joi.array()
        .items(Joi.string().required())
        .required()
        .min(1)
        .messages({
            'array.min': 'Must have at least one requirement',
            'array.base': 'Requirements must be an array',
            'string.empty': 'Requirement cannot be empty'
        }),
    skills: Joi.array()
        .items(
            Joi.object({
                name: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'Skill name is required'
                    })
            })
        )
        .required()
        .min(1)
        .messages({
            'array.min': 'Must have at least one skill',
            'array.base': 'Job skills must be an array'
        }),
    preScreeningQuestions: Joi.array()
        .items(
            Joi.object({
                question: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'Question text is required'
                    }),
                required: Joi.boolean()
                    .default(false)
            })
        )
        .optional()
        .messages({
            'array.base': 'Pre-screening questions must be an array'
        })
});