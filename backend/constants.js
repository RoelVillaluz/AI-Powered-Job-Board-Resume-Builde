export const STATUS_MESSAGES = {
    SUCCESS: {
        FETCH: { code: 200, message: "(model) fetched successfully" },
        CREATE: { code: 201, message: "(model) created successfully" },
        UPDATE: { code: 200, message: "(model) updated successfully" },
        DELETE: { code: 200, message: "(model) deleted successfully" },
        RESENT_CODE: { code: 200, message: "code resent successfully"},
        LOGIN: { code: 200, message: 'Logged in successfully'}
    },
    ERROR: {
        SERVER: { code: 500, message: "Server Error" },
        NOT_FOUND: { code: 404, message: "(model) not found" },
        BAD_REQUEST: { code: 400, message: "Invalid request" },
        EMAIL_EXISTS: { code: 400, message: "Email is already being used" },
        INVALID_CODE: { code: 400, message: "The code you entered is incorrect"},
        INVALID_CREDENTIALS: { code: 400, message: "Invalid credentials"},
        WEAK_PASSWORD: { code: 400, message: "Password is too weak"},
        MISSING_FIELD: (field) => ({ 
            code: 400, 
            message: field === 'email' 
                ? 'Please provide an email' 
                : `Please provide a ${field}`
        }),
    }
};

export const sendResponse = (res, { code, success = true, data = null, message }, model = '') => {
    const formattedMessage = model ? message.replace('(model)', model) : message;
    const response = { success, formattedMessage };
    
    if (data) response.data = data;

    return res.status(code).json(response)
}

export const IndustryChoices = [
    "Technology",
    "Marketing",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Media",
    "Entertainment",
    "Energy",
    "Travel",
    "Government",
]