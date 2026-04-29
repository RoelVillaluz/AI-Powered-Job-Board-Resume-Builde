import Joi from "joi";

// Reusable ObjectId validator
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null, '');

export const objectIdStrict = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    "string.pattern.base": "Invalid ID format",
  });

export const resumeIdSchema = Joi.object({
  resumeId: objectIdStrict.required(),
});

export const createResumeSchema = new Joi.object({
    jobTitle: Joi.object({
        _id: objectId.optional().messages({
          "string.pattern.base": "Invalid job title ID format",
        }),
        name: Joi.string().trim().required().messages({
          "string.empty": "Job title is required",
        }),
    }).required(),
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
    location: Joi.object({
        _id: objectId.optional().messages({
          "string.pattern.base": "Invalid location ID format",
        }),
        name: Joi.string().trim().required().messages({
          "string.empty": "Location is required",
        }),
    }).required(),
    summary: Joi.string()
        .required()
        .messages({
            'string.empty': 'Resume summary is required'
        }),
    skills: Joi.array()
        .items(
            Joi.object({
                _id: objectId.optional().messages({
                    "string.pattern.base": "Invalid skill ID format",
                }),
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