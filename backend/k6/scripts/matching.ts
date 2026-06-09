import { login }            from '../helpers/auth.ts';
import { SetupData }        from '../helpers/types.ts';
import { makeScenario }     from './scenarioFactory.ts';
import { matchingMetrics }  from './metrics.ts';

const EMAIL    = __ENV.TEST_EMAIL;
const PASSWORD = __ENV.TEST_PASSWORD;

export function setup(): SetupData {
    if (!__ENV.RESUME_ID) throw new Error('RESUME_ID env var required');
    return { token: login(EMAIL, PASSWORD) };
}

export const matchingScenario = makeScenario({
    path:    'job-matches',
    label:   'matching',
    metrics: matchingMetrics,
});