import express from "express"
import * as SkillController from "../../../controllers/market/skills/skillController.js";
import { authenticate } from "../../../middleware/authentication/authenticate.js";
import { requireRole } from "../../../middleware/authorization/roleAuthorization.js";
import { validate } from "../../../middleware/validation.js";
import { createSkillSchema, updateSkillSchema } from "../../../validators/skillValidator.js";
import { checkIfSkillExistsById } from "../../../middleware/resourceCheck/skill.js";

const router = express.Router();

router.get('/search', SkillController.getSkillsByName);

router.get('/:id/embeddings', 
    checkIfSkillExistsById,
    SkillController.getOrGenerateSkillEmbedding
)
router.get('/:id/metrics', 
    checkIfSkillExistsById,
    SkillController.getSkillMetrics
);

router.get('/:id', 
    checkIfSkillExistsById,
    SkillController.getSkillById
);

router.post('/', 
    authenticate, 
    requireRole('employer'), 
    validate(createSkillSchema, 'body'),
    SkillController.createSkill
);

router.patch('/:id', 
    authenticate, 
    requireRole('employer'), 
    checkIfSkillExistsById,
    validate(updateSkillSchema, 'body'),
    SkillController.updateSkill
);

router.delete('/:id',
    authenticate,
    requireRole('employer'),
    checkIfSkillExistsById,
    SkillController.deleteSkill
)

export default router;