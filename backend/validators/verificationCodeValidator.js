import Joi from "joi";

export const verificationSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: false } })  // Allow all TLDs
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    
    verificationCode: Joi.string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            'string.length': 'Verification code must be exactly 6 digits',
            'string.pattern.base': 'Verification code must contain only numbers',
            'any.required': 'Verification code is required'
        }),
    
    verificationType: Joi.string()
        .valid('register', 'password_reset')
        .required()
        .messages({
            'any.only': 'Invalid verification type. Must be "register" or "password_reset"',
            'any.required': 'Verification type is required'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});