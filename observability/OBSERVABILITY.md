# Observability

This document covers the monitoring and observability setup for the AI-Powered Job Board platform — including Prometheus metrics, Grafana dashboards, and the OpenTelemetry Collector pipeline.

---

## Stack Overview

| Component | Role |
|---|---|
| **Prometheus** | Scrapes and stores metrics from both services |
| **Grafana** | Visualizes metrics via pre-built dashboards |
| **OpenTelemetry Collector** | Receives OTLP traces/metrics, exports to Prometheus |
| **prom-client** | Node.js metrics instrumentation (backend) |
| **prometheus-fastapi-instrumentator** | Python metrics instrumentation (AI service) |

---

## Architecture

```
Node.js Backend (:5000/metrics) ──┐
                                   ├──► Prometheus (:9090) ──► Grafana (:3000)
Python AI Service (:8000/metrics) ─┘

App (OTLP) ──► OTel Collector (:4317/:4318) ──► Prometheus (:8889)
```

Both services expose a `/metrics` endpoint that Prometheus scrapes every 15 seconds. The OpenTelemetry Collector is an optional layer for trace ingestion and high-cardinality attribute filtering before metrics reach Prometheus.

---

## Starting the Stack

The observability stack is included in the `dev:observe` npm script:

```bash
npm run dev:observe
```

This runs the backend, frontend, AI service, Prometheus, and Grafana concurrently.

To start only the observability components:

```bash
npm run prometheus
npm run grafana
```

| Service | URL |
|---|---|
| Grafana | `http://localhost:3000` |
| Prometheus | `http://localhost:9090` |
| Backend metrics | `http://localhost:5000/metrics` |
| AI service metrics | `http://localhost:8000/metrics` |
| OTel Collector (OTLP gRPC) | `localhost:4317` |
| OTel Collector (OTLP HTTP) | `localhost:4318` |

---

## Prometheus Configuration

**`prometheus.yml`** defines two scrape jobs:

```yaml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'

  - job_name: 'ai-service'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

Both jobs scrape every 15 seconds (global `scrape_interval`).

---

## OpenTelemetry Collector

**`otel-collector-config.yaml`** configures receivers, processors, and exporters.

### Receivers

| Protocol | Endpoint |
|---|---|
| OTLP gRPC | `0.0.0.0:4317` |
| OTLP HTTP | `0.0.0.0:4318` |

### Processors

- **`batch`** — buffers spans and metrics before export (1s timeout, 1024 batch size) to reduce network overhead
- **`attributes`** — strips high-cardinality fields (`http.user_agent`, `http.request_content_length`) that would bloat Prometheus label sets

### Exporters

- **`prometheus`** — exposes processed metrics at `:8889` under the `jobboard` namespace
- **`debug`** — logs basic telemetry output (disable in production by removing from the `traces` pipeline)

### Pipelines

| Pipeline | Receivers | Processors | Exporters |
|---|---|---|---|
| traces | otlp | batch | debug |
| metrics | otlp | batch, attributes | prometheus |

---

## Grafana Dashboard

The pre-built dashboard (`grafana-dashboard.json`) is titled **"Job Board — Matching & Pipeline"** (`uid: jobboard-matching-v1`) and auto-refreshes every 30 seconds. Import it via **Dashboards → Import → Upload JSON**.

The Prometheus datasource is pre-configured via `datasource.yaml` (provisioned automatically if using the Grafana provisioning directory).

### Dashboard Sections

#### Matching Pipeline

Stat panels and time-series for the core job-matching flow.

| Panel | Metric | Description |
|---|---|---|
| Total Match Requests | `jobboard_matching_requests_total` | Cumulative match requests |
| Failed Match Requests | `jobboard_matching_requests_total{status="failed"}` | Turns red at ≥1 failure |
| p95 Match Latency | `jobboard_matching_duration_seconds_bucket` | Yellows at 5s, red at 15s |
| Pinecone Queries | `jobboard_pinecone_queries_total{status="success"}` | Successful vector DB queries |
| Fallback Triggers | `jobboard_pinecone_fallback_total` | Fallback activations (yellows at 5, red at 20) |
| Match Latency Percentiles | `jobboard_matching_duration_seconds_bucket` | p50 / p95 / p99 over time |
| Match Request Rate | `jobboard_matching_requests_total` | Success/s and Failed/s over time |

#### AI Service Handlers

Per-endpoint request rates and latencies for the Python AI service.

| Panel | Description |
|---|---|
| Handler Request Rate by Endpoint | Success req/s broken down by handler name |
| Handler p95 Latency by Endpoint | p95 duration per handler |
| Handler Failures | Failed req/s per handler |
| Matching Candidates Scored Distribution | p50 / p95 of candidates evaluated per match request |

#### Score Distribution

Tracks how match scores are distributed across quality tiers over time.

| Panel | Description |
|---|---|
| Match Score Tiers Over Time | Rate of Best Fit / Good Fit / Stretch / Poor Fit results |
| Average Match Score | Rolling average score across all match requests |

#### Embedding Pipeline

Monitors the BullMQ embedding workers for resume and job entities.

| Panel | Description |
|---|---|
| Embedding Jobs Processed | Resume/s, Job/s, and Failed/s embedding throughput |
| AI Service Embedding Duration | p95 embedding latency per entity type |

#### Reconciliation

Tracks the backfill/repair pipeline that catches missed embeddings.

| Panel | Description |
|---|---|
| Reconciliation Runs | Completed and skipped runs per hour |
| Items Repaired by Reconciliation | Resumes, jobs, and Pinecone gaps repaired per hour |

#### Pinecone Usage

Monitors vector database usage and fallback behavior.

| Panel | Description |
|---|---|
| Pinecone vs Fallback Rate | Direct Pinecone queries vs fallback activations |
| Fallback Reason Breakdown | `below_threshold` vs `error` fallback causes |

#### Model Health

| Panel | Description |
|---|---|
| AI Model Loaded | Binary gauge — red if model is not loaded |
| Salary Prediction Requests | Success/s and Failed/s for salary prediction endpoint |

---

## Metric Reference

### Node.js Backend (`prom-client`)

| Metric | Type | Labels | Description |
|---|---|---|---|
| `jobboard_matching_requests_total` | Counter | `status` | Total match pipeline invocations |
| `jobboard_matching_duration_seconds` | Histogram | — | End-to-end match latency |
| `jobboard_match_score_distribution` | Histogram | `recommendation_type` | Score values by tier (Best Fit, Good Fit, Stretch, Poor Fit) |
| `jobboard_pinecone_queries_total` | Counter | `status` | Pinecone vector query attempts |
| `jobboard_pinecone_fallback_total` | Counter | `reason` | Fallback activations with cause |
| `jobboard_embedding_jobs_total` | Counter | `entity`, `status` | BullMQ embedding job completions |
| `jobboard_reconciliation_runs_total` | Counter | `status` | Reconciliation pipeline runs |
| `jobboard_reconciliation_repaired_total` | Counter | `entity` | Entities repaired by reconciliation |

### Python AI Service (`prometheus-fastapi-instrumentator`)

| Metric | Type | Labels | Description |
|---|---|---|---|
| `aiservice_handler_requests_total` | Counter | `handler`, `status` | Request count per AI handler endpoint |
| `aiservice_handler_duration_seconds` | Histogram | `handler` | Latency per handler |
| `aiservice_matching_candidates_scored` | Histogram | — | Number of candidates evaluated per match request |
| `aiservice_embedding_duration_seconds` | Histogram | `entity` | Embedding generation latency |
| `aiservice_salary_prediction_requests_total` | Counter | `status` | Salary prediction request outcomes |
| `aiservice_model_loaded` | Gauge | — | 1 if the ML model is loaded, 0 otherwise |

---

## Alert Thresholds (Reference)

These are the threshold values baked into the dashboard stat panels. Use them as a starting point when configuring Grafana Alerting rules.

| Signal | Yellow | Red |
|---|---|---|
| p95 match latency | 5s | 15s |
| Failed match requests | — | ≥1 |
| Total match requests | 10 | 50 |
| Fallback triggers | 5 | 20 |
| AI model loaded | — | 0 (not loaded) |

---

## Production Notes

- Remove the `debug` exporter from the OTel Collector `traces` pipeline before deploying to production to avoid log noise.
- If running in Docker, replace `localhost` targets in `prometheus.yml` with service names (e.g., `backend:5000`, `ai-service:8000`).
- The Grafana `datasource.yaml` uses `http://prometheus:9090` — correct for Docker Compose; change to `http://localhost:9090` for local bare-metal setups.
- Consider adding a persistent Grafana volume to preserve dashboard edits across restarts.