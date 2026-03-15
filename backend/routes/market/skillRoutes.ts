import express from "express"
import * as SkillController from "../../controllers/market/skillController";
import { authenticate } from "../../middleware/authentication/authenticate";
import { requireRole } from "../../middleware/authorization/roleAuthorization";
import { validate } from "../../middleware/validation";
import { createSkillSchema, updateSkillSchema } from "../../validators/skillValidator";

const router = express.Router();

router.get('/:id/embeddings', 
    SkillController.getOrGenerateSkillEmbedding
)
router.get('/:id/metrics', SkillController.getSkillMetrics);
router.get('/:id', SkillController.getSkillById);
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
    validate(updateSkillSchema, 'body'),
    SkillController.updateSkill
);

router.delete('/:id',
    authenticate,
    requireRole('employer'),
    SkillController.deleteSkill
)

export default router;