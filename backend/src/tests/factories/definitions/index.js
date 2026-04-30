import bcrypt from 'bcrypt';
import { registry } from '../registry';
import { generateVerificationCode } from '../../../helpers/userHelpers.js';

/**
 * Entity factory definitions for the core Ingpo AI collections.
 *
 * Each factory produces a plain object matching its Mongoose schema.
 * Factories that reference other collections (company → user, job → company, etc.)
 * do NOT auto-create those dependencies — inject them via .with({ field: id })
 * or use a seeder from seeders.js which handles the full graph.
 *
 * @see tests/factories/seeders.js for compound entity creation
 * @see tests/factories/definitions/refs.definition.js for embedded ref factories
 */

// ─── TempUser ─────────────────────────────────────────────────────────────────
registry.define('tempUser', {
  defaults: (r) => ({
    email:      `user+${r.seq('user')}@example.com`,
    firstName:  'Test',
    lastName:   'User',
    password:   bcrypt.hashSync('TestPassword123!', 10),
    verificationCode: generateVerificationCode(),
  })
});


// ─── User ─────────────────────────────────────────────────────────────────────

/**
 * Produces a User document.
 *
 * Email is auto-sequenced to prevent uniqueness conflicts across test runs.
 * Password is pre-hashed with bcrypt (cost factor 10).
 *
 * @factory user
 * @traits employer | unverified | admin
 *
 * @example
 * await Factory('user').for(User).create();
 * await Factory('user').as('employer').for(User).create();
 * await Factory('user').as('unverified').with({ email: 'custom@test.com' }).for(User).create();
 */
registry.define('user', {
  defaults: (r) => ({
    email:      `user+${r.seq('user')}@example.com`,
    firstName:  'Test',
    lastName:   'User',
    password:   bcrypt.hashSync('TestPassword123!', 10),
    role:       'jobseeker',
    isVerified: true,
  }),
  traits: {
    /** Sets role to 'employer' */
    employer:   () => ({ role: 'employer' }),

    /** Sets role to 'jobseeker' */
    jobseeker: () => ({ role: 'jobseeker' }),

    /** Sets isVerified to false — use for testing email verification flows */
    unverified: () => ({ isVerified: false }),
    /** Sets role to 'admin' */
    admin:      () => ({ role: 'admin' }),
  },
});

// ─── Company ──────────────────────────────────────────────────────────────────

/**
 * Produces a Company document.
 *
 * ⚠️  `user` is not set by default — always inject via:
 *   - .with({ user: employerId }), or
 *   - seedEmployerWithCompany() from seeders.js
 *
 * Name is auto-sequenced. Location is a fresh locationRef on every call.
 *
 * @factory company
 * @traits large | startup | highRated
 *
 * @example
 * const employer = await Factory('user').as('employer').for(User).create();
 * await Factory('company').with({ user: employer._id }).for(Company).create();
 */
registry.define('company', {
  defaults: async (r) => ({
    name:        `Test Company ${r.seq('company')}`,
    industry:    ['Technology'],
    location:    await registry.build('locationRef'),
    description: 'A test company for integration testing purposes.',
    website:     'https://testcompany.com',
    size:        50,
    rating:      4.5,
    jobs:        [],
  }),
  traits: {
    /** Large enterprise — 5000 employees */
    large:     () => ({ size: 5000, industry: ['Enterprise'] }),
    /** Early-stage startup — 10 employees */
    startup:   () => ({ size: 10 }),
    /** Near-perfect rating — useful for ranking/sort tests */
    highRated: () => ({ rating: 4.9 }),
  },
});

// ─── JobPosting ───────────────────────────────────────────────────────────────

/**
 * Produces a JobPosting document.
 *
 * ⚠️  `company` is not set by default — always inject via:
 *   - .with({ company: companyId }), or
 *   - seedJobWithCompany() from seeders.js
 *
 * Title is auto-sequenced. Location defaults to 'Remote'.
 * Skills are pre-populated with JavaScript, Node.js, and MongoDB refs.
 *
 * @factory job
 * @traits closed | archived | partTime | senior | entry | highSalary
 *
 * @example
 * const { company } = await seedEmployerWithCompany(User, Company);
 * await Factory('job').with({ company: company._id }).for(JobPosting).create();
 * await Factory('job').as('senior', 'highSalary').with({ company: id }).for(JobPosting).create();
 */
registry.define('job', {
  defaults: async (r) => ({
    title:           await registry.build('jobTitleRef', { name: `Engineer ${r.seq('job')}` }),
    status:          'Active',
    description:     'A test job posting for integration testing purposes.',
    location:        await registry.build('locationRef', { name: 'Remote' }),
    jobType:         'Full-Time',
    experienceLevel: 'Mid-Level',
    salary: {
      currency:  '$',
      min:       80000,
      max:       120000,
      frequency: 'year',
    },
    requirements: {
      description:       'Strong JavaScript skills required.',
      education:         'Bachelor',
      yearsOfExperience: 3,
      certifications:    [],
    },
    skills: [
      await registry.build('skillRef', { name: 'JavaScript', requirementLevel: 'Required' }),
      await registry.build('skillRef', { name: 'Node.js',    requirementLevel: 'Preferred' }),
      await registry.build('skillRef', { name: 'MongoDB',    requirementLevel: 'Nice-to-Have' }),
    ],
    preScreeningQuestions: [
      { question: 'Why do you want to work here?', required: true },
    ],
    applicants: [],
  }),
  traits: {
    /** Marks the job as no longer accepting applications */
    closed:     () => ({ status: 'Closed' }),
    /** Moves job to archived state */
    archived:   () => ({ status: 'Archived' }),
    /** Part-time position */
    partTime:   () => ({ jobType: 'Part-Time' }),
    /** Senior-level experience required */
    senior:     () => ({ experienceLevel: 'Senior' }),
    /** Entry-level position */
    entry:      () => ({ experienceLevel: 'Entry' }),
    /** High compensation range — useful for salary filter tests */
    highSalary: () => ({ salary: { currency: '$', min: 150000, max: 250000, frequency: 'year' } }),
  },
});

// ─── Resume ───────────────────────────────────────────────────────────────────

/**
 * Produces a Resume document.
 *
 * ⚠️  `user` is not set by default — always inject via:
 *   - .with({ user: userId }), or
 *   - seedJobseekerWithResume() from seeders.js
 *
 * lastName is auto-sequenced. Skills, work experience, and certifications
 * are pre-populated with realistic defaults.
 *
 * @factory resume
 * @traits noExperience | senior
 *
 * @example
 * const jobseeker = await Factory('user').for(User).create();
 * await Factory('resume').with({ user: jobseeker._id }).for(Resume).create();
 */
registry.define('resume', {
  defaults: async (r) => ({
    jobTitle:  await registry.build('jobTitleRef', { name: 'Full Stack Developer' }),
    firstName: 'Test',
    lastName:  `User${r.seq('resume')}`,
    phone:     '09829631311',
    location:  await registry.build('locationRef'),
    summary:   'A test resume for integration testing purposes.',
    skills: [
      await registry.build('skillRef', { name: 'JavaScript', level: 'Advanced' }),
      await registry.build('skillRef', { name: 'Node.js',    level: 'Intermediate' }),
      await registry.build('skillRef', { name: 'MongoDB',    level: 'Intermediate' }),
    ],
    workExperience: [{
      jobTitle:         'Junior Developer',
      company:          'Previous Corp',
      startDate:        new Date('2021-01-01'),
      endDate:          new Date('2023-01-01'),
      responsibilities: ['Built REST APIs', 'Maintained MongoDB collections'],
    }],
    certifications: [
      { name: 'AWS Certified Developer', year: '2022' },
    ],
    socialMedia: {
      facebook: null,
      linkedin: 'https://linkedin.com/in/testuser',
      github:   'https://github.com/testuser',
      website:  null,
    },
  }),
  traits: {
    /** No work experience — use for testing entry-level or fresh graduate flows */
    noExperience: () => ({ workExperience: [] }),
    /** High predicted salary — use for salary prediction and ranking tests */
    senior:       () => ({ predictedSalary: 150000 }),
  },
});

// ─── ResumeEmbeddings ───────────────────────────────────────────────────────────────────
/**
 * Produces a ResumeEmbedding document.
 *
 * ⚠️ `resume` is not set by default — always inject via .with({ resume: resumeId })
 *
 * Embeddings are empty arrays by default — sufficient for DB persistence tests.
 * The pipeline validates real 768-dim vectors, but seeders only need valid shape.
 *
 * @factory resumeEmbedding
 *
 * @example
 * await Factory('resumeEmbedding').with({ resume: resume._id }).for(ResumeEmbedding).create();
 */
registry.define('resumeEmbedding', {
    defaults: () => ({
        embeddings: {
            jobTitle:  [],
            location:  [],
        },
        meanEmbeddings: {
            skills:         null,
            workExperience: null,
            certifications: null,
        },
        metrics: {
            totalExperienceYears: 0,
        },
        model: {
            name:    'all-mpnet-base-v2',
            version: '1.0',
        },
        generatedAt: new Date(),
    }),
});

/**
 * Produces a ResumeScore document.
 *
 * ⚠️ `resume` is not set by default — always inject via .with({ resume: resumeId })
 *
 * Scores are realistic defaults matching the grade system in ResumeScore schema.
 * The pipeline validates real Python output, but seeders only need valid DB shape.
 *
 * Grade System:
 *   A+ (95-100) | A (90-94) | B+ (85-89) | B (80-84) | C+ (75-79)
 *   C  (65-74)  | D (50-64) | F  (0-49)
 *
 * @factory resumeScore
 * @traits passing | failing | perfect | gradeA | gradeB | gradeC
 *
 * @example
 * await Factory('resumeScore').with({ resume: resume._id }).for(ResumeScore).create();
 * await Factory('resumeScore').as('passing').with({ resume: resume._id }).for(ResumeScore).create();
 */
registry.define('resumeScore', {
    defaults: () => ({
        completenessScore:        50,
        experienceScore:          40,
        skillsScore:              70,
        certificationScore:       0,
        totalScore:               52.5,
        grade:                    'D',
        estimatedExperienceYears: 2,
        strengths:                ['Diverse skill set'],
        improvements:             ['Add more work experience'],
        recommendations:          [],
        overallMessage:           'Below-average resume that needs improvement.',
        predictedSalary:          null,
        predictedSalaryRange:     { min: null, max: null },
        salaryConfidence:         null,
        salaryPercentile:         null,
        calculatedAt:             new Date(),
        calculationVersion:       '1.0',
    }),
    traits: {
        /** D grade (50-64) — default, needs improvement */
        failing: () => ({
            completenessScore: 20,
            experienceScore:   10,
            skillsScore:       30,
            certificationScore: 0,
            totalScore:        20,
            grade:             'F',
            overallMessage:    'Resume needs significant improvement.',
            strengths:         [],
            improvements:      ['Add work experience', 'Complete all sections', 'Add certifications'],
        }),

        /** C grade (65-74) — average */
        average: () => ({
            completenessScore: 65,
            experienceScore:   60,
            skillsScore:       70,
            certificationScore: 0,
            totalScore:        68,
            grade:             'C',
            overallMessage:    'Average resume with room for improvement.',
            strengths:         ['Some relevant skills'],
            improvements:      ['Add more certifications', 'Expand work experience'],
        }),

        /** B grade (80-84) — good */
        passing: () => ({
            completenessScore: 80,
            experienceScore:   75,
            skillsScore:       90,
            certificationScore: 50,
            totalScore:        80,
            grade:             'B',
            overallMessage:    'Good resume with solid experience.',
            strengths:         ['Strong skill set', 'Good work history'],
            improvements:      ['Add more certifications'],
        }),

        /** A grade (90-94) — excellent */
        excellent: () => ({
            completenessScore: 95,
            experienceScore:   90,
            skillsScore:       95,
            certificationScore: 80,
            totalScore:        92,
            grade:             'A',
            overallMessage:    'Excellent resume with comprehensive experience.',
            strengths:         ['Outstanding skill set', 'Extensive work history', 'Strong certifications'],
            improvements:      [],
        }),

        /** A+ grade (95-100) — perfect score boundary test */
        perfect: () => ({
            completenessScore:  100,
            experienceScore:    100,
            skillsScore:        100,
            certificationScore: 100,
            totalScore:         100,
            grade:              'A+',
            overallMessage:     'Outstanding resume.',
            strengths:          ['Perfect completeness', 'Exceptional experience', 'Full certification coverage'],
            improvements:       [],
        }),

        /** Fresh score — calculatedAt within 7-day freshness window */
        fresh: () => ({
            calculatedAt: new Date(),
        }),

        /** Stale score — calculatedAt beyond 7-day freshness window, triggers regeneration */
        stale: () => ({
            calculatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        }),

        /** Has salary prediction — for testing salary-related features */
        withSalary: () => ({
            predictedSalary:      95000,
            predictedSalaryRange: { min: 85000, max: 110000 },
            salaryConfidence:     75,
            salaryPercentile:     60,
        }),
    },
});