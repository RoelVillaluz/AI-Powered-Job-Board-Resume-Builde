import { jest } from '@jest/globals';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedJobseeker, createAuthenticatedEmployer } from '../../helpers/authHelper.js';
import mongoose from 'mongoose';

// ── Mock at service level — correct boundary for integration tests ─────────────
jest.unstable_mockModule('../../../services/resumes/resumeEmbeddingService.js', () => ({
    getOrGenerateResumeEmbeddingService: jest.fn(),
    getResumeEmbeddingService:           jest.fn(),
    createResumeEmbeddingService:        jest.fn(),
    upsertResumeEmbedding:               jest.fn(),  
}));

// ── Dynamic imports must come after mocks in ESM ──────────────────────────────
const { default: request }                      = await import('supertest');
const { default: app }                          = await import('../../../app.js');
const { default: Resume }                       = await import('../../../models/resumes/resumeModel.js');
const { Factory }                               = await import('../../factories/index.js');
const { getOrGenerateResumeEmbeddingService }   = await import('../../../services/resumes/resumeEmbeddingService.js');

describe('GET /api/resumes/:resumeId/embeddings', () => {
    let dataTracker;

    beforeAll(async () => {
        await connectTestDB();
    });

    afterAll(async () => {
        await disconnectTestDB();
    });

    beforeEach(() => {
        dataTracker = new TestDataTracker();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await dataTracker.cleanup();
    });

    // ── Success Cases ─────────────────────────────────────────────────────────

    describe('Success Cases', () => {
        test('should return 200 with cached embeddings when valid cache exists', async () => {
            // Arrange
            const { jobseeker, token } = await createAuthenticatedJobseeker(app);
            dataTracker.trackUser(jobseeker._id);

            const resume = await Factory('resume')
                .with({ user: jobseeker._id })
                .for(Resume)
                .create();
            dataTracker.trackResume(resume._id);

            getOrGenerateResumeEmbeddingService.mockResolvedValue({
                cached: true,
                data: { _id: new mongoose.Types.ObjectId(), resume: resume._id },
            });

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/embeddings`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.cached).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.formattedMessage).toMatch(/Resume Embeddings fetched successfully/i);
        });

        test('should return 202 with jobId when embeddings are queued', async () => {
            // Arrange
            const { jobseeker, token } = await createAuthenticatedJobseeker(app);
            dataTracker.trackUser(jobseeker._id);

            const resume = await Factory('resume')
                .with({ user: jobseeker._id })
                .for(Resume)
                .create();
            dataTracker.trackResume(resume._id);

            getOrGenerateResumeEmbeddingService.mockResolvedValue({
                cached: false,
                jobId: 'mock-job-id-123',
            });

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/embeddings`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(202);
            expect(response.body.success).toBe(true);
            expect(response.body.cached).toBe(false);
            expect(response.body.jobId).toBe('mock-job-id-123');
            expect(response.body.statusUrl).toMatch(/\/api\/jobs\/mock-job-id-123\/status/);
        });

        test('should return 202 when invalidateCache forces regeneration', async () => {
            // Arrange
            const { jobseeker, token } = await createAuthenticatedJobseeker(app);
            dataTracker.trackUser(jobseeker._id);

            const resume = await Factory('resume')
                .with({ user: jobseeker._id })
                .for(Resume)
                .create();
            dataTracker.trackResume(resume._id);

            getOrGenerateResumeEmbeddingService.mockResolvedValue({
                cached: false,
                jobId: 'mock-job-id-456',
            });

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/embeddings`)
                .set('Authorization', `Bearer ${token}`)
                .send({ invalidateCache: true });

            // Assert
            expect(response.status).toBe(202);
            expect(response.body.jobId).toBe('mock-job-id-456');

            // Verify invalidateCache was passed through to service
            expect(getOrGenerateResumeEmbeddingService).toHaveBeenCalledWith(
                resume._id.toString(),
                true,
                expect.any(String),
            );
        });

        test('should pass correct resumeId and userId through to service', async () => {
            // Arrange
            const { jobseeker, token } = await createAuthenticatedJobseeker(app);
            dataTracker.trackUser(jobseeker._id);

            const resume = await Factory('resume')
                .with({ user: jobseeker._id })
                .for(Resume)
                .create();
            dataTracker.trackResume(resume._id);

            getOrGenerateResumeEmbeddingService.mockResolvedValue({
                cached: false,
                jobId: 'mock-job-id-123',
            });

            // Act
            await request(app)
                .get(`/api/resumes/${resume._id}/embeddings`)
                .set('Authorization', `Bearer ${token}`);

            // Assert — controller extracts resumeId and userId correctly
            expect(getOrGenerateResumeEmbeddingService).toHaveBeenCalledWith(
                resume._id.toString(),
                false,
                jobseeker._id.toString(),
            );
        });
    });

    // ── Validation Failures ───────────────────────────────────────────────────

    describe('Validation Failures', () => {
        test('should return 400 when resumeId is not a valid ObjectId', async () => {
            // Arrange
            const { token } = await createAuthenticatedJobseeker(app);

            // Act
            const response = await request(app)
                .get('/api/resumes/not-a-valid-id/embeddings')
                .set('Authorization', `Bearer ${token}`);

            // Assert — hits validate(resumeIdSchema) before anything else
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should return 404 when resume does not exist', async () => {
            // Arrange
            const { token } = await createAuthenticatedJobseeker(app);
            const nonExistentId = new mongoose.Types.ObjectId();

            // Act
            const response = await request(app)
                .get(`/api/resumes/${nonExistentId}/embeddings`)
                .set('Authorization', `Bearer ${token}`);

            // Assert — hits checkIfResumeExistsById middleware
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    // ── Authorization Failures ────────────────────────────────────────────────

    describe('Authorization Failures', () => {
        test('should return 401 without authentication token', async () => {
            // Act
            const response = await request(app)
                .get(`/api/resumes/${new mongoose.Types.ObjectId()}/embeddings`);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.formattedMessage).toMatch(/No authentication token provided/i);
        });

        test('should return 401 with invalid token', async () => {
            // Act
            const response = await request(app)
                .get(`/api/resumes/${new mongoose.Types.ObjectId()}/embeddings`)
                .set('Authorization', 'Bearer invalid.token.here');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('should return 403 when user is not a jobseeker', async () => {
            // Arrange
            const { employer, token } = await createAuthenticatedEmployer(app);
            dataTracker.trackUser(employer._id);

            // Act — requireRole fires before checkIfResumeExistsById
            // so resume doesn't need to exist
            const response = await request(app)
                .get(`/api/resumes/${new mongoose.Types.ObjectId()}/embeddings`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(403);
            expect(response.body.formattedMessage).toMatch(/jobseeker/i);
        });

        test('should return 403 when resume belongs to a different user', async () => {
            // Arrange
            const { jobseeker: owner } = await createAuthenticatedJobseeker(app);
            const { token: attackerToken } = await createAuthenticatedJobseeker(app);
            dataTracker.trackUser(owner._id);

            const resume = await Factory('resume')
                .with({ user: owner._id })
                .for(Resume)
                .create();
            dataTracker.trackResume(resume._id);

            // Act — attacker uses valid token but targets owner's resume
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/embeddings`)
                .set('Authorization', `Bearer ${attackerToken}`);

            // Assert
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.formattedMessage).toMatch(/do not have access/i);
        });

        test('should not leak resume existence to unauthorized users', async () => {
            // Arrange
            const { jobseeker: owner } = await createAuthenticatedJobseeker(app);
            const { token: otherToken } = await createAuthenticatedJobseeker(app);
            dataTracker.trackUser(owner._id);

            const resume = await Factory('resume')
                .with({ user: owner._id })
                .for(Resume)
                .create();
            dataTracker.trackResume(resume._id);

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/embeddings`)
                .set('Authorization', `Bearer ${otherToken}`);

            // Assert — 403 not 404 so resume existence is never leaked
            expect(response.status).toBe(403);
        });
    });
});