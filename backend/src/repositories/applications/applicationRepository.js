import Application from "../../models/applicationModel.js";

export const getApplicantsForJobRepo = async (jobId) => {
    return Application.find({ jobPosting: jobId })
        .populate("applicant", "firstName lastName email profilePicture")
        .populate("resume")
        .sort({ appliedAt: -1 })
        .lean();
};
