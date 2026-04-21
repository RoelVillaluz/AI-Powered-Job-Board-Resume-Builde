import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// ============================================
// SHARED REFERENCE STUBS
// Reusable across job, resume, and company
// ============================================

export const createJobTitleRef = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'Software Engineer',
  ...overrides,
});

export const createLocationRef = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'San Francisco, CA',
  ...overrides,
});

export const createSkillRef = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'JavaScript',
  ...overrides,
});

// ============================================
// FACTORIES
// ============================================

export const createTestUser = (overrides = {}) => ({
  email: `test.user.${Date.now()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  password: 'TestPassword123!',
  role: 'jobseeker',
  isVerified: true,
  ...overrides,
});

export const createTestEmployer = (overrides = {}) =>
  createTestUser({
    email: `test.employer.${Date.now()}@example.com`,
    role: 'employer',
    ...overrides,
  });

export const createTestCompany = (userId, overrides = {}) => ({
  user: userId,
  name: `Test Company ${Date.now()}`,
  industry: ['Technology'],
  location: createLocationRef({ name: 'San Francisco, CA' }),
  description: 'A test company for integration testing purposes',
  website: 'https://testcompany.com',
  size: 50,
  rating: 4.5,
  jobs: [],
  ...overrides,
});

export const createTestJob = (companyId, overrides = {}) => ({
  title: createJobTitleRef({ name: `Software Engineer ${Date.now()}` }),
  company: companyId,
  status: 'Active',
  description: 'A test job posting for integration testing purposes.',
  location: createLocationRef({ name: 'Remote' }),
  jobType: 'Full-Time',
  experienceLevel: 'Mid-Level',
  salary: {
    currency: '$',
    min: 80000,
    max: 120000,
    frequency: 'year',
  },
  requirements: {
    description: 'Strong JavaScript skills required. Experience with Node.js preferred.',
    education: 'Bachelor',
    yearsOfExperience: 3,
    certifications: [],
  },
  skills: [
    createSkillRef({ name: 'JavaScript', requirementLevel: 'Required' }),
    createSkillRef({ name: 'Node.js',    requirementLevel: 'Preferred' }),
    createSkillRef({ name: 'MongoDB',    requirementLevel: 'Nice-to-Have' }),
  ],
  preScreeningQuestions: [
    { question: 'Why do you want to work here?', required: true },
  ],
  applicants: [],
  ...overrides,
});

export const createTestResume = (userId, overrides = {}) => ({
  user: userId,
  jobTitle: createJobTitleRef({ name: 'Full Stack Developer' }),
  firstName: 'Test',
  lastName: 'User',
  phone: '+1 555-000-0000',
  location: createLocationRef({ name: 'San Francisco, CA' }),
  summary: 'A test resume for integration testing purposes.',
  skills: [
    createSkillRef({ name: 'JavaScript', level: 'Advanced' }),
    createSkillRef({ name: 'Node.js',    level: 'Intermediate' }),
    createSkillRef({ name: 'MongoDB',    level: 'Intermediate' }),
  ],
  workExperience: [
    {
      jobTitle: 'Junior Developer',
      company: 'Previous Corp',
      startDate: new Date('2021-01-01'),
      endDate: new Date('2023-01-01'),
      responsibilities: [
        'Built REST APIs with Node.js',
        'Maintained MongoDB collections',
      ],
    },
  ],
  certifications: [
    { name: 'AWS Certified Developer', year: '2022' },
  ],
  socialMedia: {
    facebook: null,
    linkedin: 'https://linkedin.com/in/testuser',
    github: 'https://github.com/testuser',
    website: null,
  },
  predictedSalary: 0,
  ...overrides,
});

// ============================================
// HELPERS
// ============================================

export const hashPassword = async (password) =>
  await bcrypt.hash(password, 10);