// Helper function to check if any required field is missing
export const checkMissingFields = (fields, body) => {
    for (let field of fields) {
        if (!body[field]) {
            return field // Return the name of the first missing field
        }
    }
    return null; // All required fields are present
}   

// Helper function that takes in a single application (or an array of applications) and transforms the preScreeningAnswers the way you want.
export const formatApplicationData = (application) => {
    if (Array.isArray(application)) {
        return application.map(formatSingleApplication)
    } else {
        return formatSingleApplication(application)
    }
}

const formatSingleApplication = (app) => {
    if (!app || !app.jobPosting) return app;

    const preScreeningQA = app.jobPosting.preScreeningQuestions.map((q, index) => ({
        question: q.question,
        answer: app.preScreeningAnswers.get(index.toString()) || null
    }));

    const appObj = app.toObject ? app.toObject() : app;

    return {
        ...appObj,
        preScreeningQA
    }
}

export const determineFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'voice';
    if (mimeType === 'application/pdf') return 'pdf';
    return 'file';
}