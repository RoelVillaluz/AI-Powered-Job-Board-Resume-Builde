import Company from '../models/companyModel.js'
import { checkMissingFields } from '../utils.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import { catchAsync } from "../utils/errorUtils.js";
import * as CompanyRepository from '../repositories/company/companyRepositories.js';
import * as CompanyService from '../services/company/companyServices.js';
import mongoose from "mongoose";

/**
 * Fetches a paginated list of companies with optional filters.
 * Query parameters:
 * - limit: number of results to return (default 10, max 100)
 * - cursor: pagination cursor
 * - name: filter by company name (optional)
 * - industry: filter by industry (optional)
 * - rating: filter by rating (optional)
 * 
 * @param {Object} req - Express request object, expects query params
 * @param {Object} res - Express response object
 */
export const getCompanies = catchAsync(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const cursor = req.query.cursor;

    const { name, industry, rating } = req.query;

    const { data, nextCursor } = await CompanyRepository.findCompanies({
        limit,
        cursor,
        name,
        industry,
        rating
    });

    return sendResponse(
        res,
        { 
            ...STATUS_MESSAGES.SUCCESS.FETCH, 
            data,
            nextCursor
        },
        'Companies'
    );
});

/**
 * Fetches a single company by its ID.
 * @param {Object} req - Express request object, expects req.params.id
 * @param {Object} res - Express response object
 */
export const getCompany = catchAsync(async (req, res) => {
    const { id } = req.params;

    const company = await CompanyService.getCompany(id)
    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: company}, 'Company')
})

/**
 * Creates a new company.
 * @param {Object} req - Express request object, expects validated company data in req.body
 * @param {Object} res - Express response object
 */
export const createCompany = catchAsync(async (req, res) => {
    const companyData = {
        ...req.body,
        user: req.user.id // ✅ From authenticated token, not client input
    };
    
    const newCompany = await CompanyRepository.createCompany(companyData)
    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newCompany }, 'Company')
})

/**
 * Updates a company by its ID.
 * @param {Object} req - Express request object, expects:
 *   - req.params.id: ID of the company to update
 *   - req.body: validated update data
 * @param {Object} res - Express response object
 */
export const updateCompany = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Call repository to update company
    const updatedCompany = await CompanyRepository.updateCompany(id, updateData);

    return sendResponse(res,{ ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedCompany }, 'Company');
});

/**
 * Deletes a company by its ID.
 * The logged-in user must be authorized to delete the company (e.g., be the employer who owns it).
 * @param {Object} req - Express request object, expects:
 *   - req.params.id: ID of the company to delete
 * @param {Object} res - Express response object
 */
export const deleteCompany = catchAsync(async (req, res) => {
    const { id } = req.params;

    const deletedCompany = await CompanyRepository.deleteCompany(id)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.DELETE, data: deletedCompany }, 'Company')
})