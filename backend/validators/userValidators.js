import Joi from "joi";

export const userIdSchema = Joi.object({
    userId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
        'string.pattern.base': 'Invalid user ID format'
        })
})

export const registerUserSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'First name is required',
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name cannot exceed 50 characters'
        }),
    lastName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Last name is required',
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name cannot exceed 50 characters'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is rquired',
            'string.pattern.base': 'Invalid email format'
        }),
    password: Joi.string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .message({
            'string.pattern.base': 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
            'string.empty': 'Password cannot be empty'
        })
})

export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.pattern.base': 'Invalid email format',
            'string.empty': 'Email is required'
        }),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required'
        })
})

export const verificationCodeSchema = Joi.object({
    verificationCode: Joi.string()
        .length(6)
        .required()
        .messages({
            'string.length': 'Verification code must be 6 numbers long',
            'string.empty': 'Verification code is required'
        })
})