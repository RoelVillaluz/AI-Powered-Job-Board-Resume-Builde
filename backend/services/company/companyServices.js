import * as CompanyRepository from "../../repositories/company/companyRepositories.js"
import { transformCompanyData } from "../transformers/urlTransformers.js"

/**
 * Gets all companies
 * @returns {Promise<Array:Object>}
 */
export const getCompany = async (id) => {
    const company = await CompanyRepository.findCompanyById(id)

    transformCompanyData(company) // transform all company image paths 

    return company
}