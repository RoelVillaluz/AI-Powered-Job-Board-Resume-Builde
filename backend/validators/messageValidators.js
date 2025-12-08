import Joi from "joi"

export const createMessageSchema = Joi.object({
  sender: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Invalid sender ID format' }),
  receiver: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Invalid receiver ID format' }),
  content: Joi.string().max(5000).allow('').optional(),
  attachment: Joi.string().optional()
}).or('content', 'attachment')
  .messages({ 'object.missing': 'Either content or attachment is required' });