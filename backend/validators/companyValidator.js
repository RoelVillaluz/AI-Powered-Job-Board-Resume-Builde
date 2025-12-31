import Joi from "joi";
import { INDUSTRY_CHOICES } from "../constants.js";

const allowedIndustries = Object.keys(INDUSTRY_CHOICES);

export const createCompanySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .required()
        .messages({
            'string.min': 'Company name must be at least 2 characters',
            'string.empty': 'Company name is required'
    }),
        industry: Joi.array()
        .items(
            Joi.string()
            .valid(...allowedIndustries)
            .required()
            .messages({
                'any.only': 'Industry must be a valid option',
                'string.empty': 'Industry cannot be empty'
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'Company must have at least one industry',
            'array.base': 'Industries must be an array'
    }),
    location: Joi.string()
        .trim()
        .min(2)
        .required()
        .messages({
            'string.min': 'Location must be at least 2 characters long',
            'string.empty': 'Location cannot be empty'
    }),
    website: Joi.string()
        .uri()
        .allow('')
        .messages({
            'string.uri': 'Website must be a valid URL'
    }),
    size: Joi.number()
        .integer()
        .min(1)
        .messages({
            'number.base': 'Size must be a number',
            'number.integer': 'Size must be an integer',
            'number.min': 'Size must be at least 1'
    }),
    description: Joi.string()
        .trim()
        .min(10)
        .required()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.empty': 'Description is required'
    }),
    logo: Joi.string()
        .uri()
        .allow('')
        .messages({
            'string.uri': 'Logo must be a valid URL'
    }),
    banner: Joi.string()
        .uri()
        .allow('')
        .messages({
            'string.uri': 'Banner must be a valid URL'
    }),
    images: Joi.array()
        .items(Joi.string().uri().messages({ 'string.uri': 'Each image must be a valid URL' }))
        .messages({
        'array.base': 'Images must be an array'
    }),
    ceo: Joi.object({
        name: Joi.string().trim().allow(''),
        image: Joi.string().uri().allow('')
    }).messages({
        'object.base': 'CEO must be an object'
    }),
    jobs: Joi.array()
        .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
            'string.pattern.base': 'Job ID must be a valid Mongo ID'
        }))
        .messages({
            'array.base': 'Jobs must be an array'
    }),
    rating: Joi.number()
        .min(0)
        .max(5)
        .messages({
            'number.base': 'Rating must be a number',
            'number.min': 'Rating cannot be negative',
            'number.max': 'Rating cannot exceed 5'
    })
});