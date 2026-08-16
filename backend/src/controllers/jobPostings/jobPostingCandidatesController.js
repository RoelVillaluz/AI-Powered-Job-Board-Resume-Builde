import { catchAsync } from "../../utils/errorUtils.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import * as JobPostingService from "../../services/jobPostings/jobPostingServices.js";

export const getJobCandidates = catchAsync(async (req, res) => {
    const { jobId } = req.params;

    const result = await JobPostingService.getJobCandidates(jobId);

    if (!result) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Job posting");
        return;
    }

    sendResponse(res, {
        ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: result,
    }, "Job candidates");
});
