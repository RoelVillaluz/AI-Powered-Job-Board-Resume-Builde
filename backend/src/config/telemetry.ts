import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

let sdk: NodeSDK | null = null;

if (!otlpEndpoint) {
    console.info('[Telemetry] OTEL_EXPORTER_OTLP_ENDPOINT not set — skipping telemetry init');
} else {
    sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]:    process.env.OTEL_SERVICE_NAME ?? 'backend',
            [ATTR_SERVICE_VERSION]: '1.0.0',
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${otlpEndpoint}/v1/traces`,
        }),
        metricReader: new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter({
                url: `${otlpEndpoint}/v1/metrics`,
            }),
            exportIntervalMillis: 15000,
        }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs':       { enabled: false },
                '@opentelemetry/instrumentation-express':  { enabled: true },
                '@opentelemetry/instrumentation-mongoose': { enabled: true },
                '@opentelemetry/instrumentation-redis':    { enabled: true },
                '@opentelemetry/instrumentation-http':     { enabled: true },
            }),
        ],
    });

    sdk.start();

    process.on('SIGTERM', () => sdk?.shutdown());
    process.on('SIGINT',  () => sdk?.shutdown());
}

export default sdk;