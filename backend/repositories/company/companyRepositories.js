
import Company from "../../models/companyModel.js"

/**
 * Find companies
 * @returns {Promise<{companies:Array}>}
 */
export const findCompanies = async ({ limit, cursor, name, industry, rating }) => {
    const query = {}

    // cursor pagination
    if (cursor) {
        query._id = { $gt: cursor }
    }  

    // Name filter (case-insensitive)
    if (name) {
        query.name = { $regex: name, $options: 'i' }
    }

    if (industry) {
        const industryArray = industry.split(',')

        query.industry = { $in: industryArray }
    }

    if (rating) {
        query.rating = { $gte: Number(rating) }
    }

    const companies = await Company.find(query)
        .select('_id name industry location logo rating size')
        .sort({ _id: 1 })
        .limit(limit + 1)
        .lean()

    const hasMore = companies.length > limit
    const data = hasMore ? companies.slice(0, limit) : companies;

    return { 
        data,
        nextCursor: hasMore ? data[data.length - 1]._id : null
    }
}

/**
 * Finds single company that matches ID
 * @param {string} id - Company ID
 * @returns {Promise<Object|null>}
 */
export const findCompanyById = async (id) => {
    return await Company.findById(id)
        .populate('jobs', 'title company jobType experienceLevel salary')
        .lean()
}

/**
 * Creates new company
 * @param {Object} companyData 
 * @returns {Promise<Object>}
 */
export const createCompany = async (companyData) => {
    const newCompany = new Company(companyData)
    return await newCompany.save()
}

/**
 * Updates single company based on ID 
 * @param {string} - Company ID
 * @param {Object} updateData - Data to update
 * @returns {<Promise{Object|null}>}
 */
export const updateCompany = async (id, updateData) => {
    return await Company.findByIdAndUpdate(
        id, updateData,
        { new: true }
    ).lean()
}

/**
 * Deletes company by id
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export const deleteCompany = async (id) => {
    return await Company.findByIdAndDelete(id)
}