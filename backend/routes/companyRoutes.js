import express from "express"
import { createCompany, deleteCompany, getCompanies, getCompany, updateCompany } from "../controllers/companyController.js";
import { authenticate } from "../middleware/authentication/authenticate.js"
import { requireEmployerRole, enforceCompanyOwnership, ensureSingleCompanyPerEmployer } from "../middleware/authorization/companyAuthorization.js";
import { validate } from "../middleware/validation.js";
import { createCompanySchema } from "../validators/companyValidator.js";

const router = express.Router();

router.get('/', getCompanies)
router.get('/:id', getCompany)

router.post('/', 
    authenticate,                // checks if user is logged in
    requireEmployerRole,         // only employers
    enforceCompanyOwnership,     // prevent creating for another user
    ensureSingleCompanyPerEmployer, // prevents user from having more than one company
    validate(createCompanySchema, 'body'), // body validation without user field
    createCompany
)

router.patch('/:id', updateCompany)

router.delete('/:id', deleteCompany)

export default router