import { UnrecoverableError } from "bullmq";
import { aiClientStream } from "../../clients/aiClientHandler.js";
import { ComputeConfigV2 } from "./computeRegistryTypesV2.js";

export const runStream = async (
    config: ComputeConfigV2<any, any>,
    payload: Record<string, any>,
    emitSocket: (event: string, data: any) => void,
    progressEvent: string,
    shouldAbort?: () => boolean,
): Promise<{ answer: string; jobId: string }> => {
    const controller  = new AbortController();
    const streamEvent = config.streamEvent ?? `${progressEvent}:chunk`;
    let full   = '';
    let jobId  = '';

    const checkAbort = () => {
        if (shouldAbort?.()) {
            controller.abort();
            throw new UnrecoverableError('Match insight generation aborted by client');
        }
    };

    checkAbort();

    for await (const event of aiClientStream(config.aiEndpoint, payload, controller.signal)) {
        checkAbort();
        switch (event.type) {
            case 'delta':
                full  = event.full ?? (full + (event.delta ?? ''));
                jobId = event.jobId ?? jobId;
                emitSocket(streamEvent, { data: { jobId, type: 'delta', delta: event.delta, full } });
                break;
            case 'restart':
                full = '';
                emitSocket(streamEvent, { data: { jobId, type: 'restart' } });
                break;
            case 'fallback':
                full  = event.answer ?? full;
                jobId = event.jobId ?? jobId;
                emitSocket(streamEvent, { data: { jobId, type: 'fallback', answer: full } });
                break;
            case 'end':
                full  = event.answer ?? full;
                jobId = event.jobId ?? jobId;
                emitSocket(streamEvent, { data: { jobId, type: 'end', answer: full } });
                break;
            case 'error':
                throw new Error(event.message ?? 'AI service stream error');
            default:
                break;
        }
    }

    return { answer: full, jobId };
};
