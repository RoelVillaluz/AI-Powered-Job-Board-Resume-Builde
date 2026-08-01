# AGENTS.md — Backend Tests

## Testing — Always Use the Factory/Seeder Pattern

Before writing any test that creates database documents, locate and reuse the existing factory system. Never scaffold ad-hoc setup or call `Model.create()` with inline objects.

**Source of truth files to check first:**

| File | What it defines |
|---|---|
| `src/tests/factories/definitions/index.js` | All entity factory definitions (`user`, `resume`, `job`, `resumeScore`, `resumeJobMatch`, etc.) and their traits |
| `src/tests/factories/definitions/entries.js` | Subdocument-array-entry builders (`richMatchEntry` for `matches[]` entries) — plain exports, no `registry.define()` |
| `src/tests/factories/definitions/refs.definitions.js` | Embedded ref factories (`skillRef`, `locationRef`, `jobTitleRef`) |
| `src/tests/factories/seeders.js` | Compound seeders that create full entity graphs (`seedJobseekerWithResume`, `seedFullScenario`) |
| `src/tests/factories/builders.js` | Fluent `Factory()` builder API |
| `src/tests/factories/registry.js` | `FactoryRegistry` class (`registry.define`, `registry.build`) |

**Usage pattern:**

```javascript
// ✅ Correct — uses factory
import { Factory, seedJobseekerWithResume } from '../../factories/index.js';
import ResumeJobMatch from '../../../models/resumes/resumeJobMatchModel.js';

const { jobseeker, token, resume } = await seedJobseekerWithResume(app, User, Resume);
await Factory('resumeJobMatch')
  .as('withCachedExplanation')              // trait applies canned overrides
  .with({ resume: resume._id })             // field-level overrides merged last
  .for(ResumeJobMatch)                      // Mongoose model for .create()
  .create();
```

```javascript
// ❌ Never — inline object + direct Model.create()
await mongoose.model('ResumeJobMatch').create({  // WRONG — no factory
  resume: resume._id,
  matches: [{ ... }],
});
```

**When adding a new entity factory:**
1. Add `registry.define('entityName', { defaults: ..., traits: ... })` in `definitions/index.js`
2. Register it with sensible defaults — required `_id`-ref fields should be inject-only (not set by default)
3. Add traits for common states (e.g., `withCachedExplanation`, `stale`, `withRichMatches`)
4. Keep definitions side-effect-only — `factories/index.js` imports them for registration. The one exception: shared shapes that tests need to build partial documents around (e.g. `richMatchEntry` for `matches[]` entries) are exported from `definitions/entries.js` and re-exported from `factories/index.js`.

### Factory Pattern (Market Entities)

- `createEmbeddingControllerFactory(config)` — generates `getEmbeddingController` + `generateEmbeddingController`
- `createEmbeddingServiceFactory(config)` — generates CRUD + embedding services with staleness checking and embedding invalidation

### Agent-Context Note (OpenCode Discovery)

`backend/AGENTS.md` is loaded when working anywhere under `backend/`. This file (`backend/src/tests/AGENTS.md`) is loaded when the agent's file reads/edits touch a path under `backend/src/tests/` — where the factory system and all backend integration tests live. Put setup, runner config, and test-only conventions here.
