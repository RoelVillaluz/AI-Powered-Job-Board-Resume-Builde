import request from 'supertest';
import app from '../../../app.js';
import { connectTestDB, disconnectTestDB, TestDataTracker } from '../../helpers/db.js';
import { createAuthenticatedEmployer } from '../../helpers/authHelper.js';
import { createTestCompany, createTestJob } from '../../helpers/testData.js';

describe('POST api/job-postings - Create Job Posting', () => {
    let dataTracker;

    beforeAll(async () => {
        await connectTestDB();
    });

    afterAll(async () => {
        await disconnectTestDB();
    });

    beforeEach(async () => {
        dataTracker = new TestDataTracker();
    });

    afterEach(async () => {
        await dataTracker.cleanup();
    });

    describe('Success Cases', () => {
        test('should create job posting with valid employer and company credentials', async () => {
            // 1. Create authenticated employer
            const { employer, token } = await createAuthenticatedEmployer(app);
            dataTracker.trackUser(employer._id);

            // 2. Create company
            const companyData = createTestCompany(employer._id);
            const companyResponse = await request(app)
                .post('/api/companies')
                .set('Authorization', `Bearer ${token}`)
                .send(companyData);

            // Company assertions
            expect(companyResponse.status).toBe(201);
            expect(companyResponse.body.success).toBe(true);
            expect(companyResponse.body.formattedMessage).toMatch(/Company created successfully/i);
            expect(companyResponse.body.data).toHaveProperty('_id');
            
            const companyId = companyResponse.body.data._id;
            dataTracker.trackCompany(companyId);

            // 3. Create job posting linked to the company
            const jobData = createTestJob(companyId);
            const jobResponse = await request(app)
                .post('/api/job-postings')
                .set('Authorization', `Bearer ${token}`)
                .send(jobData);

            // Job assertions - Fixed to match sendResponse structure
            expect(jobResponse.status).toBe(201);
            expect(jobResponse.body.success).toBe(true);
            expect(jobResponse.body.formattedMessage).toMatch(/Job posting created successfully/i);

            // The job data is directly in response.body.data, not response.body.data.data
            expect(jobResponse.body.data).toBeTruthy();
            
            const job = jobResponse.body.data;

            expect(job).toHaveProperty('_id');
            expect(job.title).toBe(jobData.title);
            expect(job.company.toString()).toBe(companyId.toString());
            expect(job.location).toBe(jobData.location);
            expect(job.jobType).toBe(jobData.jobType);
            expect(job.experienceLevel).toBe(jobData.experienceLevel);

            expect(job.salary).toBeTruthy();
            expect(job.salary.currency).toBe(jobData.salary.currency);
            expect(job.salary.amount).toBe(jobData.salary.amount);
            expect(job.salary.frequency).toBe(jobData.salary.frequency);

            expect(job.requirements).toEqual(expect.arrayContaining(jobData.requirements));

            expect(job.skills).toHaveLength(jobData.skills.length);
            jobData.skills.forEach((skill, i) => {
                expect(job.skills[i].name).toBe(skill.name);
            });

            expect(job.preScreeningQuestions).toHaveLength(jobData.preScreeningQuestions.length);
            jobData.preScreeningQuestions.forEach((q, i) => {
                expect(job.preScreeningQuestions[i].question).toBe(q.question);
                expect(job.preScreeningQuestions[i].required).toBe(q.required);
            });

            dataTracker.trackJob(job._id);
        });
    });
});