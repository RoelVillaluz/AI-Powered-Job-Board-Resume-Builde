import http from 'k6/http';
import { sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { authHeaders }    from '../helpers/auth.ts';
import { SetupData }      from '../helpers/types.ts';
import {
    checkQueued,
    checkPollResponse,
} from '../helpers/checks.ts';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';

export interface ScenarioMetrics {
    postRate:     Rate;
    pollRate:     Rate;
    pollMisses:   Counter;
    realErrors:   Counter;
}

export interface ScenarioConfig {
    /** URL path segment after `/api/resumes/:id/`  e.g. `'embeddings'` */
    path:       string;
    /** Human-readable label used in check names and log output */
    label:      string;
    metrics:    ScenarioMetrics;
    /** Seconds to sleep after the POST (default 1) */
    postSleep?: number;
}

/**
 * Returns a k6 scenario function pre-wired with the supplied config and metrics.
 * Usage:
 *   export const embeddingScenario = makeScenario({ path: 'embeddings', label: 'embedding', metrics, postSleep: 3 });
 */
export function makeScenario(cfg: ScenarioConfig): (data: SetupData) => void {
    const { path, label, metrics, postSleep = 1 } = cfg;

    return function scenario(data: SetupData): void {
        const url     = `${BASE_URL}/api/resumes/${__ENV.RESUME_ID}/${path}`;
        const headers = authHeaders(data.token);
        const tags    = { ...headers, tags: { step: label } };

        // ── Cache-check GET ───────────────────────────────────────────────────
        const getRes = http.get(url, tags);
        // 200 = already cached, 404 = not yet computed — both are valid
        checkPollResponse(getRes, `${label} GET (cache)`, metrics.pollMisses, metrics.realErrors);

        sleep(0.5);

        // ── Trigger POST ──────────────────────────────────────────────────────
        const postRes = http.post(url, null, tags);
        checkQueued(postRes, `${label} POST`, metrics.postRate, metrics.realErrors);

        sleep(postSleep);
    };
}