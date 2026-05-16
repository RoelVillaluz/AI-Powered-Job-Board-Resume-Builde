# `salary_intelligence`

A self-contained domain package for salary normalization and prediction.
Built as part of a resume intelligence platform — consumes pre-fetched data
from a Node.js layer and produces typed, explainable salary estimates.

---

## Overview

The package has two responsibilities:

**Normalization** — convert raw salary figures (any currency, any frequency)
into a canonical yearly + monthly amount in base currency (USD). Used across
the platform wherever salary data is read or compared.

**Prediction** — given a candidate profile and market data, produce a salary
point estimate with a confidence-driven range and a full step-by-step
adjustment breakdown.

---

## Architecture

```
salary_intelligence/
├── normalization/
│   ├── base.py
│   │   → Shared base utilities and guards for normalization logic (validation, helpers, shared patterns)
│
│   ├── constants.py
│   │   → Global constants for salary computation (frequencies, currencies, work-time conventions)
│
│   ├── types.py
│   │   → Typed result models (NormalizedSalary, AnchorResult, etc.) used across the pipeline
│
│   ├── frequency_normalizer.py
│   │   → Converts salary inputs across time units (hour/day/month/year → standardized yearly format)
│
│   ├── currency_normalizer.py
│   │   → Handles currency conversion using exchange rates and ensures consistent base currency output
│
│   └── salary_normalizer.py
│       → Orchestrates frequency + currency normalization into a unified standardized salary object
│
├── prediction/
│   ├── identity/
│   │   ├── effective_seniority.py
│   │   │   → Adjusts claimed seniority based on experience and skill signals (prevents over-leveling)
│   │   │
│   │   └── skill_title_alignment.py
│   │       → Measures alignment between resume skills and job title; produces blend weight for anchoring
│   │
│   ├── anchor/
│   │   └── anchor_resolver.py
│   │       → Resolves base salary anchor using fallback chain (job title → industry → overall medians)
│   │
│   ├── adjustments/
│   │   ├── location_factor.py
│   │   │   → Adjusts salary using geographic cost-of-living and local market scaling
│   │   │
│   │   ├── experience_multiplier.py
│   │   │   → Applies logarithmic experience-based salary scaling with seniority-aware caps
│   │   │
│   │   └── skill_premium.py
│   │       → Computes skill-driven salary uplift using demand, growth, and proficiency level weighting
│   │
│   ├── distribution/
│   │   └── talent_deviation.py
│   │       → Maps candidate signals into a market distribution percentile to produce final salary estimate
│   │
│   └── __init__.py
│       → Internal package initializer for prediction modules
│
├── application/
│   └── salary_prediction_orchestrator.py
│       → Main pipeline orchestrator coordinating all prediction stages into a final salary output
│
└── __init__.py
    → Public package entry point for salary_intelligence module
```

---

## Design Principles

**Pure compute — zero DB access.**
All data is pre-fetched by the Node.js layer and passed in via typed payloads.
Python never touches the database. This keeps the prediction pipeline fast,
testable, and free of I/O side effects.

**Graceful degradation over crashes.**
Every step has a passthrough path for missing data. A prediction with no
location data, no experience years, and no skills still returns a result —
just with a low confidence score and a wide salary band. The pipeline never
raises on incomplete input.

**Typed results at every step.**
Each module returns a `NamedTuple` with full provenance — not just the
adjusted salary, but the delta, the multiplier, the inputs used, and any
confidence penalties incurred. Downstream modules consume these directly
without recomputing.

**Single responsibility per module.**
`SalaryPredictionService` produces numbers. `ExplanationBuilder` produces
text. `ConfidenceScorer` produces the final confidence report. None of these
cross into each other's domain.

---

## Prediction Pipeline

The prediction is a sequential chain where each step's output feeds the next:

```
effective_seniority → skill_title_alignment → anchor → location
    → experience → skill_premium → talent_deviation → confidence + range
    → SalaryPrediction
```

Steps 3 and 4 (experience, skill premium) still run and produce full typed
results. However, their **dollar output** is only used in fallback mode when
`location.salaryData` is absent. Their **signal outputs** (`pct_of_ceiling`,
`portfolio_score`) always feed into TalentDeviation.

---

### Step 0 — Effective Seniority (`effective_seniority.py`)

Prevents title inflation from inflating salary estimates. The seniority
claimed on the resume is downgraded to the level the candidate's data
actually supports, based on years of experience and skill count.

A `was_downgraded` flag is returned so the explanation layer can surface
a note to the candidate. Both conditions (years **and** skills) must be met
to keep the claimed level — failing either triggers a downgrade.

**Downgrade thresholds:**

| Claimed | To keep it | Fallback if not met |
|---------|-----------|---------------------|
| Senior | ≥ 6 yrs **and** ≥ 12 skills | Mid-Level (if ≥ 3 yrs + 8 skills), otherwise Entry |
| Mid-Level | ≥ 1 yr **and** ≥ 6 skills | Entry |
| Entry / Intern | — | No downgrade ever |

---

### Step 0.5 — Skill-Title Alignment (`skill_title_alignment.py`)

Measures how well the candidate's skills match what the job title actually
requires. Drives two downstream effects:

1. **Anchor blending** — low alignment shifts the anchor away from the job
   title benchmark toward the industry median, preventing title inflation
   from producing unrealistic estimates even after seniority downgrade.

2. **Confidence penalty** — low alignment reduces the confidence score,
   widening the salary range band.

**Alignment score formula:**

```
importance_weight = { Required: 1.0, Preferred: 0.7, Nice-to-Have: 0.4 }
level_weight      = { Expert: 1.0, Intermediate: 0.7, Beginner: 0.4 }

for each matched skill:
    contribution = importance_weight × level_weight

alignment_score = sum(contributions) / sum(all importance_weights)
```

**Blend weight derivation:**

```
alignment >= 0.60  →  blend_weight = 1.0  (full job title anchor)
alignment <= 0.25  →  blend_weight = 0.0  (full industry anchor)
between            →  linear interpolation
```

Labels: `Strong` (≥ 0.60) / `Partial` (0.25–0.60) / `Weak` (≤ 0.25)

**Confidence penalties:**

| Condition | Penalty |
|-----------|---------|
| Weak alignment (≤ 0.25) | −30 |
| Partial alignment | −15 |
| No topSkills data on job title | −10 |

---

### Step 1 — Anchor (`anchor_resolver.py`)

Resolves the base salary using a 5-level fallback chain, from most specific
to least specific. Both the job title anchor and the industry anchor are
resolved independently, then blended according to `blend_weight` from Step 0.5.

| Level | Source | Confidence |
|-------|--------|------------|
| 1 | `JobTitle.salaryData.bySeniority[level].median` | 90 |
| 2 | `JobTitle.salaryData.medianSalary` | 65 |
| 3 | `Industry.salaryBenchmarks.bySeniority[level].median` | 40 |
| 4 | `Industry.salaryBenchmarks.overallMedian` | 20 |
| 5 | No data | 0 |

When blending occurs (partial alignment), the blended confidence is a
weighted average of both anchors' confidence scores, penalised for
uncertainty. The anchor confidence is the baseline for the final confidence
score — every subsequent step can only decrease it, never increase it.

---

### Step 2 — Location (`location_factor.py`)

Applies two separate adjustments to the anchor:

```
nominal     = anchor × (1 + baselineFactor)
real_value  = nominal × (100 / costOfLivingIndex)
```

**Nominal** is what the market actually pays in that location. Used as input
to the experience and skill premium steps.

**Real value** is the purchasing power equivalent in a baseline-cost market.
Surfaced in the explanation layer for context — not used in the prediction.

`salaryData` (p25/p75/median) is passed through to Step 5 without any cap
applied. In prior versions a hard median cap fired here, which was the
primary cause of near-zero spread between strong and weak candidates — both
entered downstream steps at the same capped input value.

**Confidence penalties:**

| Condition | Penalty |
|-----------|---------|
| No location data | −20 |
| No baselineFactor | −10 |
| No costOfLivingIndex | −5 |

---

### Step 3 — Experience (`experience_multiplier.py`)

Applies a logarithmic experience premium to the nominal salary:

```
multiplier        = 1.0 + (max_premium × log(1 + years) / log(1 + target_years))
experience_salary = nominal × multiplier
```

Logarithmic rather than linear because real-world salary growth has
diminishing returns — the jump from 0→2 years is large; from 7→9 years
is marginal. The multiplier is clamped to `[1.0, 1.0 + max_premium]`.

The `pct_of_ceiling` output (years / target_years, clamped to 1.0) feeds
into TalentDeviation as an experience signal in fallback mode.

**Seniority profiles:**

| Level | Target years | Max premium |
|-------|-------------|-------------|
| Intern | 1 yr | 10% |
| Entry | 2 yr | 20% |
| Mid-Level | 5 yr | 35% |
| Senior | 10 yr | 45% |

**Confidence penalty:** −15 when experience years are missing.

---

### Step 4 — Skill Premium (`skill_premium.py`)

Applies a demand-weighted, proficiency-aware skill portfolio premium:

```
demand_score(skill)  = (demandScore/100 × 0.6) + (growthRate/100 × 0.4)
level_weight         = { Beginner: 0.40, Intermediate: 0.75, Expert: 1.00 }
weighted_score       = demand_score × seniorityMultiplier × level_weight

portfolio_score      = weighted average across all skills
                       (weight per skill = seniorityMultiplier × level_weight)

raw_premium          = max_premium × portfolio_score ^ (1 / acceleration)
multiplier           = 1.0 + raw_premium
```

`level_weight` prevents breadth without depth from inflating the score —
17 Beginner skills no longer outscores 5 Expert skills. The `portfolio_score`
output feeds into TalentDeviation as a skill quality signal in fallback mode.

Skills use a power curve (not logarithmic) because the relationship is convex:
a mediocre portfolio gets a modest premium; an elite one gets a
disproportionately large one, reflecting how the market prices specialists
over generalists.

**Seniority profiles:**

| Level | Max premium | Acceleration | Curve shape |
|-------|------------|--------------|-------------|
| Intern | 12% | 1.00 | Linear |
| Entry | 25% | 0.85 | Mild curve |
| Mid-Level | 45% | 0.70 | Meaningful curve |
| Senior | 60% | 0.55 | Steep — specialists break away here |

**Confidence penalties:**

| Condition | Penalty |
|-----------|---------|
| No skill data | −20 |
| Fewer than 6 skills | −10 |

---

### Step 5 — Talent Deviation (`talent_deviation.py`)

Maps the candidate's overall strength to a position within the local market
salary distribution (p25 → p75), producing the final predicted salary.

This replaces the old multiplier-chain approach, which compressed all candidates
into a maximum ~$1,530 spread regardless of quality difference. Now the full
p25→p75 range is available as signal space.

---

**Primary mode — `resume_score` (when `ResumeScore.totalScore` is available):**

```
skill_breadth_factor = min(1.0, skill_count / 8)
adjusted_score       = resume_score × (0.5 + 0.5 × skill_breadth_factor)
percentile           = adjusted_score / 100
predicted            = p25_usd + (p75_usd − p25_usd) × percentile
```

The resume scorer (0–100, calibrated deterministically) is used directly as
the percentile signal. No power curve is applied — the scorer already encodes
qualitative judgment. The breadth factor discounts candidates with fewer than
8 skills, but only moves the score between 50% and 100% of its raw value —
not 0–100% — preventing double-penalisation of candidates who already scored
low due to weak skills.

> **Note on the two skill thresholds:**
> `MIN_SKILLS_FOR_FULL_CONFIDENCE` in `skill_premium.py` is **6** (fires a
> confidence penalty only). `MIN_SKILLS_FOR_NO_PENALTY` here is **8** (affects
> the predicted salary itself, fading out gradually). These are intentionally
> different constants doing different jobs.

---

**Fallback mode — `pipeline_signal` (when scorer hasn't run yet):**

```
signal     = alignment × 0.45 + portfolio × 0.40 + exp_pct × 0.15
percentile = signal ^ 0.75     (power curve retained — signal is weaker)
predicted  = p25_usd + (p75_usd − p25_usd) × percentile
```

The power curve is retained in this mode because the composite signal is
weaker and benefits from the nonlinear boost for top performers. When the
scorer is available, it already encodes that judgment so the curve is dropped.

---

**Fallback mode — no local salary range:**

```
modifier   = 0.85 + (percentile × 0.30)    → [0.85×, 1.15×]
predicted  = pre_deviation_salary × modifier
```

Applied when `location.salaryData` is absent. Preserves signal spread without
double-amplifying the existing multiplier chain.

---

### Step 6 — Confidence + Range

The final confidence score accumulates all step penalties on top of the anchor
baseline:

```
confidence = anchor.confidence
           + alignment.confidence_adjustment      # ≤ 0
           + location.confidence_adjustment       # ≤ 0
           + experience.confidence_adjustment     # ≤ 0
           + skill.confidence_adjustment          # ≤ 0
```

The salary band width is derived from the final confidence score:

| Confidence | Band |
|------------|------|
| ≥ 90 | ± 5% |
| 70–89 | ± 10% |
| 50–69 | ± 15% |
| < 50 | ± 25% |

---

## Normalization

`SalaryNormalizer` is the primary entry point for all normalization.

```python
from salary_intelligence.normalization import SalaryNormalizer

result = SalaryNormalizer.normalize(
    amount=650,
    frequency="day",
    currency="₱",
    exchange_rates={"₱": 0.017, "€": 1.08}
)
# result.yearly  → 2873.0
# result.monthly → 239.42
```

Supported frequencies: `hour`, `day`, `week`, `month`, `year`
(plus aliases: `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `annual`).

Supported currencies: `$`, `₱`, `€`, `¥`, `£`.

---

## Prediction

```python
from salary_intelligence.prediction import SalaryPredictionService

prediction = SalaryPredictionService.predict(
    seniority_level=        "Mid-Level",
    resume_score=           74.0,          # from ResumeScore.totalScore; None triggers fallback
    total_experience_years= 4.5,
    job_title_data=         job_title,
    industry_data=          industry,
    location_data=          location,
    skill_market_data=      skills,
    exchange_rates=         rates,
)

prediction.predicted_yearly               # → 112_400.0
prediction.predicted_monthly              # → 9_366.67
prediction.range_min                      # → 101_160.0
prediction.range_max                      # → 123_640.0
prediction.confidence_score               # → 78.0

# Full step breakdown available on the result
prediction.anchor.fallback_level          # → "job_title_by_seniority"
prediction.alignment.alignment_label      # → "Partial"
prediction.location.nominal_yearly        # → 96_000.0
prediction.location.real_value_yearly     # → 75_000.0
prediction.experience.experience_delta    # → +11_200.0
prediction.skill_premium.portfolio_score  # → 0.74
prediction.skill_premium.top_skills       # → [SkillScore("React", ...), ...]
prediction.talent_deviation.percentile    # → 0.74
prediction.talent_deviation.mode          # → "local_range"
```

---

### Node payload shape

```typescript
{
  seniority_level:        "Mid-Level",
  resume_score:           74.0,              // ResumeScore.totalScore — primary percentile signal
                                             // Pass null when scorer hasn't run yet
  total_experience_years: 4.5,

  job_title_data: {
    salaryData: {
      bySeniority: { "Mid-Level": { median: 95000 } },
      medianSalary: 90000,
      currency: "$"
    },
    topSkills: [
      { skillName: "React",      importance: "Required"  },
      { skillName: "TypeScript", importance: "Required"  },
      { skillName: "GraphQL",    importance: "Preferred" },
    ]
  },

  industry_data: {
    salaryBenchmarks: {
      bySeniority: { "Mid-Level": { median: 85000 } },
      overallMedian: 78000,
      currency: "$"
    }
  },

  location_data: {
    name: "San Francisco",
    baselineFactor: 0.40,
    costOfLivingIndex: 180,
    salaryData: {
      salaryRange: { p25: 90000, p75: 140000 },
      currency: "$"
    }
  },

  skill_market_data: [
    { name: "React",      demandScore: 88, growthRate: 22, seniorityMultiplier: 1.4, level: "Expert"       },
    { name: "TypeScript", demandScore: 82, growthRate: 28, seniorityMultiplier: 1.3, level: "Intermediate" },
    { name: "GraphQL",    demandScore: 71, growthRate: 35, seniorityMultiplier: 1.2, level: "Beginner"     },
  ],

  exchange_rates: { "$": 1.0, "₱": 0.017, "€": 1.08, "¥": 0.0065, "£": 1.27 }
}
```

---

## Future Upgrades

Ordered roughly by implementation priority.

---

### Near-term

**Remote vs on-site salary tiers.**
The local salary range (p25/p75) currently reflects in-person market rates.
Strong candidates in lower-cost regions (e.g. Philippines) who target remote
roles compete in the global market, not the local one — and are systematically
undervalued by the current pipeline. The fix is a remote salary range on the
`Location` document, or a separate `RemoteLocation` tier, that TalentDeviation
switches to when the resume or job is flagged as remote. This is the highest
priority fix — validated by real-world data showing strong remote candidates
earning 15–20% above the current pipeline's local-range ceiling.

**Prediction logging for future ML training.**
Every prediction should be written to a `SalaryPrediction` collection with
the full input payload, step outputs, and final result. When users report
their actual offer, the delta (predicted vs actual) becomes labeled training
data. Even 50–100 labeled examples would allow a simple regression model to
correct systematic biases in the heuristic pipeline.

**Scorer-not-run confidence penalty.**
When `resume_score` is `None` and the pipeline falls back to `pipeline_signal`,
a confidence penalty of −15 should be applied to reflect the weaker signal.
Currently this is noted in comments but not enforced in the confidence
accumulation step.

**Skill combination bonuses.**
The `Skill` model has a `similarSkills` relationship that could model synergies
— React + TypeScript + GraphQL being worth more than the sum of their individual
scores. Deferred until real data is available to validate combination weights.

---

### Medium-term

**Light regression validation layer.**
Once ~100 labeled predictions exist (predicted vs actual offer), train a simple
linear or ridge regression on the pipeline's step outputs as features. Use it
as a correction layer on top of the heuristic result rather than replacing it —
this preserves explainability while reducing systematic error.

**Skill salary data as primary premium signal.**
The current skill premium uses `demandScore`, `growthRate`, and
`seniorityMultiplier` as proxies for value. When actual salary delta data per
skill is available (e.g. "Python adds $12k above baseline"), this becomes the
primary signal and demand score becomes a weight. The `SkillPremium.apply`
interface does not need to change — only the payload shape.

**Industry × location interaction.**
The current model treats industry and location as independent adjustments. In
practice they interact — a software engineer salary in San Francisco's tech
industry differs from one in San Francisco's healthcare industry by more than
the industry benchmark alone captures. A cross-term or interaction weight would
improve accuracy for candidates in non-default industry/location combinations.

---

### Longer-term

**Percentile distribution from real resume data.**
TalentDeviation currently uses `resume_score / 100` as a proxy percentile.
Once enough scored resumes exist, the true percentile can be computed by placing
the candidate's score within the actual distribution of scores for that job title
and seniority level. This removes the assumption that scores are uniformly
distributed across 0–100.

**Candidate comparison API.**
Given two resumes for the same role, return a structured comparison: which
candidate scores higher per dimension, what the predicted salary gap is, and
what the lower-ranked candidate would need to close the gap. Useful for both
the employer-facing dashboard and the jobseeker improvement loop.

**Offer negotiation range.**
Extend the prediction output with a negotiation floor and ceiling — the minimum
the candidate should accept given their profile, and the maximum they can
reasonably target given market data. Derived from the existing confidence band,
alignment score, and local salary range.