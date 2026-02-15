import { catchAsync } from '../../utils/errorUtils.js';
import * as UserGetRepo from '../../repositories/users/userGetRepos.js';
import * as UserSetRepo from '../../repositories/users/userSetRepos.js';
import * as TempUserRepository from "../../repositories/tempUsers/tempUserRepositories.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import * as UserService from '../../services/users/userServices.js';
import logger from '../../utils/logger.js'

export const getUsers = catchAsync(async (req, res) => {
    const users = await UserGetRepo.findUsers()

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: users }, 'Users');
})

export const getUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await UserGetRepo.findUser(id)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: user }, 'User');
})

export const getUserConnectionRecommendations = catchAsync(async (req, res) => {
    const { id } = req.params;

    const recommendations = await UserService.getConnectionRecommendationService(id)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: recommendations }, 'Connection Recommendations');
})

export const registerUser = catchAsync(async (req, res) => {
    const data = req.body;

    const newTempUser = await TempUserRepository.createTempUser(data) // create temporary user instance first for verification

    logger.info('New temporary user created: ', newTempUser)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newTempUser, message: "Verification code sent to email." }, 'User');
})

export const updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await UserSetRepo.updateUser(id, updateData)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedUser }, 'User');
})

export const deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    const deletedUser = await UserSetRepo.deleteUser(id)
    
    return sendResponse(res, STATUS_MESSAGES.SUCCESS.DELETE, 'User');
})