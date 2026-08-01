import { registry } from '../registry';

/**
 * Subdocument-array-entry builders.
 *
 * Distinct from the `registry.define()` entities in index.js: these produce a
 * single entry for an embedded subdocument array (e.g. a `matches[]` entry in
 * a ResumeJobMatch), with no standalone Mongoose model to register against —
 * the registry's `.for(Model)` mechanism does not apply here.
 *
 * Each builder is a plain exported function that returns a fresh entry object
 * on every call. Add future entry builders here (work experience, applications,
 * etc.), not in definitions/index.js.
 *
 * @see tests/factories/definitions/index.js for top-level registry.define() entities
 */

/**
 * Canonical rich job-match entry, matching the shape produced by the hybrid
 * scoring pipeline — components breakdown, career fit, recommendation type,
 * skill gaps, penalties, and inline job metadata. `jobId` is generated fresh
 * on every call; nested `components`/`metadata` overrides deep-merge over the
 * defaults. Exported so tests can build custom `matches` arrays via spread.
 *
 * @param {Object} [overrides={}] Field-level overrides for a single entry
 * @returns {Object} A rich match entry ready to insert into a `matches` array
 *
 * @example
 * richMatchEntry({ jobId: job._id, finalScore: 92 })
 * richMatchEntry({ components: { skillMatch: 90 } })
 */
export const richMatchEntry = (overrides = {}) => {
  const base = {
    jobId: registry.newId(),
    finalScore: 85,
    vectorSimilarity: 0.78,
    components: {
      skillMatch: 80,
      experienceFit: 75,
      semanticSim: 70,
      seniorityFit: 65,
      locationFit: 90,
      certBonus: 50,
    },
    careerFit: 'Strong',
    recommendationType: 'Best Fit',
    matchedSkills: ['JavaScript', 'Node.js'],
    missingSkills: ['Python'],
    missingRequiredSkills: [],
    strengths: ['Strong technical background'],
    improvements: ['Add leadership experience'],
    penalties: [],
    metadata: {
      title: 'Senior Engineer',
      location: 'Remote',
      experienceLevel: 'Senior',
      jobType: 'Full-Time',
      salaryMin: 100000,
      salaryMax: 150000,
      salaryCurrency: '$',
      salaryFrequency: 'year',
    },
  };

  return {
    ...base,
    ...overrides,
    components: { ...base.components, ...(overrides.components ?? {}) },
    metadata: { ...base.metadata, ...(overrides.metadata ?? {}) },
  };
};
