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
                .send({
                    jobPostingData: jobData
                });

            // Job assertions - Fixed to match sendResponse structure
            expect(jobResponse.status).toBe(201);
            expect(jobResponse.body.success).toBe(true);
            expect(jobResponse.body.formattedMessage).toMatch(/Job posting created successfully/i);

            // The job data is directly in response.body.data, not response.body.data.data
            expect(jobResponse.body.data).toBeTruthy();
            
            const job = jobResponse.body.data;

            // ===============================
            // CORE
            // ===============================
            expect(job).toHaveProperty('_id');

            // ===============================
            // TITLE
            // ===============================
            expect(job.title._id.toString()).toBe(jobData.title._id.toString());
            expect(job.title.name).toBe(jobData.title.name);

            // ===============================
            // COMPANY
            // ===============================
            expect(job.company.toString()).toBe(companyId.toString());

            // ===============================
            // LOCATION
            // ===============================
            expect(job.location._id.toString()).toBe(jobData.location._id.toString());
            expect(job.location.name).toBe(jobData.location.name);

            // ===============================
            // BASIC FIELDS
            // ===============================
            expect(job.status).toBe('Active');
            expect(job.description).toBe(jobData.description);

            expect(job.jobType).toBe(jobData.jobType);
            expect(job.experienceLevel).toBe(jobData.experienceLevel);

            // ===============================
            // SALARY
            // ===============================
            expect(job.salary).toBeTruthy();

            expect(job.salary.currency).toBe(jobData.salary.currency);
            expect(job.salary.min).toBe(jobData.salary.min);
            expect(job.salary.max).toBe(jobData.salary.max);
            expect(job.salary.frequency).toBe(jobData.salary.frequency);

            // ===============================
            // REQUIREMENTS (OBJECT)
            // ===============================
            expect(job.requirements).toBeTruthy();

            expect(job.requirements.description)
            .toBe(jobData.requirements.description);

            expect(job.requirements.education)
            .toBe(jobData.requirements.education);

            expect(job.requirements.yearsOfExperience)
            .toBe(jobData.requirements.yearsOfExperience);

            expect(job.requirements.certifications)
            .toEqual(jobData.requirements.certifications);

            // ===============================
            // SKILLS (ARRAY OF OBJECTS)
            // ===============================
            expect(job.skills).toHaveLength(jobData.skills.length);

            job.skills.forEach((skill, index) => {
            expect(skill._id.toString())
                .toBe(jobData.skills[index]._id.toString());

            expect(skill.name)
                .toBe(jobData.skills[index].name);

            expect(skill.requirementLevel)
                .toBe(jobData.skills[index].requirementLevel);
            });

            // ===============================
            // PRE-SCREENING QUESTIONS
            // ===============================
            expect(job.preScreeningQuestions)
            .toHaveLength(jobData.preScreeningQuestions.length);

            job.preScreeningQuestions.forEach((q, index) => {
            expect(q.question)
                .toBe(jobData.preScreeningQuestions[index].question);

            expect(q.required)
                .toBe(jobData.preScreeningQuestions[index].required);
            });

            // ===============================
            // APPLICANTS
            // ===============================
            expect(job.applicants).toBeDefined();
            expect(Array.isArray(job.applicants)).toBe(true);
            expect(job.applicants.length).toBe(0);

            dataTracker.trackJob(job._id);
        });
    });
});