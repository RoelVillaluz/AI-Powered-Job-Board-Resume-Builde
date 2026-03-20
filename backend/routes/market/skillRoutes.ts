import express from "express"
import * as SkillController from "../../controllers/market/skillController";
import { authenticate } from "../../middleware/authentication/authenticate";
import { requireRole } from "../../middleware/authorization/roleAuthorization";
import { validate } from "../../middleware/validation";
import { createSkillSchema, updateSkillSchema } from "../../validators/skillValidator";
import { checkIfSkillExistsById } from "../../middleware/resourceCheck/skill";

const router = express.Router();

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

router.get('/search/:name', SkillController.getSkillsByName);

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