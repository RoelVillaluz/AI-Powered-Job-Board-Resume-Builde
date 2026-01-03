import User from "../../models/userModel.js"
import { TempUser } from "../../models/tempUserModel"

export const findUsers = async ({ name, limit }) =>{
    const query = {}

    if (name) {
        const parts = name.trim().split(/\s+/)

        if (parts.length === 1) {
            query.$or = [
                { firstName: { $regex: parts[0], $options: 'i' } },
                { lastName: { $regex: parts[0], $options: 'i' }}
            ]
        } else {
            query.$and = [
                { firstName: { $regex: parts[0], $options: 'i' } },
                { lastName: { $regex: parts[1], $options: 'i' } }
            ]
        }
    }

    return await User.find(query)
        .select('email firstName lastName role profilePicture industry')
        .populate('company', 'id name')
        .limit(limit)
        .lean()
}

export const findUser = async (id) => {
    return await User.findById(id)
        .select('email firstName lastName role profilePicture industry')
        .populate('company', 'id name')
        .lean()
}

export const createTempUser = async (data) => {
    const newTempUser = new TempUser(data)

    return await newTempUser.save()
}

export const createUser = async (userData) => {
    const newUser = new User(userData);
    
    return await newUser.save()
}

export const updateUser = async (id, updateData) => {
    return await User.findOneAndUpdate({ _id: id }, updateData, { new: true })
}

export const deleteUser = async (id) => {
    return await User.findOneAndDelete({ _id: id })
}

export const userExists = async (id) => {
    return await User.exists({ _id: id })
}