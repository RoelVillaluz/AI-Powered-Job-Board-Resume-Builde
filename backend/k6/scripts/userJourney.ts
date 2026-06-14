import http         from 'k6/http';
import { sleep }    from 'k6';
import { authHeaders } from '../helpers/auth.ts';
import { SetupData }   from '../helpers/types.ts';
import {
    embeddingPostRate,   embeddingErrors,
    scoringPostRate,     scoringErrors,
    matchingPostRate,    matchingErrors,
    salaryPostRate,      salaryErrors,
    embeddingPollRate,   scoringPollRate,
    matchingPollRate,    salaryPollRate,
    embeddingPollMisses, scoringPollMisses,
    matchingPollMisses,  salaryPollMisses,
    embeddingTimeouts,   scoringTimeouts,
    matchingTimeouts,    salaryTimeouts,
    embeddingWorkerDuration,
    scoringWorkerDuration,
    matchingWorkerDuration,
    salaryWorkerDuration,
    checkQueued,
    checkPollResponse,
    recordPollOutcome,
} from '../helpers/checks.ts';

const BASE_URL   = __ENV.BASE_URL || 'http://localhost:5000';
const RESUME_IDS = (__ENV.RESUME_IDS || '').split(',').filter(Boolean);

export function userJourneyScenario(data: SetupData): void {
    // Each VU picks its own resume + token — no shared cache warming
    const idx      = (__VU - 1) % data.resumeIds.length;
    const resumeId = data.resumeIds[idx];
    const token    = data.tokens[idx];

    const base    = `${BASE_URL}/api/resumes/${resumeId}`;
    const headers = authHeaders(token);

    const embeddingHeaders = { ...headers, tags: { step: 'embedding' } };
    const scoringHeaders   = { ...headers, tags: { step: 'scoring'   } };
    const matchingHeaders  = { ...headers, tags: { step: 'matching'  } };
    const salaryHeaders    = { ...headers, tags: { step: 'salary'    } };

    // ── Step 1: Trigger embedding ─────────────────────────────────────────────
    const embedStart = Date.now();
    const embedPost  = http.post(`${base}/embeddings`, null, embeddingHeaders);

    if (embedPost.status === 0) {
        console.error('[FATAL] Cannot reach server');
        sleep(10);
        return;
    }

    checkQueued(embedPost, 'embedding POST', embeddingPostRate, embeddingErrors);

    if (embedPost.status !== 202) {
        console.warn(`[embedding POST failed] status=${embedPost.status} body=${embedPost.body}`);
        sleep(5);
        return;
    }

    let embeddingReady = false;
    for (let i = 0; i < 10; i++) {
        sleep(3);
        const embedGet = http.get(`${base}/embeddings`, embeddingHeaders);
        if (checkPollResponse(embedGet, 'embedding GET', embeddingPollMisses, embeddingErrors)) {
            embeddingReady = true;
            break;
        }
    }

    recordPollOutcome(embeddingReady, 'embedding', embeddingPollRate, embeddingTimeouts, embeddingWorkerDuration, embedStart);
    if (!embeddingReady) { sleep(5); return; }

    sleep(1 + Math.random() * 2); // think time variation

    // ── Step 2: Trigger scoring ───────────────────────────────────────────────
    const scoreStart = Date.now();
    const scorePost  = http.post(`${base}/score`, null, scoringHeaders);
    checkQueued(scorePost, 'score POST', scoringPostRate, scoringErrors);

    if (scorePost.status !== 202) {
        console.warn(`[score POST failed] status=${scorePost.status} body=${scorePost.body}`);
        sleep(5);
        return;
    }

    let scoreReady = false;
    for (let i = 0; i < 10; i++) {
        sleep(3);
        const scoreGet = http.get(`${base}/score`, scoringHeaders);
        if (checkPollResponse(scoreGet, 'score GET', scoringPollMisses, scoringErrors)) {
            scoreReady = true;
            break;
        }
    }

    recordPollOutcome(scoreReady, 'score', scoringPollRate, scoringTimeouts, scoringWorkerDuration, scoreStart);
    if (!scoreReady) { sleep(5); return; }

    sleep(1 + Math.random() * 2);

    // ── Step 3: Trigger matching + salary in parallel ─────────────────────────
    const matchStart  = Date.now();
    const salaryStart = Date.now();

    const [matchPost, salaryPost] = http.batch([
        ['POST', `${base}/job-matches`,       null, matchingHeaders],
        ['POST', `${base}/salary-prediction`, null, salaryHeaders  ],
    ]);

    checkQueued(matchPost,  'matching POST', matchingPostRate, matchingErrors);
    checkQueued(salaryPost, 'salary POST',   salaryPostRate,   salaryErrors);

    if (matchPost.status !== 202 && salaryPost.status !== 202) {
        sleep(5);
        return;
    }

    let matchDone  = matchPost.status  !== 202;
    let salaryDone = salaryPost.status !== 202;
    let matchReady  = false;
    let salaryReady = false;

    for (let i = 0; i < 15; i++) {
        if (matchDone && salaryDone) break;
        sleep(3);

        const batch: [string, string, null, object][] = [];
        if (!matchDone)  batch.push(['GET', `${base}/job-matches`,       null, matchingHeaders]);
        if (!salaryDone) batch.push(['GET', `${base}/salary-prediction`, null, salaryHeaders  ]);

        const results = http.batch(batch);
        let ri = 0;

        if (!matchDone) {
            const ready = checkPollResponse(results[ri], 'matching GET', matchingPollMisses, matchingErrors);
            if (ready) { matchDone = true; matchReady = true; }
            ri++;
        }
        if (!salaryDone) {
            const ready = checkPollResponse(results[ri], 'salary GET', salaryPollMisses, salaryErrors);
            if (ready) { salaryDone = true; salaryReady = true; }
        }
    }

    if (matchPost.status  === 202) recordPollOutcome(matchReady,  'matching', matchingPollRate, matchingTimeouts, matchingWorkerDuration,  matchStart);
    if (salaryPost.status === 202) recordPollOutcome(salaryReady, 'salary',   salaryPollRate,   salaryTimeouts,   salaryWorkerDuration,    salaryStart);

    sleep(2 + Math.random() * 3);
}