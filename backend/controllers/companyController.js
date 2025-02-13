import Company from '../models/companyModel.js'
import { checkMissingFields } from '../utils.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';

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
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: company}, 'Company')
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const createCompany = async (req, res) => {
    const company = req.body;
    const requiredFields = ["name", "industry", "location", "description"]

    const missingField = checkMissingFields(requiredFields, company)
    if (missingField) {
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), success: false}, 'Company')
    }

    try {
        const newCompany = new Company(company)
        await newCompany.save()
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newCompany }, 'Company');
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const updateCompany = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedCompany = await Company.findByIdAndUpdate(id, { new: true })
        if (!updatedCompany) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Company')
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