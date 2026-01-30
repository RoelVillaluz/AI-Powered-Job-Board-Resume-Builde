import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import * as UserGetRepo from "../../repositories/users/userGetRepos.js";
import * as UserSetRepo from "../../repositories/users/userSetRepos.js";
import { catchAsync } from "../../utils/errorUtils.js";

export const getUserInteractedJobs = catchAsync(async (req, res) => {
    const { id, jobActionType } = req.params;

    const data = await UserGetRepo.findUserInteractedJobs(id, jobActionType)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data }, 'Interacted Jobs')
})

export const toggleSaveJob = catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user._id || req.user.id

    const data = await UserSetRepo.toggleSaveJob(jobId, userId)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data })
})

export const applyToJob = catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user._id || req.user.id

    const data = await UserSetRepo.toggleApplyJob(jobId, userId)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data })
})