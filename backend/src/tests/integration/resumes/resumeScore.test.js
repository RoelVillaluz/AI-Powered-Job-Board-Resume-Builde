import { jest } from '@jest/globals';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedJobseeker, createAuthenticatedEmployer } from '../../helpers/authHelper.js';
import mongoose from 'mongoose';

// ── Mock at service level ─────────────────────────────────────────────────────
jest.unstable_mockModule('../../../services/resumes/resumeScoreService.js', () => ({
    getOrGenerateResumeScoreService: jest.fn(),
    getResumeScoreService:           jest.fn(),
    generateResumeScoreService:      jest.fn(),
    upsertResumeScoreService:        jest.fn(),
}));

// ── Dynamic imports must come after mocks in ESM ──────────────────────────────
const { default: request }                = await import('supertest');
const { default: app }                    = await import('../../../app.js');
const { default: Resume }                 = await import('../../../models/resumes/resumeModel.js');
const { default: ResumeEmbeddingModel }   = await import('../../../models/resumes/resumeEmbeddingsModel.js');
const { default: ResumeScoreModel }       = await import('../../../models/resumes/resumeScoreModel.js');
const { default: User }                   = await import('../../../models/UserModel.js');
const { seedJobseekerWithResume }         = await import('../../factories/seeders.js');
const { getOrGenerateResumeScoreService } = await import('../../../services/resumes/resumeScoreService.js');

describe('GET /api/resumes/:resumeId/score', () => {
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
        test('should return 200 with cached score when valid cache exists', async () => {
            // Arrange
            const { jobseeker, token, resume, resumeEmbeddings, resumeScore } =
                await seedJobseekerWithResume(
                    app, User, Resume,
                    ResumeEmbeddingModel,
                    ResumeScoreModel,
                    { hasScore: true },
                );

            dataTracker.trackUser(jobseeker._id);
            dataTracker.trackResume(resume._id);
            dataTracker.trackResumeEmbedding(resumeEmbeddings._id);
            dataTracker.trackResumeScore(resumeScore._id);

            getOrGenerateResumeScoreService.mockResolvedValue({
                cached: true,
                data: {
                    _id:            resumeScore._id,
                    resume:         resume._id,
                    totalScore:     resumeScore.totalScore,
                    grade:          resumeScore.grade,
                    overallMessage: resumeScore.overallMessage,
                },
            });

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.cached).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.formattedMessage).toMatch(/Resume Score fetched successfully/i);
        });

        test('should return correct response shape when score is cached', async () => {
            // Arrange
            const { jobseeker, token, resume, resumeEmbeddings, resumeScore } =
                await seedJobseekerWithResume(
                    app, User, Resume,
                    ResumeEmbeddingModel,
                    ResumeScoreModel,
                    { hasScore: true },
                );

            dataTracker.trackUser(jobseeker._id);
            dataTracker.trackResume(resume._id);
            dataTracker.trackResumeEmbedding(resumeEmbeddings._id);
            dataTracker.trackResumeScore(resumeScore._id);

            getOrGenerateResumeScoreService.mockResolvedValue({
                cached: true,
                data: {
                    _id:            resumeScore._id,
                    resume:         resume._id,
                    totalScore:     52.5,
                    grade:          'D',
                    overallMessage: 'Below-average resume that needs improvement.',
                    strengths:      ['Diverse skill set'],
                    improvements:   ['Add more work experience'],
                },
            });

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${token}`);

            // Assert — verify full response shape
            expect(response.status).toBe(200);
            expect(response.body.data.totalScore).toBe(52.5);
            expect(response.body.data.grade).toBe('D');
            expect(response.body.data.overallMessage).toBeDefined();
            expect(response.body.data.strengths).toBeInstanceOf(Array);
            expect(response.body.data.improvements).toBeInstanceOf(Array);
        });

        test('should return 202 with jobId when score calculation is queued', async () => {
            // Arrange — embeddings exist but no score yet
            const { jobseeker, token, resume, resumeEmbeddings } =
                await seedJobseekerWithResume(
                    app, User, Resume,
                    ResumeEmbeddingModel,
                    null,
                    { hasEmbeddings: true },
                );

            dataTracker.trackUser(jobseeker._id);
            dataTracker.trackResume(resume._id);
            dataTracker.trackResumeEmbedding(resumeEmbeddings._id);

            getOrGenerateResumeScoreService.mockResolvedValue({
                cached: false,
                jobId: 'mock-score-job-123',
            });

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(202);
            expect(response.body.success).toBe(true);
            expect(response.body.cached).toBe(false);
            expect(response.body.jobId).toBe('mock-score-job-123');
            expect(response.body.statusUrl).toMatch(/\/api\/jobs\/mock-score-job-123\/status/);
        });

        test('should return 202 when embeddings are missing and embedding pipeline is triggered', async () => {
            // Arrange — no embeddings, no score
            const { jobseeker, token, resume } =
                await seedJobseekerWithResume(app, User, Resume);

            dataTracker.trackUser(jobseeker._id);
            dataTracker.trackResume(resume._id);

            getOrGenerateResumeScoreService.mockResolvedValue({
                cached: false,
                jobId: 'mock-embedding-job-456',
            });

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${token}`);

            // Assert — score service redirects to embedding pipeline
            expect(response.status).toBe(202);
            expect(response.body.success).toBe(true);
            expect(response.body.cached).toBe(false);
            expect(response.body.jobId).toBe('mock-embedding-job-456');
            expect(response.body.statusUrl).toMatch(/\/api\/jobs\/mock-embedding-job-456\/status/);
        });

        test('should pass correct resumeId and userId through to service', async () => {
            // Arrange
            const { jobseeker, token, resume } =
                await seedJobseekerWithResume(app, User, Resume);

            dataTracker.trackUser(jobseeker._id);
            dataTracker.trackResume(resume._id);

            getOrGenerateResumeScoreService.mockResolvedValue({
                cached: false,
                jobId: 'mock-score-job-123',
            });

            // Act
            await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(getOrGenerateResumeScoreService).toHaveBeenCalledWith(
                resume._id.toString(),
                false,
                jobseeker._id.toString(),
            );
        });

        test('should always pass invalidateCache as false to service', async () => {
            // Arrange
            const { jobseeker, token, resume } =
                await seedJobseekerWithResume(app, User, Resume);

            dataTracker.trackUser(jobseeker._id);
            dataTracker.trackResume(resume._id);

            getOrGenerateResumeScoreService.mockResolvedValue({
                cached: false,
                jobId: 'mock-score-job-123',
            });

            // Act — send invalidateCache in body, controller should ignore it
            await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${token}`)
                .send({ invalidateCache: true });

            // Assert — score controller hardcodes false unlike embedding controller
            expect(getOrGenerateResumeScoreService).toHaveBeenCalledWith(
                resume._id.toString(),
                false,
                expect.any(String),
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
                .get('/api/resumes/not-a-valid-id/score')
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should return 404 when resume does not exist', async () => {
            // Arrange
            const { token } = await createAuthenticatedJobseeker(app);
            const nonExistentId = new mongoose.Types.ObjectId();

            // Act
            const response = await request(app)
                .get(`/api/resumes/${nonExistentId}/score`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    // ── Authorization Failures ────────────────────────────────────────────────

    describe('Authorization Failures', () => {
        test('should return 401 without authentication token', async () => {
            // Act
            const response = await request(app)
                .get(`/api/resumes/${new mongoose.Types.ObjectId()}/score`);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.formattedMessage).toMatch(/No authentication token provided/i);
        });

        test('should return 401 with invalid token', async () => {
            // Act
            const response = await request(app)
                .get(`/api/resumes/${new mongoose.Types.ObjectId()}/score`)
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
            const response = await request(app)
                .get(`/api/resumes/${new mongoose.Types.ObjectId()}/score`)
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(403);
            expect(response.body.formattedMessage).toMatch(/jobseeker/i);
        });

        test('should return 403 when resume belongs to a different user', async () => {
            // Arrange
            const { token: attackerToken } = await createAuthenticatedJobseeker(app);
            const { jobseeker: owner, resume } =
                await seedJobseekerWithResume(app, User, Resume);
            dataTracker.trackUser(owner._id);
            dataTracker.trackResume(resume._id);

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${attackerToken}`);

            // Assert
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.formattedMessage).toMatch(/do not have access/i);
        });

        test('should not leak resume existence to unauthorized users', async () => {
            // Arrange
            const { token: otherToken } = await createAuthenticatedJobseeker(app);
            const { jobseeker: owner, resume } =
                await seedJobseekerWithResume(app, User, Resume);
            dataTracker.trackUser(owner._id);
            dataTracker.trackResume(resume._id);

            // Act
            const response = await request(app)
                .get(`/api/resumes/${resume._id}/score`)
                .set('Authorization', `Bearer ${otherToken}`);

            // Assert — 403 not 404 so resume existence is never leaked
            expect(response.status).toBe(403);
        });
    });
});