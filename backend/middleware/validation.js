import { ValidationError } from "./errorHandler.js";

export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const message = error.details.map(detail => detail.message).join(', ');
            throw new ValidationError(message);
        }

        // Replace with validated/sanitized values
        req[source] = value;
        next();
    }
}