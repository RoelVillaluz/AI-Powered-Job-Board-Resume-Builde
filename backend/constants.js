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

export const NO_FILTER_VALUE = 0
export const DEFAULT_MIN_SALARY = 0
export const DEFAULT_MAX_SALARY = 0

export const INITIAL_FILTERS = {
    salary: {
        amount: {
            min: 0,
            max: 0,
        }
    },
    datePosted: "Anytime",
    jobType: [],
    experienceLevel: [],
    skills: [],
    minMatchScore: 0,
    jobTitle: "",
    location: "",
    applicationStatus: {
        saved: false,
        applied: false
    },
    industry: [],
    hasQuestions: false
}

export const DATE_OPTIONS_MAP = {
    'Anytime': '',
    'Today': 'today',
    'This Week': 'this_week',
    'This Month': 'this_month',
    'Last 3 Months': 'last_3_months'
}

export const DATE_FILTER_MAP = Object.fromEntries(
    Object.entries(DATE_OPTIONS_MAP).map(([k, v]) => [v, k])
);

export const RESUME_ANALYSIS_MESSAGES = {
        0: {
            rating: "No Resume yet",
            message: "You haven't uploaded a resume for this job. Consider adding one to improve your chances.",
        },
        0.25: {
            rating: "Poor",
            message: "Your resume has very few matching skills for this job. Try updating it with relevant skills.",
        },
        0.5: {
            rating: "Average",
            message: "Your resume matches some of the job's skills. A few tweaks could make it stronger.",
        },
        0.75: {
            rating: "Good",
            message: "Your resume aligns well with this job posting. A couple more relevant skills would make it great.",
        },
        0.9: {
            rating: "Great",
            message: "Your resume is a strong match for this job. You're just a step away from an excellent fit.",
        },
        1: {
            rating: "Excellent",
            message: "Your resume perfectly matches the job posting. You’re a top candidate for this role!",
        },
    };

export const SKILL_ANALYSIS_MESSAGES = {
    0: {
        message: 'No matching skills yet. Check the job description and start building these skills!'
    },
    0.25: {
        message: 'Very few skills match. Consider learning the key skills listed in the job posting.'
    },
    0.5: {
        message: 'Some of your skills align with this position. Adding a few more would strengthen your profile.'
    },
    0.75: {
        message: 'Most of your skills match this job really well. Just a couple more and you\'ll be all set!'
    },
    1: {
        message: 'Your skills are an excellent match! You\'ve got the right tools for this role.'
    }
};

export const EXPERIENCE_ANALYSIS_MESSAGES = {
    0: {
        message: 'You don\'t have direct experience yet, but don\'t worry! Consider looking for entry-level roles or internships in this field.'
    },
    0.25: {
        message: 'Limited experience in this area. Highlight any transferable skills from your current experience.'
    },
    0.5: {
        message: 'You have some relevant experience. With a bit more growth, you\'ll be a strong candidate.'
    },
    0.75: {
        message: 'Your work experience aligns nicely with this position. You\'re looking like a solid fit!'
    },
    1: {
        message: 'Your experience is a perfect match for this role. You\'re well-positioned to succeed here!'
    }
};
