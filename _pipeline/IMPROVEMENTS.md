# orchestrator_web.py — Improvements Backlog
> All items discovered during the Send2 web migration run (2026-04-16).
> Sorted by priority. Fix before the next migration project unless marked OPTIONAL.

---

## CRITICAL

### 1. Wire dual-run CLI flags
**What:** `DualRunComparator` class and `maybe_run_dualrun_compare()` are fully written but unreachable. No `add_argument` calls exist for dual-run flags in `main()`.
**Impact:** Runtime equivalence between Angular and Next.js can never be proven. Pipeline always exits without comparing the two apps.
**Fix:** Add to `main()` argparse:
```python
parser.add_argument("--dual-run-angular-url",   help="Angular app base URL (live HTTP mode)")
parser.add_argument("--dual-run-nextjs-url",     help="Next.js app base URL (live HTTP mode)")
parser.add_argument("--dual-run-routes",         help="Comma-separated routes to compare")
parser.add_argument("--dual-run-legacy-output",  help="Pre-recorded Angular output file (file mode)")
parser.add_argument("--dual-run-modern-output",  help="Pre-recorded Next.js output file (file mode)")
parser.add_argument("--dual-run-report-path",    default=".artifacts/phase4-validation/dualrun.compare.json")
```
**Note:** Also requires both apps running before invoking. Add to post-pipeline workflow docs.

---

### 2. Port GitHub publishing from Android
**What:** Android has `GitHubSectionPublisher` + `maybe_publish_to_github()` — creates a repo, publishes generated sections as branches, raises PRs. Web has nothing.
**Impact:** Cannot auto-publish generated Next.js code to GitHub from the pipeline.
**Fix:** Port `GitHubSectionPublisher` class from `orchestrator 1.py`. Add CLI flags:
```python
parser.add_argument("--github-publish",    action="store_true")
parser.add_argument("--github-owner",      help="GitHub username or org")
parser.add_argument("--github-token-env",  help="Env var name holding GitHub token")
parser.add_argument("--github-private",    action="store_true")
```
Call `maybe_publish_to_github(args, outputs)` after `asyncio.run()` in `main()`.

---

## HIGH

### 3. Write successful repair patterns to MKB
**What:** When the build gate repair loop fixes TypeScript errors, the fix is applied to disk but never written to MKB. Next run starts blind and repeats the same errors.
**Impact:** Every migration project relearns the same TypeScript error patterns from scratch. No compounding improvement across runs.
**Fix:** In `_build_gate_and_repair()`, after a successful repair, add:
```python
if passed and repaired_files:
    self.mkb.write_document(
        doc_type="repair_pattern",
        stage=gate_id,
        content=(
            f"Build gate repair: {gate_id}\n"
            f"Error progression: {' -> '.join(str(e) for e in errors_per_attempt)}\n"
            f"Files repaired: {repaired_files}\n"
            f"Repair output:\n{last_repair_output}"
        ),
        metadata={"gate_id": gate_id, "attempts": len(errors_per_attempt), "errors_fixed": errors_per_attempt[0]}
    )
```
**Note:** Only write high-signal repairs (errors_fixed > 3, attempts > 1) to avoid noise.

---

### 4. Add exit code 2 on dual-run or validation failure
**What:** If dual-run returns `equivalent: false` or data validation fails, the orchestrator exits 0. CI/CD sees green and never knows equivalence failed.
**Impact:** Silent failures in equivalence checking — pipeline reports success when apps don't match.
**Fix:** In `main()`, after `maybe_run_dualrun_compare()` and `maybe_run_data_validation()`:
```python
if dual_run_result and dual_run_result.get("equivalent") is False:
    print("[ERROR] Dual-run equivalence check FAILED", file=sys.stderr)
    sys.exit(2)
if data_validation_result and not data_validation_result.get("passed"):
    print("[ERROR] Data validation FAILED", file=sys.stderr)
    sys.exit(2)
```

---

### 5. Add transient failure retry on stage validation
**What:** `_validate_stage_output()` raises immediately on all 7 error markers with no distinction between transient (rate limit, API hiccup) and permanent (bad prompt) failures.
**Impact:** A momentary Claude API hiccup crashes the entire stage with no recovery.
**Fix:** In `_invoke_stage()`, wrap with single retry for transient markers:
```python
TRANSIENT_MARKERS = {"invocation failed", "reached max turns"}
# On transient marker: wait 10s, retry once
# On permanent marker: raise immediately
```

---

### 6. Add inline build gates on early codegen stages
**What:** Android gates after every major codegen stage. Web only gates after feature stages. Errors in `codegen.layout`, `codegen.utils`, `codegen.types` etc. are not caught until much later.
**Impact:** TypeScript errors introduced in early stages silently propagate through multiple subsequent stages before being caught.
**Fix:** In `_run_pipeline`, add after each of these stages:
```python
await self._build_gate_and_repair("codegen.layout",    "gate.codegen.layout")
await self._build_gate_and_repair("codegen.providers", "gate.codegen.providers")
await self._build_gate_and_repair("codegen.utils",     "gate.codegen.utils")
await self._build_gate_and_repair("codegen.types",     "gate.codegen.types")
await self._build_gate_and_repair("codegen.services",  "gate.codegen.services")
await self._build_gate_and_repair("codegen.mocks",     "gate.codegen.mocks")
await self._build_gate_and_repair("codegen.navigation","gate.codegen.navigation")
```

---

### 7. Manually ingest feedback loop documents into MKB after each run
**What:** The feedback loop LLM produces 5 improvement documents but they are blocked from auto-ingestion by a HITL gate (intentional design). They sit as a stage artifact only.
**Documents produced:** angular-nextjs-patterns, angular-nextjs-risks, stage-prompt-improvements, architecture-decisions-log, completeness-gap-report.
**Impact:** Insights from each run never feed into the next run's prompts.
**Fix (manual workflow):** After pipeline completes, read `.artifacts/phase5-rollout/feedback.loop.md`, extract the 5 documents, and ingest each one:
```python
mkb.write_document(doc_type="feedback_improvement", stage="feedback.loop", content=<doc>)
```
Do this before starting the next migration project.

---

## MEDIUM

### 8. Wire data-validation CLI flags
**What:** Same problem as dual-run. `DataValidationRunner` class exists but `--data-validate-angular-url`, `--data-validate-nextjs-url` flags are not in `main()`.
**Fix:** Add to argparse:
```python
parser.add_argument("--data-validate-angular-url", help="Angular API base URL")
parser.add_argument("--data-validate-nextjs-url",  help="Next.js API base URL")
parser.add_argument("--data-validate-legacy",      help="Pre-recorded legacy API output")
parser.add_argument("--data-validate-target",      help="Pre-recorded Next.js API output")
parser.add_argument("--data-validate-report-path", default=".artifacts/phase4-validation/data.validation.json")
```

---

### 9. Placeholder resolution re-run on navigation cache invalidation
**What:** `_resolve_placeholder_screens()` is called once before assemble. Android re-runs it if navigation cache invalidates.
**Impact:** If navigation stage output changes mid-run, placeholder pages can slip through to assembly undetected.
**Fix:** After `codegen.navigation` completes, hash the navigation artifact. If it differs from a cached hash, call `_resolve_placeholder_screens()` again before `codegen.tests`.

---

### 10. Add repair attempt context accumulation
**What:** Repair attempt N+1 does not receive "here is what attempt N tried and what errors remained." Each attempt is fully independent — the LLM may retry the exact same failed approach.
**Impact:** Slower repair convergence. LLM wastes attempts repeating strategies that already failed.
**Fix:** Pass `prior_repair_output` to `_build_repair_prompt()`. On attempt 2+, include:
```
## Prior Attempt Output (did not fully fix):
<attempt N-1 LLM output truncated to 2000 chars>
Errors remaining after that attempt: <list>
Try a different approach.
```

---

### 15. Repair loop maturity — move from Level 1 (reactive) to Level 2 (aware)
**What:** Deep audit of `_build_gate_and_repair()` revealed three compounding structural gaps:

**Gap A — Stateless loop (no awareness of what already failed)**
Each repair attempt is fully independent. Claude never knows what the previous attempt modified, what got worse, or what to avoid. This directly causes oscillation (fix A → breaks B → fix B → reintroduces A) and wasted attempts repeating the same failed strategy.

Current behaviour (Level 1 — Reactive):
```
Attempt 1: errors=[10 files], prompt has no history → Claude tries fix X
Attempt 2: errors=[8 files], prompt has no history → Claude tries fix X again
Attempt 3: errors=[9 files], stall detected → stop
```

Target behaviour (Level 2 — Aware):
```
Attempt 2 prompt includes:
  "Attempt 1 modified: auth/page.tsx, middleware.ts
   Errors before: 10 | Errors after: 8
   These errors REMAIN unresolved: [list]
   These errors APPEARED NEW after attempt 1: [list]  ← attempt introduced them
   Do NOT repeat the same changes to middleware.ts line 23."
```

**Fix:** Track per-attempt state:
```python
attempt_history = []  # per-attempt: {files_modified, errors_before, errors_after, new_errors}
# On attempt 2+, pass attempt_history[-1] to _build_repair_prompt()
# Include: what was touched, what got worse, what to avoid
```

---

**Gap B — Partial file visibility (top 5 files, arbitrary order)**
File selection is first 5 files in error dict iteration order — not ranked by root cause likelihood. If file 6 is the root cause that 4 other files import, Claude never sees it and fixes symptoms instead.

**Fix:** Rank files by import depth before capping:
```python
# Files that other broken files depend on → shown first
# Files that are leaf nodes (only broken themselves) → shown last
```

---

**Gap C — Static MKB query (same string for every repair, every stage)**
Current query is hardcoded: `"typescript type error import missing module next.js component"` — identical regardless of what errors actually occurred. TS2345 and TS2554 have completely different fix patterns but get the same MKB context.

**Fix:** Construct query dynamically from actual error codes and file names:
```python
query = " ".join(set(
    e.code for e in errors  # TS2345, TS2554, TS2339...
) | set(
    Path(e.file).stem for e in errors[:3]  # actual broken file names
))
mkb_context = self.mkb.build_context_snippet(query)
```

---

**Why the system still works despite all three gaps:**
TypeScript errors are often local and deterministic. Many fixes are pattern-based (imports, types, signatures). The compiler gives high-quality, precise feedback. The loop survives on "brute-force convergence with a strong oracle" — but burns more attempts than necessary.

**Priority:** Gap A (stateless loop) has the highest leverage. Fixing it alone removes oscillation, reduces wasted attempts, and prevents premature stall triggers. Gaps B and C are secondary — fix A first.

**Note:** The orchestrator already tracks all the data needed (errors_per_attempt, repaired_files, repair outputs). None of it is passed forward. The fix is not adding intelligence — it's sharing what already exists.

---

## OPTIONAL

### 11. IssueCollector severity-based stage gating
**What:** IssueCollector records CRITICAL/HIGH issues but they never influence pipeline behaviour. Stage N+1 runs identically whether stage N had 0 issues or 5 CRITICAL ones.
**Fix:** After each stage, check `self.issue_collector.has_critical` and optionally pause with a warning before continuing. Neither orchestrator does this — pure improvement opportunity.

### 12. Harmonise placeholder resolution return type
**What:** Android's `_resolve_placeholder_screens()` returns a summary string. Web's returns void. Minor inconsistency.
**Fix:** Make web version return a summary string matching Android's return type.

### 13. Expose `--aup-path` and `--mep-path` CLI flags
**What:** Android exposes these artifact path flags. Web doesn't.
**Fix:** Add to web's `main()` for artifact path configurability.

### 14. HITL gate for Android
**What:** Web has explicit `_hitl_gate()` with blocking operator approval. Android only mentions HITL in prompt comments.
**Fix:** Port `_hitl_gate()` to Android. Add `--no-hitl` flag for CI runs. (Web is ahead here.)

---

## Bugs Fixed This Run (in orchestrator_web.py)

These were crashes discovered and fixed during the 2026-04-16 run. Already patched — do not re-introduce.

| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| `UnicodeEncodeError` on `→` character | Windows cp1252 console encoding can't handle unicode arrows in `print()` | Replaced `→`, `×`, `≤` with ASCII equivalents in all `print()` calls |
| `FileNotFoundError` in `_resolve_placeholder_screens` | `rglob("*.tsx")` walked into `node_modules` deep path > Windows MAX_PATH | Replaced `rglob` with `os.walk` + `dirnames[:] = [d for d in dirnames if d != "node_modules"]` |
| `FileNotFoundError` in `_verify_assembly` | All `gen.rglob(...)` calls walked into `node_modules` | Added `_safe_rglob()` static method using `os.walk`, replaced all 6 `gen.rglob()` calls |

---

## Process Improvements (not code changes)

- **Always run a full parity audit against Android BEFORE writing a new orchestrator** — not during a live run
- **Define the post-pipeline workflow before starting** — spin up Angular, spin up Next.js, run dual-run, verify equivalence
- **Manually ingest feedback.loop.md into MKB between projects** — this is the only cross-run learning that exists right now
- **Ask the developer about repair-to-MKB** — was the omission intentional (MKB noise concern) or an oversight?
