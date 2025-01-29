import User from '../models/userModel.js'
import { checkMissingFields } from '../utils.js'

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
        res.status(200).json({ success: true, data: users })
    } catch (error) {
        console.error('Error fetching users', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

export const getUser = async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        return res.status(200).json({ success: true, data: user, message: 'User fetched successfuly' })
    } catch (error) {
        console.error('Error fetching user', error)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

export const createUser = async (req, res) => {
    const user = req.body;

    const requiredFields = ['name', 'email', 'role']

    // check for missing fields
    const missingField = checkMissingFields(requiredFields, user)

    if (missingField) {
        return res.status(400).json({ success: false, message: `Please provide a ${missingField}` });
    }

    try {
        const existingEmail = await User.findOne({ email: user.email })

        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email is already being used" })
        }

        const newUser = new User(user)
        await newUser.save()
        res.status(201).json({ success: true, data: newUser })
    } catch (error) {
        console.error('Error creating user', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

export const updateUser = async (req, res) => {
    const { id } = req.params
    const user = req.body

    try {
        const updatedUser = await User.findByIdAndUpdate(id, user, { new: true })

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }
        res.status(200).json({ success: true, data: updatedUser })
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

export const deleteUser = async (req, res) => {
    const { id } = req.params
    const user = req.body
    
    try {
        await User.findByIdAndDelete(id)
        res.status(200).json({ success: true, message: 'User deleted successfully' })
    } catch (error) {
        console.log(error);
    }
}