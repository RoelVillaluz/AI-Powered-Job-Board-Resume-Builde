import express from "express"
import { createCompany, deleteCompany, getCompanies, getCompany, updateCompany } from "../controllers/companyController.js";

const router = express.Router();

router.get('/', getCompanies)
router.get('/:id', getCompany)

router.post('/', createCompany)
router.patch('/:id', updateCompany)

router.delete('/:id', deleteCompany)

export default router