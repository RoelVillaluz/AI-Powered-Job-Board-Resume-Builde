import express from "express"
import { createCompany, deleteCompany, getCompanies, getCompany, updateCompany } from "../controllers/companyController.js";
import { authenticate } from "../middleware/authentication/authenticate.js"
import { requireEmployerRole, enforceCompanyOwnership, ensureSingleCompanyPerEmployer } from "../middleware/authorization/companyAuthorization.js";
import { validate } from "../middleware/validation.js";
import { createCompanySchema } from "../validators/companyValidator.js";

const router = express.Router();

router.get('/', getCompanies)
router.get('/:id', getCompany)

// Order matters: auth → role check → validation → business logic
router.post('/', 
    authenticate,                          // 1. Check if user is logged in
    requireEmployerRole,                   // 2. Check if user is employer
    validate(createCompanySchema, 'body'), // 3. Validate request data
    enforceCompanyOwnership,               // 4. Prevent creating for another user
    ensureSingleCompanyPerEmployer,        // 5. Check single company per employer
    createCompany                          // 6. Create the company
);

router.patch('/:id', updateCompany)

router.delete('/:id', deleteCompany)

export default router