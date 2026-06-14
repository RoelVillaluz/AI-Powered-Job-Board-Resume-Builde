import http from 'k6/http';
import { sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { authHeaders } from '../helpers/auth.ts';
import { SetupData }   from '../helpers/types.ts';
import {
    checkQueued,
    checkPollResponse,
} from '../helpers/checks.ts';

const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:5000';
const RESUME_IDS = (__ENV.RESUME_IDS || '').split(',').filter(Boolean);

export interface ScenarioMetrics {
    postRate:   Rate;
    pollRate:   Rate;
    pollMisses: Counter;
    realErrors: Counter;
}

export interface ScenarioConfig {
    path:       string;
    label:      string;
    metrics:    ScenarioMetrics;
    postSleep?: number;
}

export function makeScenario(cfg: ScenarioConfig): (data: SetupData) => void {
    const { path, label, metrics, postSleep = 1 } = cfg;

    return function scenario(data: SetupData): void {
        const idx      = (__VU - 1) % data.resumeIds.length;
        const resumeId = data.resumeIds[idx];
        const token    = data.tokens[idx];

        const url     = `${BASE_URL}/api/resumes/${resumeId}/${path}`;
        const headers = authHeaders(token);
        const tags    = { ...headers, tags: { step: label } };

        const getRes = http.get(url, tags);
        checkPollResponse(getRes, `${label} GET (cache)`, metrics.pollMisses, metrics.realErrors);

        sleep(0.5);

        const postRes = http.post(url, null, tags);
        checkQueued(postRes, `${label} POST`, metrics.postRate, metrics.realErrors);

        sleep(postSleep);
    };
}