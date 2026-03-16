import { Types } from "mongoose"
import { Request, Response } from "express"
import * as JobTitleRepo from '../../repositories/market/jobTitleRepositories'
import * as JobTitleService from '../../services/market/jobTitleService'
import { catchAsync } from "../../utils/errorUtils"
import { sendResponse, STATUS_MESSAGES } from "../../constants"

export const getJobTitleById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const jobTitle = await JobTitleRepo.getJobTitleByIdRepository(new Types.ObjectId(id));

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobTitle } as any, 'Job Title')
})

export const searchJobTitlesByName = catchAsync(async (req: Request, res: Response) => {
    const { title } = req.params as { title: string };
    
    const jobTitles = await JobTitleRepo.searchJobTitlesByNameRepository(title);
    
    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobTitles } as any, 'Job Title');
});

export const getJobTitleEmbeddingsByName = catchAsync(async (req: Request, res: Response) => {
    const { title } = req.params as { title: string };

    const jobTitleEmbeddings = await JobTitleRepo.getJobTitleEmbeddingByNameRepository(title);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobTitleEmbeddings } as any, 'Job Title Embeddings')
})

export const getJobTitleEmbeddingsById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const jobTitleEmbeddings = await JobTitleRepo.getJobTitleEmbeddingsByIdRepository(new Types.ObjectId(id));

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobTitleEmbeddings } as any, 'Job Title Embeddings')
})

export const getJobTitlesByIndustry = catchAsync(async (req: Request, res: Response) => {
    const { industry } = req.params as { industry: string };

    const jobTitles = await JobTitleRepo.getJobTitlesByIndustryRepository(industry);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobTitles } as any, 'Job Title')
})

export const getJobTitleMetrics = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const jobTitleMetrics = await JobTitleRepo.getJobTitleMetricsByIdRepository(new Types.ObjectId(id));

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobTitleMetrics } as any, 'Job Title Metrics')
})

export const getOrGenerateJobTitleEmbedding = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { invalidateCache = false } = req.body;

    const result = await JobTitleService.getOrGenerateJobTitleEmbeddingService(
        new Types.ObjectId(id),
        invalidateCache
    );

    if (result.cached) {
        return sendResponse(res, {
            ...STATUS_MESSAGES.SUCCESS.FETCH,
            cached: true,
            data: result.data
        } as any, 'Job Title Embedding');
    }

    return res.status(202).json({
        success: true,
        cached: false,
        message: 'Embedding generation queued',
        jobId: result.jobId,
        statusUrl: `/api/jobs/${result.jobId}/status`
    });
})

export const createJobTitle = catchAsync(async (req: Request, res: Response) => {
    const newJobTitle = await JobTitleService.createJobTitleService(req.body);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newJobTitle } as any, 'Job Title')
})

export const updateJobTitle = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { data } = req.body;

    const updatedJobTitle = JobTitleService.updateJobTitleService(new Types.ObjectId(id), data);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedJobTitle } as any, 'Job Title')
})

export const deleteJobTitle = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const deletedJobTitle = JobTitleRepo.deleteJobTitleRepository(new Types.ObjectId(id));

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.DELETE, data: deletedJobTitle } as any, 'Job Title')
})