/**
 * Test Factory System — public entry point.
 *
 * Import everything your tests need from this single file.
 * Never import directly from registry.js, builder.js, or definition files.
 *
 * @module factories
 *
 * @example
 * import { Factory, seedFullScenario, seedJobWithCompany } from '../factories';
 *
 * // Plain object — no DB (unit tests)
 * const jobData = await Factory('job').as('senior').build();
 *
 * // Persist to DB (integration tests)
 * const user = await Factory('user').as('employer').for(User).create();
 *
 * // Full entity graph (application / matching tests)
 * const { job, resume } = await seedFullScenario(User, Company, JobPosting, Resume);
 */

// ─── Load definitions (side-effect imports — order matters) ───────────────────
// refs must load before entity definitions since entities call registry.build('skillRef') etc.
import './definitions/refs.definitions'
import './definitions/index'

// ─── Public API ───────────────────────────────────────────────────────────────
export { Factory }  from './builders';
export { registry } from './registry';
export * from './seeders';