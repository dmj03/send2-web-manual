# Send2 Web Migration — Session Reference

## Project
Angular 17 → Next.js 15 migration pipeline using `orchestrator_web.py`.

## Canonical Run Command
```bash
python orchestrator_web.py \
  --source-root send2-web-main/send2-web-main/src \
  --generated-dir generated \
  --no-hitl \
  --build-gate \
  --claude-cmd "C:/Users/artlptp263user/AppData/Roaming/npm/claude.cmd" \
  --claude-max-turns 100 \
  --pnpm-cmd "C:/Users/artlptp263user/AppData/Roaming/npm/pnpm.cmd"
```

## Resume After Crash
```bash
python orchestrator_web.py \
  --source-root send2-web-main/send2-web-main/src \
  --generated-dir generated \
  --no-hitl \
  --build-gate \
  --claude-cmd "C:/Users/artlptp263user/AppData/Roaming/npm/claude.cmd" \
  --claude-max-turns 100 \
  --pnpm-cmd "C:/Users/artlptp263user/AppData/Roaming/npm/pnpm.cmd" \
  --from-stage <stage-that-crashed>
```

## Rules — Read Before Doing Anything

- NEVER delete `.artifacts/` — it is the resume state for the entire pipeline
- NEVER delete `.mkb/` mid-run — it is the LLM's accumulated memory
- NEVER run without `--build-gate` — inline TypeScript repair must be active
- NEVER make CLI flag decisions without asking the user first
- NEVER stop a run and restart from scratch unless the user explicitly confirms
- ALWAYS discuss before acting on anything that affects the pipeline state
- If the pipeline crashes, resume with `--from-stage` — do not restart from scratch

## Pre-Flight Check (run before every pipeline start)
```bash
python preflight.py
```
All 3 layers must pass (static AST, runner dry-runs, full pipeline dry-run).

## After Pipeline Completes
1. `cd generated && pnpm build` — check for TypeScript errors
2. If errors: identify which stage produced the broken file, re-run that stage only
3. If pages show blank due to API unavailability: re-run `codegen.mocks` with updated prompt
4. Once `pnpm build` is clean: `pnpm dev` to verify the app

## Key Files
| File | Purpose |
|------|---------|
| `orchestrator_web.py` | Main pipeline (~10,700 lines) |
| `preflight.py` | 3-layer pre-flight checker |
| `.artifacts/` | Stage resume checkpoints — NEVER DELETE |
| `.mkb/` | MKB semantic memory — NEVER DELETE MID-RUN |
| `generated/` | Next.js output — safe to delete and regenerate |

## Stage Sequence (42 stages)
Phase 1 — Discovery: `extract.inventory` → `extract.analysis` → `extract.decomposition`
Phase 2 — Planning: `plan.architecture` → `plan.routes` → `plan.state` → `integration_migration`
Phase 3 — Codegen: `scaffold` → `codegen.layout` → `codegen.providers` → `codegen.utils` → `codegen.types` → `codegen.services` → `codegen.mocks` → `codegen.navigation` → `codegen.features.*` (×11) → `codegen.tests` → `code_review` → `assemble` → `copy.static` → `equivalence.audit` → `equivalence.fix` → `ui.layout.match`
Phase 4 — Validation: `ui.spec` → `dualrun.plan` → `validation.structure` → `validation.types` → `validation.routes` → `validation.5layer`
Phase 5 — Report: `documentation` → `feedback.loop` → `report`

## Current Status (as of 2026-04-16)
- All 42 stages completed ✅
- `pnpm build` passes clean (exit 0), 37 pages generated
- `codegen.mocks` re-ran to fix MSW browser.ts stub → now real MSW setup
- `codegen.tests` re-ran twice — still only 14 test files due to MKB anchoring problem (see below)
- `assemble`, `equivalence.fix`, `ui.layout.match` re-ran to pick up new mock files ✅
- Known gap: worker.start() not wired into layout.tsx (codegen.mocks prompt scope doesn't include app layout — fix prompt before next project)
- Known gap: 14 test files only (MKB anchoring blocked full regeneration — fix required in orchestrator)

## Completed Stages
Phase 1: extract.inventory ✅ extract.analysis ✅ extract.decomposition ✅
Phase 2: plan.architecture ✅ plan.routes ✅ plan.state ✅ integration_migration ✅
Phase 3: scaffold ✅ codegen.layout ✅ codegen.providers ✅ codegen.utils ✅ codegen.types ✅ codegen.services ✅ codegen.mocks ✅ (re-ran) codegen.navigation ✅ codegen.features.auth ✅ codegen.features.home ✅ codegen.features.search ✅ codegen.features.provider ✅ codegen.features.rate_alert ✅ codegen.features.profile ✅ codegen.features.notification ✅ codegen.features.settings ✅ codegen.tests ✅ (re-ran ×2, MKB anchoring) code_review ✅ assemble ✅ (re-ran) copy.static ✅ equivalence.audit ✅ equivalence.fix ✅ (re-ran) ui.layout.match ✅ (re-ran)
Phase 4: ui.spec ✅ dualrun.plan ✅ validation.structure ✅ validation.types ✅ validation.routes ✅ validation.5layer ✅
Phase 5: documentation ✅ feedback.loop ✅ report ✅

## Current Status (as of 2026-04-16, session 2)
App is running and verified working via `pnpm dev`. All manual fixes applied in `generated/` (git-tracked, reversible). Goal: prove manual fixes work → revert → bake them into orchestrator for next run.

Git commits in `generated/`:
- `607eb5a` — baseline (pipeline output)
- `35e8f09` — middleware, auth cookie, MSW, sidebar, colors, assets
- `a1af90d` — msw package install
- `67022a8` — MSW handler URLs prefixed with full API base URL
- `e016639` — instrumentation.ts (MSW Node server-side)
- `db695b1` — MSW Edge runtime fix + /providers/featured mock
- `18aa9a3` — remove duplicate root middleware.ts
- `d9afe2f` — image domains in next.config.ts

**All verified working:**
- `/` → 200, featured providers loaded from MSW mocks
- `/providers` → 200, provider list from MSW mocks
- `/blog`, `/news` → 200, articles from MSW mocks
- `/search` → 200
- `/login`, `/register`, `/forgot-password` → 200 (no redirect loop)
- `/dashboard`, `/rate-alerts`, `/profile` → 307 → `/login` (auth guard correct)

**Next steps:**
1. Revert `generated/` to baseline: `cd generated && git checkout 607eb5a .`
2. Implement all fixes into `orchestrator_web.py` prompts (see Known Gaps 0A–0F below)
3. Run pipeline again from scratch — result should be a working app with no manual fixes needed

## History / Lessons Learned
- First run was done without `--build-gate` — wasted run, had to restart
- Never explain speed differences without being certain of the reason
- `.artifacts/` was deleted mid-run by mistake — lost all resume checkpoints
- Build gate was in the code from day 1 — just forgot to pass the CLI flag
- codegen.tests passed with only 19 files (no error = pipeline moves on, no quantity check exists)
- Deleting an artifact to force re-run does NOT reset MKB — LLM anchors to old output every time
- Re-running a stage without injecting a correction doc to MKB is pointless — you get the same result
- LLM ignores SCSS variables and invents its own color palette — always pass screenshots + explicit variable extraction instructions
- Never assume the LLM will faithfully convert visual design from code alone — it needs a visual ground truth (screenshot) to not invent a new design
- Middleware routes must be validated against actual app/ directory routes — mismatch causes infinite redirect loops
- MSW worker.start() was never called — mock data infrastructure existed but was completely inactive; all data pages errored
- LLM invented a desktop permanent sidebar that doesn't exist in the original — screenshots + explicit "no desktop sidebar" instruction needed
- Mock data is sufficient for migration verification — real backend only needed for production deployment

## Known Gaps — Must Fix Before Next Migration Project

### 0A. Visual Reference Screenshots Missing from Pipeline (CRITICAL — caused wrong UI this run)
**What happened:** The generated Next.js app has completely wrong brand colors (blue `#2563eb` instead of purple `#5a37fd`), wrong font (Inter instead of Raleway), wrong layout (left sidebar added that doesn't exist in the original), and wrong logo. The LLM read the Angular source code but invented its own design instead of faithfully replicating the original visual design.

**Root cause:** The pipeline passes Angular TypeScript, HTML templates, and SCSS to the LLM — but the LLM cannot *see* what the running app looks like. Even though `_variables.scss` had the correct colors (`$primary: #5a37fd`, `$secondary: #f5ab4e`), the LLM ignored them and chose a generic blue SaaS design. Without a visual ground truth, the LLM fills gaps with its own judgment.

**Evidence:** Original brand = purple/violet `#5a37fd` + orange `#f5ab4e` + Raleway font + top-nav-only layout. Generated app = blue `#2563eb` + Inter font + top nav + left sidebar. Completely different visual identity.

**How to fix for next project — three changes to `orchestrator_web.py`:**

1. Add `--screenshots-dir` CLI flag pointing to a folder of original app screenshots (one per key page: home, search, provider, auth, profile, settings)

2. In `codegen.layout` and all `codegen.features.*` prompts, attach the relevant screenshot as an image alongside the Angular source:
```python
# In _build_codegen_prompt() for layout + feature stages:
if self.args.screenshots_dir:
    screenshot_path = Path(self.args.screenshots_dir) / f"{feature_name}.png"
    if screenshot_path.exists():
        prompt_images.append(screenshot_path)
        prompt += "\n\nVISUAL REFERENCE: The attached screenshot shows exactly what this page looks like in the original Angular app. Match this design exactly — colors, layout, typography, component shapes."
```

3. In `codegen.layout` prompt specifically, add explicit instruction:
```
Extract the exact brand colors, fonts, and layout structure from _variables.scss and the attached screenshot.
Do NOT invent a new design. Use:
- Primary color: exactly as defined in _variables.scss ($primary)
- Secondary color: exactly as defined in _variables.scss ($secondary)  
- Font family: exactly as defined in _variables.scss ($font-family-sans-serif)
- Layout: match the screenshot — top nav only, no sidebar unless visible in screenshot
```

**Why this matters:** UI fidelity is the most visible output of the migration. A pixel-close match builds confidence that the migration is correct. An invented design means every page needs manual rework after the pipeline runs.

**Screenshots to prepare before next run:** Take screenshots of every key page in the original Angular app before running the pipeline. Store in a `screenshots/` folder at the project root. Pass `--screenshots-dir screenshots/` to the orchestrator.

---

### 0B. Brand Variables Not Extracted to globals.css (CRITICAL — caused wrong UI this run)
**What happened:** `_variables.scss` in the Angular source explicitly defines `$primary: #5a37fd` and `$secondary: #f5ab4e`. The generated `globals.css` uses `--color-brand-600: #2563eb` (blue) — completely ignoring the source variables.

**Root cause:** The `codegen.layout` prompt doesn't explicitly instruct the LLM to read `_variables.scss` and carry over the exact color values. The LLM defaults to a generic palette.

**How to fix for next project:** In `codegen.layout` prompt, add:
```
Before generating globals.css, read src/scss/_variables.scss from the Angular source.
Map every SCSS variable to a CSS custom property:
  $primary → --color-primary
  $secondary → --color-secondary  
  $font-family-sans-serif → --font-sans
Use these exact values in globals.css. Do not substitute or invent values.
```

---

### 0C. MSW Mock Data Never Activated (CRITICAL — hit this run)
**What happened:** All data pages (Blog, Providers, Search results) showed empty/error states. MSW infrastructure was fully generated — fixtures, handlers, browser.ts — but `worker.start()` was never called anywhere in the app. No `.env.local` was generated either. Every API call hit the real backend (`https://api.send2app.com`) which is inaccessible, causing all pages to error.

**Root cause:** The `codegen.mocks` prompt scope generates the MSW files but does not include the app entry point (layout.tsx) in its output. Wiring `worker.start()` into the app requires touching `layout.tsx` which is owned by `codegen.layout`. Neither stage's prompt says "connect MSW to the running app."

**Android equivalent:** Android uses Retrofit mock interceptors injected at the module level via Hilt/Koin — they're active in debug builds automatically, no separate "start" call needed. Web MSW requires an explicit browser worker start which the pipeline missed.

**Mock data vs real backend:** Mock data is sufficient for migration verification, demos, and testing all UI flows. Real backend is only needed for production deployment.

**How to fix for next project — two changes:**

1. In `codegen.mocks` prompt, explicitly instruct: "After generating all mock files, also generate a `MockProvider` client component in `src/components/providers/MockProvider.tsx` that calls `worker.start()` on mount in development. Wire it into the root layout."

2. In `scaffold` or `codegen.mocks` stage, generate `.env.local` with:
```
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_API_URL=https://api.send2app.com
```

3. In `codegen.layout` prompt, add: "If `src/components/providers/MockProvider.tsx` exists, wrap `<Providers>` with `<MockProvider>` in the root layout."

---

### 0D. Middleware Redirect Loop (CRITICAL — hit this run)
**What happened:** Navigating to any auth-protected page caused `ERR_TOO_MANY_REDIRECTS`. The middleware redirected unauthenticated users to `/authentication/login`, but `next.config.ts` has a permanent redirect from `/authentication/login` → `/login`. And `/login` was not listed in middleware's `AUTH_ROUTES` (which only matched `/authentication/*`). So: middleware → `/authentication/login` → next.config → `/login` → middleware catches `/login` as unprotected unknown route → redirects to `/authentication/login` again → infinite loop.

**Root cause:** The `codegen.navigation` prompt generated middleware using Angular route names (`/authentication/login`) without cross-checking against the actual Next.js app routes (`/login`, `/register`, etc.) defined in the `app/` directory. The `next.config.ts` redirects (generated by `scaffold`) map Angular paths to Next.js paths — but middleware was never updated to match.

**Android equivalent:** Android uses NavController with explicit per-screen auth guards — no global middleware file, so this class of bug doesn't exist.

**How to fix for next project — one change to `codegen.navigation` prompt:**

Add explicit instruction: "Before writing middleware.ts, read the actual route paths from the `app/` directory structure. `AUTH_ROUTES` must match the exact Next.js paths (e.g. `/login`, `/register`), NOT the Angular paths. Also read `next.config.ts` redirects — any path that is a redirect destination must be listed in either `PUBLIC_ROUTES` or `AUTH_ROUTES` to prevent redirect loops."

Also add a post-generation validation step in the orchestrator: after `codegen.navigation`, verify that every redirect destination in `next.config.ts` is covered by a middleware route pattern. Fail the stage if not.

---

### 0E. Desktop Sidebar Invented by LLM (CRITICAL — hit this run)
**What happened:** The generated app has a permanent left sidebar on desktop (Home, Search, Compare links) that does not exist in the original Angular app. The original has a top navigation bar only. The LLM invented the sidebar as a "reasonable" addition to a SaaS dashboard.

**Root cause:** Without a screenshot of the original layout, the LLM interpreted the navigation structure and decided a sidebar was appropriate. The `codegen.layout` prompt did not say "do not add navigation elements that don't exist in the original."

**Android equivalent:** Android XML layouts and Compose are converted literally — the LLM cannot invent a drawer if there's no `DrawerLayout` in the source. Web HTML templates are looser, giving the LLM more freedom to "improve" the design.

**How to fix for next project:**

1. Pass the original app screenshot (with `--screenshots-dir`) — the LLM will see there is no sidebar and not add one.

2. Add explicit instruction to `codegen.layout` prompt: "Do NOT add navigation components (sidebars, drawers, bottom navs) that are not present in the original Angular app. Copy the navigation structure exactly. The original app uses a top navigation bar only."

3. Add to `codegen.navigation` prompt: "Sidebar.tsx should only render as a mobile overlay (drawer). It must NOT render as a persistent element on desktop (`md:block` is wrong). The desktop layout is top-nav-only."

---

### 0F. Runtime Bugs Found During pnpm dev Verification (2026-04-16 session 2)

These bugs were found when running the app for the first time and are all fixable via orchestrator prompt changes:

**F1 — Duplicate middleware.ts at project root (CRITICAL)**
The pipeline generates `middleware.ts` at the project root AND in `src/middleware.ts`. Next.js picks the root-level one first. The root version had Angular route names (`/authentication/login`) in AUTH_ROUTES and redirected to `/authentication/login` — causing redirect loops. The fixed `src/middleware.ts` was silently ignored.
Fix: `assemble` stage must not place `middleware.ts` at the project root. Only `src/middleware.ts` should exist. Add a post-assemble check that deletes any root-level `middleware.ts`.

**F2 — MSW Edge runtime crash (CRITICAL)**
`instrumentation.ts` was compiled for BOTH Node.js runtime and Edge runtime. MSW Node server uses `@mswjs/interceptors/ClientRequest` which is a Node.js-only module — it crashes the Edge runtime compilation. Result: Edge runtime fails but Node.js server still starts. Pages using edge middleware showed errors.
Fix: Add `process.env.NEXT_RUNTIME === 'nodejs'` guard to `instrumentation.ts`. In `codegen.mocks` prompt, add: "The `register()` function in `instrumentation.ts` MUST check `process.env.NEXT_RUNTIME === 'nodejs'` before importing the MSW server module."

**F3 — @mswjs/interceptors not hoisted by pnpm (MEDIUM)**
MSW depends on `@mswjs/interceptors` internally but pnpm did not hoist it to `node_modules/@mswjs/`. Turbopack couldn't resolve it, showing a module-not-found error for the MSW node server even after `instrumentation.ts` was created. Root cause: pnpm strict hoisting.
Fix: Add `@mswjs/interceptors` as an explicit `devDependency` in scaffold stage package.json. When pipeline installs MSW, also run `pnpm add @mswjs/interceptors --save-dev`.

**F4 — Missing /providers/featured mock handler (MEDIUM)**
`FeaturedProviders` server component (on the homepage) fetches `/providers/featured` but the `codegen.mocks` provider handlers only defined `/providers` (list), `/providers/search`, `/providers/compare`, and `/providers/:id`. The featured endpoint was missing, so the homepage showed "Provider data temporarily unavailable."
Fix: In `codegen.mocks` prompt, add: "Read `FeaturedProviders.tsx` and any other server components that call specific sub-routes. Generate mock handlers for ALL endpoints that are actually called, not just the ones in the Angular service."

**F5 — next.config.ts image domains missing mock fixture CDNs (MEDIUM)**
Mock fixtures use images from `cdn.send2.io`, `api.dicebear.com`, and provider brand CDNs (`wise.com`, `westernunion.com`, etc.). Next.js image optimization blocked them all. Each generated a hard error crashing the page render.
Fix: In `codegen.mocks` prompt, add: "After generating fixtures with image URLs, also update `next.config.ts` `images.remotePatterns` to include every hostname used in fixture image URLs."

**F6 — experimental.instrumentationHook deprecated warning (LOW)**
`next.config.ts` had `experimental: { instrumentationHook: true }` which Next.js 15 now warns about since `instrumentation.ts` is auto-loaded. Not a blocker but generates a startup warning.
Fix: Do not include `instrumentationHook` in `next.config.ts`. Remove from `codegen.layout` prompt's config template.

---

### 0. MKB Anchoring on Re-runs (CRITICAL — hit this run)
**What happened:** `codegen.tests` generated only 19 files on first run. No errors triggered, so it passed. Deleting the artifact forced a re-run, but the LLM queried MKB, found "19 files correctly generated", and anchored to that output — producing 14 files on every subsequent re-run. Three re-run attempts all produced the same result.

**Root cause:** Two independent systems:
- Orchestrator skip logic reads `.artifacts/` (deleted → re-runs)
- LLM memory reads `.mkb/*.jsonl` (not deleted → still anchored to old output)

Deleting the artifact only fixes System 1. MKB (System 2) is untouched.

**How to fix for next project — two changes to `orchestrator_web.py`:**

1. Add `inject_correction_document()` method:
```python
def inject_correction_document(self, stage: str, gap_description: str):
    self.mkb.write_document(
        doc_type="correction",
        stage=stage,
        content=gap_description,
        metadata={"corrects_stage": stage, "injected_at": datetime.now(UTC).isoformat()}
    )
```
Add `--inject-correction stage:message` CLI flag so it can be called before a targeted re-run.

2. Add quantity check on `codegen.tests` — fail the stage if fewer than N test files generated:
```python
# After codegen.tests completes, count test files
test_files = list(Path(generated_dir).rglob("*.test.ts*"))
if len(test_files) < min_expected_tests:  # e.g. len(app_routes)
    raise InsufficientOutputError(f"codegen.tests: {len(test_files)} files, expected {min_expected_tests}")
```
This forces the repair loop to run instead of silently passing with insufficient output.

**Android has the same gap** — neither orchestrator solves this. This is a new improvement, not an Android parity item.

---

### 1. Inline Compile Gates (mid-codegen stages)
**What it is:** The Android orchestrator runs a compile/build gate after every major codegen stage (layout, providers, utils, types, services, mocks, navigation) — not just after feature stages. This catches TypeScript errors immediately after each stage rather than waiting for the full feature to finish.

**What the web pipeline does instead:** Build gates only run after each feature stage (`codegen.features.*`). Errors in earlier stages (layout, utils, types, etc.) are not caught until much later.

**Why we missed it:** When `orchestrator_web.py` was written, the `--build-gate` flag was assumed to cover everything. The Android parity audit was only done *during a live run* (too late to patch). The gap was flagged in the memory audit (`orchestrator1_gaps_and_bugs.md`) but never actioned before the run started.

**How to fix for next project:** In `_run_pipeline`, add `await self._build_gate_and_repair(stage, f"gate.{stage}")` calls after each of these stages: `codegen.layout`, `codegen.providers`, `codegen.utils`, `codegen.types`, `codegen.services`, `codegen.mocks`, `codegen.navigation`. Mirror the exact pattern used in the feature runners.

---

### 2. Placeholder Resolution Re-run on Navigation Cache Invalidation
**What it is:** The Android orchestrator calls `_resolve_placeholder_screens()` again if the navigation cache is invalidated mid-run. This ensures placeholder pages never slip through to assembly.

**What the web pipeline does instead:** `_resolve_placeholder_screens()` is called once before `assemble`. If navigation cache invalidates after that point, placeholders are not re-resolved.

**Why we missed it:** The re-run trigger was simplified out when writing the web pipeline — it was treated as a one-shot call. The Android parity audit caught this but again, too late in the run to patch safely.

**How to fix for next project:** After `codegen.navigation` completes, check if the navigation cache was invalidated (compare pre/post nav artifact hashes). If invalidated, call `_resolve_placeholder_screens()` again before proceeding to `codegen.tests`.

---

**Root cause of both misses:** The Android vs web pipeline comparison was never done *before* writing `orchestrator_web.py`. It was only done mid-run as a curiosity. In future: always run a full parity audit between the reference orchestrator and the new one *before the first run*, not during.

---

## Full Parity Audit Results (2026-04-16)
15-area deep audit of `orchestrator_web.py` vs `orchestrator 1.py`. Run before the next migration project.

### MATCH (no action needed)
- MKB, Resume/Skip logic, Error handling, IssueCollector, Stage output validation, Artifact writing, Assembly & verification, Equivalence audit/fix, Async/concurrency — all byte-for-byte equivalent.

### MEDIUM gaps (fix before next project)

**M1 — GitHub Publishing missing from web**
Web has no GitHub publishing. Android has full `GitHubSectionPublisher` class + flags: `--github-publish`, `--github-owner`, `--github-token-env`, `--github-private`.
Fix: Port `GitHubSectionPublisher` to web and add CLI flags. Call after pipeline completion if flag set.

**M2 — HITL gates missing from Android**
Web has explicit `_hitl_gate()` with blocking operator approval + `--no-hitl` flag. Android only mentions HITL in prompt comments — no blocking gate.
Fix: Add `_hitl_gate()` to Android and call after discovery stages. Add `--no-hitl` flag for CI runs. (Web is ahead here — not a web problem.)

**M3 — Report stage architecture differs**
Web has an explicit LLM-driven `report` stage in STAGE_SEQUENCE. Android has no report stage — reporting is done via post-gate deterministic artifact only.
Fix: Either add a `report` stage to Android, or move web reporting out of the pipeline into a post-pipeline step. Also expose `--aup-path`, `--mep-path` flags in web to match Android's artifact paths.

**M4 — Dual-run & data-validation not wired in web CLI**
Android has `--dual-run-legacy-output`, `--dual-run-modern-output`, `--data-validate-legacy`, `--data-validate-target` flags and full `DualRunComparator` / `DataValidationRunner` classes. Web classes exist but are not wired to the CLI.
Fix: Add the CLI flags to web's `main()` and wire them to the existing classes.

### LOW gaps (nice to fix, not urgent)

**L1 — Placeholder resolution timing differs**
Android calls `_resolve_placeholder_screens()` after `codegen.navigation`. Web calls it after `codegen.tests`. Both are pre-assemble so functionally equivalent. Return types differ (Android returns string, web returns void).
Fix: Harmonize call site and return type for clarity.

**L2 — Feedback loop mines different stages**
Android extracts `## Upstream Feedback Request:` blocks from: architecture, code_generation, data_migration, test_generation, validation. Web extracts from: analysis, architecture, assemble, validation_5layer, dualrun_plan. Different because stage sequences differ — both cover their equivalent stages.
Fix: Document the mapping explicitly so future changes don't inadvertently drop coverage.

---

## Post-Pipeline Step Audit (2026-04-16)
Everything that runs after `asyncio.run(orchestrator.run())` in `main()`.

### CRITICAL
**GitHub publishing missing from web**
Android calls `maybe_publish_to_github(args, outputs)` after the pipeline — creates a GitHub repo, publishes generated sections as branches, raises and optionally merges PRs. Web has no equivalent function, no CLI flags, nothing. Any workflow that depends on auto-publishing generated code to GitHub will not work from the web pipeline.
Fix: Port `GitHubSectionPublisher` + `maybe_publish_to_github()` from Android. Add flags: `--github-publish`, `--github-owner`, `--github-token-env`, `--github-private`.

### MEDIUM
**No exit code on validation failure (shared gap — both orchestrators)**
If dual-run comparison returns `equivalent: false` or data validation fails, neither orchestrator exits with a non-zero code. The failure is written to JSON but the process exits 0. CI/CD pipelines will see green and never know equivalence failed.
Fix: In both orchestrators, after `maybe_run_dualrun_compare()` and `maybe_run_data_validation()`, check the result and `sys.exit(2)` if either reports failure. Mirror the same `--gate-strict` pattern already used for phase gates.

**Phase gate artifact paths incompatible between platforms**
Android phase gate checks `output_path/discovery.md`, `comprehension.md`, `architecture.md`, etc. Web checks `artifacts_dir/phase1-discovery/extract.inventory.md`, `phase2-planning/plan.architecture.md`, etc. The gate logic, folder structure, and file names are completely different — phase gate configs cannot be shared or reused across platforms.
Fix: Document the artifact map for each platform explicitly. Do not attempt to run Android's phase gate against web artifacts or vice versa.

### LOW (web is ahead here — no fix needed)
- Web dual-run supports live HTTP mode (`--dual-run-angular-url` + `--dual-run-nextjs-url`) — spins up both apps and compares routes live. Android is file-only.
- Web data validation supports live API mode (`--data-validate-angular-url` + `--data-validate-nextjs-url`) — compares API responses from running servers. Android is file-only.

---

## Self-Learning & Repair Gap Audit (2026-04-16)
Deep audit of both orchestrators' self-improvement mechanisms. Read before the next migration project.

### The Core Learning Gap (shared by BOTH orchestrators — HIGH priority)

**Successful repair patterns are never written to MKB.**

When the build/compile gate repair loop succeeds (e.g., fixes 10 TypeScript errors over 3 attempts), the fix is applied to files on disk — but the error pattern and fix strategy are never stored in MKB. Next run starts blind and makes the same class of errors again, burning the same repair attempts.

**Recommended fix for next project:**
In `_build_gate_and_repair()`, after a successful repair (line ~3233 in web), add:
```python
if passed and repaired_files:
    repair_summary = (
        f"Build gate repair successful: {gate_id}\n"
        f"Error progression: {' -> '.join(str(e) for e in errors_per_attempt)}\n"
        f"Files repaired: {repaired_files}\n"
        f"Final repair output:\n{last_repair_output}"
    )
    self.mkb.write_document(
        doc_type="repair_pattern",
        stage=gate_id,
        content=repair_summary,
        metadata={"gate_id": gate_id, "attempts": len(errors_per_attempt), "errors_fixed": errors_per_attempt[0]}
    )
```
This makes repair patterns queryable by future runs. When attempt 1 of a repair sees MKB context that includes "last time we saw TS2345 on a Zustand store import, we fixed it by adding the type parameter" — the repair succeeds in 1 attempt instead of 3.

**Why it matters:** Each project run currently relearns the same TypeScript error patterns from scratch. After 3-4 migration projects with repair-to-MKB wired in, the repair loop would near-instantly fix errors it has seen before.

---

### Feedback Loop — Documents Produced but Not Ingested

The feedback loop LLM produces 5 structured improvement documents:
1. `mkb/angular-nextjs-patterns.md` — patterns + anti-patterns with code examples
2. `mkb/angular-nextjs-risks.md` — risk register
3. `mkb/stage-prompt-improvements.md` — 5+ prompt improvement suggestions
4. `mkb/architecture-decisions-log.md` — 15+ ADR decisions
5. `mkb/completeness-gap-report.md` — gap report with tables

These are output as a stage artifact but are **explicitly blocked from auto-ingestion** by a HITL gate. A human must review and manually write them to `.mkb/` if they want them used in the next run.

**This is intentional design** (not a bug). The HITL gate exists because auto-ingesting LLM self-assessments without review could corrupt MKB with incorrect patterns.

**Recommended workflow for next project:**
After pipeline completes, read `phase5-report/feedback.loop.md`, extract the 5 documents manually, and write them to `.mkb/` as new documents via `mkb.write_document()`. Then the next run's prompts will pick them up via TF-IDF retrieval.

---

### Why Android Doesn't Hit These Bugs

| Bug (web) | Why Android doesn't have it |
|---|---|
| Redirect loop from middleware | Android uses NavController with per-screen auth guards — no global middleware file |
| MSW not activated | Android uses Retrofit mock interceptors injected via Hilt/Koin — active in debug builds automatically, no separate start call |
| LLM invents desktop sidebar | Android XML/Compose layouts are converted literally — LLM cannot invent UI elements not in source |
| Wrong colors | Android resources (`colors.xml`, `Theme.xml`) map directly to output — LLM reads exact hex values, no interpretation needed |

Web has more "interpretation surface" than Android — Angular HTML templates are looser than XML layouts, and web CSS has no single authoritative color file the way Android `colors.xml` does. This is why screenshots + explicit variable extraction matter so much more for web.

---

### Android Improvements Executable in Web (prioritised)

These are things Android does that web could adopt — confirmed executable, no Android-specific dependencies.

**P1 — RECOMMENDED: Repair-to-MKB (described above)**
Highest ROI improvement. Compounds across every future migration project.

**P2 — RECOMMENDED: Transient failure retry on stage validation**
Currently `_validate_stage_output()` raises immediately on any of the 7 error markers — no distinction between transient failures (rate limit, network hiccup → "invocation failed") and permanent ones (bad prompt → "prompt is too long").

Fix: Wrap `_invoke_stage()` with a single retry for transient markers only:
```python
TRANSIENT_MARKERS = {"invocation failed", "reached max turns"}
# If output contains a transient marker, wait 10s and retry once
# If output contains a permanent marker, raise immediately
```
This prevents the entire pipeline from crashing on a momentary Claude API hiccup.

**P3 — OPTIONAL: IssueCollector severity-based stage gating**
Neither orchestrator reads IssueCollector entries to influence stage logic. Both record issues but never act on them. If a CRITICAL issue is recorded in stage 5, stage 6 runs identically.

Fix: After each stage, check `self.issue_collector.has_critical` and optionally pause or warn before continuing. Android doesn't do this either — but it's a clear improvement opportunity in web.

**P4 — OPTIONAL: Repair attempt context accumulation**
Repair attempt N does not receive "here is what attempt N-1 tried and what errors remained." Each attempt is independent.

Fix: Pass `prior_repair_output` to `_build_repair_prompt()`. On attempt 2+, include:
```
## Prior Attempt (attempt 1) — did not fully fix:
<attempt 1 LLM output>
Remaining errors after attempt 1: <list>
Try a different approach.
```
This stops the LLM from retrying the exact same fix strategy that already failed.

---

### What's Already Working Correctly (do not change)

- TF-IDF cosine retrieval — identical and correct in both orchestrators
- MKB cross-run persistence — `.mkb/` accumulates across runs correctly; every stage output is queryable in future runs
- Graph edges (produced/informed) — decision provenance is tracked correctly
- Stage output accumulation — later stages in a run naturally get richer MKB context than earlier ones
- 7 error markers — comprehensive and consistent
- Stall detection in repair loop — byte-for-byte identical to Android, works correctly