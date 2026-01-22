import Joi from "joi";

export const createResumeSchema = new Joi.object({
    firstName: Joi.string()
        .required()
        .min(2)
        .messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 2 letters long'
        }),
    lastName: Joi.string()
        .required()
        .min(2)
        .messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 2 letters long'
        }),
    phone: Joi.string()
        .pattern(/^\+?[0-9]{7,15}$/)
        .messages({
            'string.pattern.base': 'Phone number must contain only digits and may start with +'
        }),
    address: Joi.string()
        .required()
        .messages({
            'string.empty': 'Address is required'
        }),
    summary: Joi.string()
        .required()
        .messages({
            'string.empty': 'Resume summary is required'
        }),
    skills: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().required(),
                level: Joi.string().trim()
            })
        )
        .min(3)
        .required()
        .messages({
            'array.min': 'Resume must contain at least 3 skills'
        }),
    workExperience: Joi.array().items(
        Joi.object({
            jobTitle: Joi.string().trim().required(),
            company: Joi.string().trim().required(),
            startDate: Joi.date().required(),
            endDate: Joi.date().allow(null),
            responsibilities: Joi.array().items(Joi.string().trim()).min(1)
            })
        ),
    certifications: Joi.array().items(
        Joi.object({
            name: Joi.string().trim().required(),
            year: Joi.string()
                .pattern(/^\d{4}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Year must be a valid 4-digit year'
                })
            })
        ),
    socialMedia: Joi.object({
        facebook: Joi.string().uri().allow(null, ''),
        linkedin: Joi.string().uri().allow(null, ''),
        github: Joi.string().uri().allow(null, ''),
        website: Joi.string().uri().allow(null, '')
    })
})