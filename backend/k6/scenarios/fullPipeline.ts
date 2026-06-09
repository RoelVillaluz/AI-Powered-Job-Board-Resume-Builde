import { Options }   from 'k6/options';
import { login }     from '../helpers/auth.ts';
import { SetupData } from '../helpers/types.ts';

export { userJourneyScenario } from '../scripts/userJourney.ts';

const EMAIL    = __ENV.TEST_EMAIL;
const PASSWORD = __ENV.TEST_PASSWORD;

export function setup(): SetupData {
    const token = login(EMAIL, PASSWORD);
    return { token };
}

export const options: Options = {
    scenarios: {
        userJourney: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m',  target: 3 },
                { duration: '3m',  target: 3 },
                { duration: '30s', target: 0 },
            ],
            exec: 'userJourneyScenario',
        },
    },

    thresholds: {
        // Abort test if more than 10% of requests fail
        http_req_failed: [
            {
                threshold: 'rate<0.10',
                // abortOnFail: true,
                delayAbortEval: '30s',
            },
        ],

        checks:                            ['rate>0.80'],
        http_req_duration:                 ['p(95)<5000'],
        'http_req_duration{step:embedding}': ['p(95)<5000'],
        'http_req_duration{step:scoring}':   ['p(95)<3000'],
        'http_req_duration{step:matching}':  ['p(95)<8000'],
        'http_req_duration{step:salary}':    ['p(95)<5000'],
        iteration_duration:                ['p(95)<120000'],
    },
};