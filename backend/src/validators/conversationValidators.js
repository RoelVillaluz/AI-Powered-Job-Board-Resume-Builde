import Joi from "joi";

const LIMIT_DEFAULT = 10;
const LIMIT_MAX = 100

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(LIMIT_MAX).default(LIMIT_DEFAULT)
});

export const conversationIdSchema = Joi.object({
    conversationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid conversation ID format'
        })
})