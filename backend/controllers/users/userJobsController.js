import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import * as UserGetRepo from '../../repositories/users/userGetRepos.js';
import { catchAsync } from "../../utils/errorUtils.js";

export const getUserInteractedJobs = catchAsync(async (req, res) => {
    const { id, jobActionType } = req.params;

    const data = await UserGetRepo.findUserInteractedJobs(id, jobActionType)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data }, 'Interacted Jobs')
})

export const toggleSaveJob = catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user._id || req.user.id

    const data = await UserGetRepo.toggleSaveJob(jobId, userId)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data })
})

export const applyToJob = catchAsync(async (req, res) => {

})