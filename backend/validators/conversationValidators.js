import Joi from "joi";

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

export const conversationIdSchema = Joi.object({
    conversationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid conversation ID format'
        })
})