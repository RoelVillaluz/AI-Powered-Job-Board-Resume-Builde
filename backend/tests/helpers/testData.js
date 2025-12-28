import bcrypt from 'bcrypt';

/**
 * Factory functions to create consistent test data
 */
export const createTestUser = (overrides = {}) => {
    const defaults = {
    email: `test.user.${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPassword123!',
    role: 'jobseeker',
    isVerified: true,
    ...overrides
  };

  return defaults;
}

export const createTestEmployer = (overrides = {}) => {
  return createTestUser({
    email: `test.employer.${Date.now()}@example.com`,
    role: 'employer',
    ...overrides
  });
};

export const createTestCompany = (userId, overrides = {}) => {
  const defaults = {
    user: userId,
    name: `Test Company ${Date.now()}`,
    industry: ['Technology'],
    location: 'San Francisco, CA',
    description: 'A test company for integration testing purposes',
    website: 'https://testcompany.com',
    size: 50,
    rating: 4.5,
    ...overrides
  };

  return defaults;
};

export const createTestJob = (companyId, overrides = {}) => {
  const defaults = {
    title: `Software Engineer ${Date.now()}`,
    company: companyId,
    location: 'Remote',
    jobType: 'Full-Time',
    experienceLevel: 'Mid-Level',
    salary: {
      currency: '$',
      amount: 100000,
      frequency: 'year'
    },
    requirements: [
      '3+ years of experience',
      'Strong JavaScript skills',
      'Experience with Node.js'
    ],
    skills: [
      { name: 'JavaScript' },
      { name: 'Node.js' },
      { name: 'MongoDB' }
    ],
    preScreeningQuestions: [
      {
        question: 'Why do you want to work here?',
        required: true
      }
    ],
    ...overrides
  };

  return defaults;
};

export const createTestResume = (userId, overrides = {}) => {
  const defaults = {
    user: userId,
    title: `Resume ${Date.now()}`,
    // Add other resume fields based on your resume model
    ...overrides
  };

  return defaults;
};

/**
 * Helper to hash passwords for direct DB insertion
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};