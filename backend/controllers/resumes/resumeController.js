import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import { catchAsync } from "../../utils/errorUtils.js";
import * as ResumeRepo from "../../repositories/resumes/resumeRepository.js";
import * as ResumeService from "../../services/resumes/resumeServices.js";

/**
 * Retrieve a paginated list of resumes.
 *
 * Supports optional filtering, sorting, and pagination via
 * query parameters.
 *
 * @async
 * @function getResumes
 * @returns {Promise<void>} Sends list of resumes with pagination metadata
 *
 * @example
 * GET /api/resumes?skill=React&certification=AWS&page=2&limit=10
 */
export const getResumes = catchAsync(async (req, res) => {
    const result = await findResumesService(req.query);

    return sendResponse(res, {
    ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: result.data,
        pagination: result.pagination,
    }, 'Resumes');
});

/**
 * Retrieve a single resume by its ID.
 *
 * @async
 * @function getResume
 * @returns {Promise<void>} Sends the requested resume
 *
 * @example
 * GET /api/resumes/64f1a5d2a3c4b0e123456789
 */
export const getResume = catchAsync(async (req, res) => {
    const { id } = req.params;

    const resume = await ResumeRepo.findResumeByIdRepo(id);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: resume}, 'Resume')
})

/**
 * Retrieve all resumes belonging to a specific user.
 *
 * @async
 * @function getResumesByUser
 * @returns {Promise<void>} Sends an array of resumes for the user
 *
 * @example
 * GET /api/resumes/user/64f1a5d2a3c4b0e123456789
 */
export const getResumesByUser = catchAsync(async (req, res) => {
    const { userId } = req.params;

    const resumes = await ResumeRepo.findResumesByUserRepo(userId);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: resumes}, 'Resume' )
})

/**
 * Create a new resume.
 *
 * Expects resume data in the request body and persists it
 * using the repository layer.
 *
 * @async
 * @function createResume
 * @returns {Promise<void>} Sends the newly created resume
 *
 * @example
 * POST /api/resumes
 * Body: {
 *   firstName: "John",
 *   lastName: "Doe",
 *   skills: [{ name: "React" }]
 * }
 */
export const createResume = catchAsync(async (req, res) => {
    const resumeData = req.body;

    const data = await ResumeService.createResumeService(resumeData);

    return sendResponse(
        res,
        {
            ...STATUS_MESSAGES.SUCCESS.CREATE,
            data: {
                resume: data.resume,
                embedding: data.embedding,
                score: data.score
            }
        },
        'Resume'
    );
})

/**
 * Update an existing resume by its ID.
 *
 * Delegates persistence logic to the repository layer.
 * Business rules (e.g. score or salary resets) are applied
 * outside of the controller when applicable.
 *
 * @async
 * @function updateResume
 * @returns {Promise<void>} Sends the updated resume
 *
 * @example
 * PUT /api/resumes/64f1a5d2a3c4b0e123456789
 * Body: { firstName: "Jane", skills: [...] }
 */
export const updateResume = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const data = await ResumeService.updateResumeService(id, updateData);

    return sendResponse(
        res,
        {
            ...STATUS_MESSAGES.SUCCESS.UPDATE,
            data: {
                resume: data.resume,
                invalidated: data.invalidated
            }
        },
        'Resume'
    );
})

/**
 * Delete a resume by its ID.
 *
 * Delegates deletion logic to the repository layer.
 *
 * @async
 * @function deleteResume
 * @returns {Promise<void>} Sends confirmation of deletion
 *
 * @example
 * DELETE /api/resumes/64f1a5d2a3c4b0e123456789
 */
export const deleteResume = catchAsync(async (req, res) => {
    const { id } = req.params;

    const data = await ResumeService.deleteResumeService(id);

    return sendResponse(
        res,
        {
            ...STATUS_MESSAGES.SUCCESS.DELETE,
            data: {
                resume: data.resume,
                deleted: data.deleted
            }
        },
        'Resume'
    );
})
