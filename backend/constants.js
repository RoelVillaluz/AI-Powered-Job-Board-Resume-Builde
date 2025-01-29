export const STATUS_MESSAGES = {
    SUCCESS: {
        FETCH: { code: 200, message: "Data fetched successfully" },
        CREATE: { code: 201, message: "Data created successfully" },
        UPDATE: { code: 200, message: "Data updated successfully" },
        DELETE: { code: 200, message: "Data deleted successfully" },
    },
    ERROR: {
        SERVER: { code: 500, message: "Server Error" },
        NOT_FOUND: { code: 404, message: "Resource not found" },
        BAD_REQUEST: { code: 400, message: "Invalid request" },
        EMAIL_EXISTS: { code: 400, message: "Email is already being used" },
        MISSING_FIELD: (field) => ({ code: 400, message: `Please provide a ${field}` }),
    }
};

export const sendResponse = (res, { code, success = true, data = null, message }) => {
    const response = { success, message };
    if (data) response.data = data;

    return res.status(code).json(response)
}