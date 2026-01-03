import User from "../../models/userModel";
import mongoose from "mongoose";
import { catchAsync } from '../../utils/errorUtils.js';
import * as UserRepository from "../../repositories/users/userRepositories";
import * as TempUserRepository from "../../repositories/users/tempUserRepositories.js";
import { sendResponse } from "../../constants";

export const getUsers = catchAsync(async (req, res) => {
    const users = await UserRepository.findUsers()

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: users }, 'Users');
})

export const getUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    const user = await UserRepository.findUser(id)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: user }, 'User');
})

export const registerUser = catchAsync(async (req, res) => {
    const data = req.body;

    const newTempUser = TempUserRepository.createTempUser(data) // create temporary user instance first for verification

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, message: "Verification code sent to email." }, 'User');
})

export const updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await UserRepository.updateUser(id, updateData)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedUser }, 'User');
})

export const deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    const deletedUser = await UserRepository.deleteUser(id)
    
    return sendResponse(res, STATUS_MESSAGES.SUCCESS.DELETE, 'User');
})