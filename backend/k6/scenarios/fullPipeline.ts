import { Options } from 'k6/options';
import { ConstantVUsScenario, RampingVUsScenario } from 'k6/options';
import { SetupData } from '../helpers/types.ts';

export { userJourneyScenario } from '../scripts/userJourney.ts';

export function setup(): SetupData {
    const resumeIds = (__ENV.RESUME_IDS || '').split(',').filter(Boolean);
    const tokens    = (__ENV.USER_TOKENS || '').split(',').filter(Boolean);

    if (!resumeIds.length) throw new Error('RESUME_IDS env var required — run npm run k6:seed first');
    if (!tokens.length)    throw new Error('USER_TOKENS env var required — run npm run k6:seed first');
    if (resumeIds.length !== tokens.length) throw new Error(
        `RESUME_IDS count (${resumeIds.length}) must match USER_TOKENS count (${tokens.length})`
    );

    console.log(`[setup] ${resumeIds.length} resume/user pairs loaded`);
    return { resumeIds, tokens };
}

type ScenarioName = 'smoke' | 'load' | 'stress';

const SCENARIO = (__ENV.SCENARIO || 'load') as ScenarioName;

const smokeScenario: ConstantVUsScenario = {
    executor: 'constant-vus',
    vus:      1,
    duration: '1m',
    exec:     'userJourneyScenario',
};

const loadScenario: RampingVUsScenario = {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
        { duration: '1m', target: 2 },
        { duration: '1m', target: 5  },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0  },
    ],
    exec: 'userJourneyScenario',
};

const stressScenario: RampingVUsScenario = {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
        { duration: '1m', target: 2 },
        { duration: '2m', target: 10 },
        { duration: '3m', target: 20 },
        { duration: '2m', target: 30 },
        { duration: '2m', target: 0  },
    ],
    exec: 'userJourneyScenario',
};

const scenarios: Record<ScenarioName, ConstantVUsScenario | RampingVUsScenario> = {
    smoke:  smokeScenario,
    load:   loadScenario,
    stress: stressScenario,
};

export const options: Options = {
    scenarios: {
        [SCENARIO]: scenarios[SCENARIO],
    },

    thresholds: {
        checks:                              ['rate>0.80'],
        http_req_failed:                     ['rate<0.10'],
        http_req_duration:                   ['p(95)<5000'],
        'http_req_duration{step:embedding}': ['p(95)<5000'],
        'http_req_duration{step:scoring}':   ['p(95)<3000'],
        'http_req_duration{step:matching}':  ['p(95)<8000'],
        'http_req_duration{step:salary}':    ['p(95)<5000'],
        iteration_duration:                  ['p(95)<120000'],
        'embedding_worker_duration_ms':      ['p(95)<30000'],
        'scoring_worker_duration_ms':        ['p(95)<15000'],
        'matching_worker_duration_ms':       ['p(95)<20000'],
        'salary_worker_duration_ms':         ['p(95)<15000'],
    },
};