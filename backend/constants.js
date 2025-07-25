export const STATUS_MESSAGES = {
    SUCCESS: {
        FETCH: { code: 200, message: "(model) fetched successfully" },
        CREATE: { code: 201, message: "(model) created successfully" },
        UPDATE: { code: 200, message: "(model) updated successfully" },
        DELETE: { code: 200, message: "(model) deleted successfully" },
        RESENT_CODE: { code: 200, message: "code resent successfully"},
        LOGIN: { code: 200, message: 'Logged in successfully'},
        MATCHED_CODE: { code: 200, message: 'The code you entered is correct.'}
    },
    ERROR: {
        SERVER: { code: 500, message: "Server Error" },
        NOT_FOUND: { code: 404, message: "(model) not found" },
        BAD_REQUEST: { code: 400, message: "Invalid request" },
        EMAIL_EXISTS: { code: 400, message: "Email is already being used" },
        INVALID_CODE: { code: 400, message: "The code you entered is incorrect"},
        INVALID_CREDENTIALS: { code: 400, message: "Invalid credentials"},
        INVALID_INPUT: { code: 400, message: "The inputs are wrong format"},
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

export const formattedSalary = (job) => {
    return `${job.salary.currency}${job.salary.amount.toLocaleString()}/${job.salary.frequency}`
}

export const INDUSTRY_CHOICES = {
    Technology: "fa-solid fa-microchip",
    Marketing: "fa-solid fa-bullhorn",
    Healthcare: "fa-solid fa-stethoscope",
    Finance: "fa-solid fa-chart-line",
    Education: "fa-solid fa-graduation-cap",
    Retail: "fa-solid fa-store",
    Manufacturing: "fa-solid fa-industry",
    Media: "fa-solid fa-newspaper",
    Entertainment: "fa-solid fa-film",
    Energy: "fa-solid fa-bolt",
    Travel: "fa-solid fa-plane-departure",
    Government: "fa-solid fa-landmark"
};

export const SORTING_CHOICES = ['Best Match (Default)', 'A-Z', 'Z-A', 'Newest First', 'Highest Salary'];