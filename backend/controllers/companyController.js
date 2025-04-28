import Company from '../models/companyModel.js'
import { checkMissingFields } from '../utils.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import mongoose from "mongoose";

export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find({})
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: companies}, 'Companies')
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getCompany = async (req, res) => {
    const { id } = req.params;
    try {
        const company = await Company.findById(id)

        if (!company) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Company')
        }

        if (company.logo) {
            console.log("Original user company logo", company.logo) // Debugging: Check original logo
            company.logo = company.logo.replace(/\\/g, '/');
            company.logo = `company_logos/${company.logo.split('/').pop()}`
            console.log("Normalized user company logo:", company.logo); // Debugging: Check normalized path
        }

        if (company.banner) {
            console.log("Original user company banner", company.banner) // Debugging: Check original banner
            company.banner = company.banner.replace(/\\/g, '/');
            company.banner = `company_banners/${company.banner.split('/').pop()}`
            console.log("Normalized user company banner:", company.banner); // Debugging: Check normalized path
        }

        if (company.images) {
            console.log("Original user company images", company.images) // Debugging: Check original images
            company.images = company.images.replace(/\\/g, '/');
            company.images = `company_imagess/${company.images.split('/').pop()}`
            console.log("Normalized user company images:", company.images); // Debugging: Check normalized path
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: company}, 'Company')
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const createCompany = async (req, res) => {
    const companyData = req.body;
    const requiredFields = ["user", "name", "industry", "location", "description"]

    try {
        const missingField = checkMissingFields(requiredFields, companyData)
        if (missingField) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), success: false}, 'Company')
        }

        // Validate and extract user ID
        const userId = companyData.user?.id || companyData.user;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid user ID:', userId);
            return res.status(400).json({ message: 'Invalid user ID format', success: false });
        }

        // create new company
        const newCompany = new Company({
            ...companyData,
            user: new mongoose.Types.ObjectId(userId),
        })

        console.log('Final company data before saving:', newCompany);

        // Save to database
        await newCompany.save();

        console.log('Company saved:', newCompany);
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newCompany }, 'Company');
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false})
    }    
}

export const updateCompany = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedCompany = await Company.findByIdAndUpdate(id, { new: true })
        if (!updatedCompany) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Company')
        }
        if (req.file) {
            const imagePath = `company_logos/${req.file.file_name}`;
            const image = imagePath;
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedCompany }, 'Company');
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const deleteCompany = async (req, res) => {
    const { id } = req.params
    try {
        const deletedCompany = await Company.findByIdAndDelete(id)
        if (!deletedCompany) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Company')
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.DELETE }, 'Company')
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}