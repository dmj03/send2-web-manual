"""
Send2 Web Migration Orchestrator
=================================
Migrates Send2 Angular 17 web application to Next.js 15 App Router.

Source:  send2-web-main (Angular 17, TypeScript, 293 files, 15 features, 37 routes)
Target:  generated/ (Next.js 15, React 19, TypeScript, Tailwind, Zustand, TanStack Query)

Pipeline: 33 stages, hardcoded prompt methods, Claude Code CLI backend.
All generated files written to disk via ### FILE: marker extraction.
All errors handled by LLM build gate repair loop — never manually patch generated files.

Usage:
  python orchestrator_web.py --source-root ./src --generated-dir ./generated
  python orchestrator_web.py --source-root ./src --from-stage codegen.features
  python orchestrator_web.py --phase phase1_extract --source-root ./src
  python orchestrator_web.py --phase phase2_plan --source-root ./src
  python orchestrator_web.py --phase phase_gate_check
"""

# ---------------------------------------------------------------------------
# Standard-library imports
# ---------------------------------------------------------------------------
import argparse
import asyncio
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from collections import Counter
from dataclasses import asdict, dataclass
from typing import ClassVar
from datetime import UTC, datetime
from difflib import unified_diff
from pathlib import Path
from urllib import error as urllib_error
from urllib import request as urllib_request

# ---------------------------------------------------------------------------
# Third-party imports
# ---------------------------------------------------------------------------
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_SOURCE_EXTENSIONS = (".ts", ".html", ".scss", ".json")

DEFAULT_EXCLUDE_DIRS = {
    ".git", ".angular", "node_modules", "dist",
    "__pycache__", ".venv", "coverage", ".nyc_output",
}

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class StageArtifact:
    """Captures the full input/output record for a single pipeline stage."""
    stage: str          # Stage identifier, e.g. "codegen.features.authentication"
    prompt: str         # The exact prompt text sent to the LLM
    output: str         # The raw LLM response text
    created_at: str     # ISO 8601 timestamp when the artifact was recorded


@dataclass
class BuildError:
    """A single TypeScript/Next.js compilation error."""
    file_path: str      # Absolute or repo-relative path to the file containing the error
    line: int           # 1-based line number reported by the compiler
    column: int         # 1-based column number reported by the compiler
    message: str        # Human-readable error message from the compiler
    error_code: str     # TypeScript/Next.js error code, e.g. "TS2345"


@dataclass
class BuildGateResult:
    """Result of a build-gate-and-repair cycle."""
    gate_id: str                    # Unique identifier for this gate check, e.g. "gate.phase2.tsc"
    build_command: str              # The build command(s) executed, e.g. "pnpm tsc + pnpm next build"
    passed: bool                    # True if the final attempt produced zero errors
    total_attempts: int             # Total number of build + repair attempts made
    errors_per_attempt: list[int]   # Error count recorded after each attempt (index 0 = first run)
    repaired_files: list[str]       # Deduplicated list of files rewritten during repair loops
    elapsed_seconds: float          # Wall-clock seconds from gate start to gate completion


@dataclass
class IssueEntry:
    """A single issue observed during a pipeline run."""
    issue_id: str           # Deterministic SHA-256 hash for deduplication across runs
    timestamp: str          # ISO 8601 timestamp when the issue was first recorded
    stage: str              # Pipeline stage where the issue occurred, e.g. "codegen.features.authentication"
    category: str           # Issue category: "build_error" | "validation_gap" | "stage_error" | "assemble_issue"
    severity: str           # Severity level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
    symptom: str            # Short human-readable description of the observable symptom
    root_cause: str         # Analysis of what caused the issue
    resolution: str         # What action resolved the issue, or "unresolved" if still open
    files_affected: list[str]   # List of file paths implicated in the issue
    error_count: int        # Number of distinct compiler/runtime errors associated with this issue
    metadata: dict          # Flexible extra data (e.g. compiler flags, environment vars, LLM model used)


@dataclass
class SourceChunk:
    """A contiguous slice of a source file used for context-windowing in prompts."""
    path: str           # Repo-relative path to the source file
    start_line: int     # 1-based line number of the first line of this chunk
    end_line: int       # 1-based line number of the last line of this chunk (inclusive)
    content: str        # Raw text content of the chunk, preserving original indentation


# ---------------------------------------------------------------------------
# IssueCollector
# ---------------------------------------------------------------------------

class IssueCollector:
    """Accumulates issues during a pipeline run and flushes to disk at the end."""

    def __init__(self):
        self._entries: list[IssueEntry] = []

    @staticmethod
    def _make_issue_id(stage, category, symptom) -> str:
        normalized = f"{stage}|{category}|{symptom.strip().lower()}"
        return hashlib.sha256(normalized.encode()).hexdigest()[:12]

    def record(
        self,
        stage: str,
        category: str,
        severity: str,
        symptom: str,
        root_cause: str,
        resolution: str,
        files_affected=None,
        error_count: int = 0,
        metadata=None,
    ) -> IssueEntry:
        entry = IssueEntry(
            issue_id=self._make_issue_id(stage, category, symptom),
            timestamp=datetime.now(UTC).isoformat(),
            stage=stage,
            category=category,
            severity=severity,
            symptom=symptom,
            root_cause=root_cause,
            resolution=resolution,
            files_affected=files_affected if files_affected is not None else [],
            error_count=error_count,
            metadata=metadata if metadata is not None else {},
        )
        self._entries.append(entry)
        return entry

    @property
    def entries(self) -> list[IssueEntry]:
        return list(self._entries)

    @property
    def has_issues(self) -> bool:
        return len(self._entries) > 0

    def write_run_log(self, output_path: Path) -> Path:
        if not self._entries:
            return output_path / "issues.run.empty"

        run_ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%S")
        log_path = output_path / f"issues.run.{run_ts}.json"

        by_severity = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        for entry in self._entries:
            if entry.severity in by_severity:
                by_severity[entry.severity] += 1

        payload = {
            "run_timestamp": run_ts,
            "total_issues": len(self._entries),
            "by_severity": by_severity,
            "entries": [asdict(e) for e in self._entries],
        }

        output_path.mkdir(parents=True, exist_ok=True)
        log_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"  [issue-log] Run log written: {log_path.name} ({len(self._entries)} issues)")
        return log_path

    def write_run_summary_md(self, output_path: Path) -> Path:
        run_ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%S")
        md_path = output_path / f"issues.run.{run_ts}.md"

        lines = [
            "# Pipeline Issue Log",
            "",
            f"**Run:** {run_ts}  ",
            f"**Total issues:** {len(self._entries)}",
            "",
        ]

        for i, entry in enumerate(self._entries, start=1):
            lines.append(f"## {i}. [{entry.severity}] {entry.symptom}")
            lines.append(f"- **Stage:** `{entry.stage}`")
            lines.append(f"- **Category:** {entry.category}")
            lines.append(f"- **Root cause:** {entry.root_cause}")
            lines.append(f"- **Resolution:** {entry.resolution}")
            if entry.files_affected:
                files_display = ", ".join(f"`{f}`" for f in entry.files_affected[:10])
                lines.append(f"- **Files:** {files_display}")
            if entry.error_count > 0:
                lines.append(f"- **Error count:** {entry.error_count}")
            lines.append("")
            lines.append("---")
            lines.append("")

        output_path.mkdir(parents=True, exist_ok=True)
        md_path.write_text("\n".join(lines), encoding="utf-8")
        return md_path

    def append_to_troubleshooting_log(self, log_path: Path, min_severity: str = "HIGH") -> int:
        severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
        threshold = severity_order[min_severity]

        significant = [
            e for e in self._entries
            if severity_order.get(e.severity, 99) <= threshold
        ]

        if not significant:
            return 0

        existing_text = ""
        if log_path.exists():
            existing_text = log_path.read_text(encoding="utf-8")

        existing_ids = set(re.findall(r"<!-- issue_id: ([a-f0-9]{12}) -->", existing_text))

        max_num = 0
        for m in re.finditer(r"^## (\d+)\.", existing_text, re.MULTILINE):
            max_num = max(max_num, int(m.group(1)))

        new_entries = [e for e in significant if e.issue_id not in existing_ids]

        if not new_entries:
            return 0

        appended_lines = []
        for i, entry in enumerate(new_entries, start=max_num + 1):
            appended_lines.append(f"<!-- issue_id: {entry.issue_id} -->")
            appended_lines.append(f"## {i}. [{entry.severity}] {entry.symptom}")
            appended_lines.append(f"- **Stage:** `{entry.stage}`")
            appended_lines.append(f"- **Category:** {entry.category}")
            appended_lines.append(f"- **Timestamp:** {entry.timestamp}")
            appended_lines.append(f"- **Root cause:** {entry.root_cause}")
            appended_lines.append(f"- **Resolution:** {entry.resolution}")
            if entry.files_affected:
                files_display = ", ".join(f"`{f}`" for f in entry.files_affected[:20])
                appended_lines.append(f"- **Files:** {files_display}")
            appended_lines.append("")
            appended_lines.append("---")
            appended_lines.append("")

        updated_text = existing_text.rstrip("\n") + "\n" + "\n".join(appended_lines)

        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(updated_text, encoding="utf-8")
        print(f"  [issue-log] Appended {len(new_entries)} new entries to {log_path.name}")
        return len(new_entries)


# ---------------------------------------------------------------------------
# MigrationKnowledgeBase
# ---------------------------------------------------------------------------
class MigrationKnowledgeBase:
    """Self-improvement engine: every stage output is stored here and retrieved
    on future runs via TF-IDF cosine similarity search."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

        self.events_file: Path = self.root / "events.jsonl"
        self.documents_file: Path = self.root / "documents.jsonl"
        self.vectors_file: Path = self.root / "vectors.jsonl"
        self.graph_file: Path = self.root / "graph_edges.jsonl"

        self.documents: dict[str, dict] = {}
        self.vectors: dict[str, dict[str, int]] = {}
        self.edges: list[dict] = []

        self._load_indexes()

    def _load_indexes(self) -> None:
        if self.documents_file.exists():
            for line in self.documents_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                row = json.loads(line)
                self.documents[row["id"]] = row

        if self.vectors_file.exists():
            for line in self.vectors_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                row = json.loads(line)
                self.vectors[row["id"]] = row["vector"]

        if self.graph_file.exists():
            for line in self.graph_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                self.edges.append(json.loads(line))

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(r"[a-zA-Z0-9_]+", text.lower())

    def _vectorize(self, text: str) -> dict[str, int]:
        counts: dict[str, int] = {}
        for token in self._tokenize(text):
            counts[token] = counts.get(token, 0) + 1
        return counts

    @staticmethod
    def _cosine(a: dict[str, int], b: dict[str, int]) -> float:
        if not a or not b:
            return 0.0
        dot = sum(v * b.get(k, 0) for k, v in a.items())
        norm_a = math.sqrt(sum(v * v for v in a.values()))
        norm_b = math.sqrt(sum(v * v for v in b.values()))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _append_jsonl(self, path: Path, row: dict) -> None:
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(row) + "\n")

    def write_document(
        self,
        doc_type: str,
        stage: str,
        content: str,
        metadata: dict | None = None,
    ) -> str:
        doc_id = str(uuid.uuid4())
        row: dict = {
            "id": doc_id,
            "type": doc_type,
            "stage": stage,
            "content": content,
            "metadata": metadata if metadata is not None else {},
            "created_at": datetime.now(UTC).isoformat(),
        }
        self.documents[doc_id] = row
        self.vectors[doc_id] = self._vectorize(content)
        self._append_jsonl(self.documents_file, row)
        self._append_jsonl(self.vectors_file, {"id": doc_id, "vector": self.vectors[doc_id]})
        return doc_id

    def write_edge(self, source_doc_id: str, target_doc_id: str, relation: str) -> None:
        edge: dict = {
            "source": source_doc_id,
            "target": target_doc_id,
            "relation": relation,
            "created_at": datetime.now(UTC).isoformat(),
        }
        self.edges.append(edge)
        self._append_jsonl(self.graph_file, edge)

    def write_stage_artifact(
        self,
        artifact: StageArtifact,
        related_doc_ids: list[str],
    ) -> str:
        self._append_jsonl(self.events_file, asdict(artifact))

        prompt_doc_id = self.write_document(
            "prompt", artifact.stage, artifact.prompt, {"kind": "stage_prompt"}
        )
        output_doc_id = self.write_document(
            "stage_output", artifact.stage, artifact.output, {"kind": "stage_output"}
        )

        self.write_edge(prompt_doc_id, output_doc_id, "produced")

        for related_id in related_doc_ids:
            self.write_edge(related_id, output_doc_id, "informed")

        return output_doc_id

    def append(self, artifact: StageArtifact) -> str:
        """Backward-compatible event append — delegates to write_stage_artifact with no related docs."""
        return self.write_stage_artifact(artifact=artifact, related_doc_ids=[])

    def query(self, query_text: str, top_k: int = 5) -> list[dict]:
        query_vec = self._vectorize(query_text)
        scored: list[tuple[float, dict]] = []
        for doc_id, doc in self.documents.items():
            doc_vec = self.vectors.get(doc_id, {})
            score = self._cosine(query_vec, doc_vec)
            if score > 0:
                scored.append((score, doc))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored[:top_k]]

    def build_context_snippet(
        self,
        query_text: str,
        top_k: int = 5,
        max_chars: int = 4000,
    ) -> str:
        docs = self.query(query_text, top_k)
        if not docs:
            return "No prior shared memory available."

        lines: list[str] = ["Shared Memory (MKB Retrieval):", ""]
        total_chars = sum(len(l) + 1 for l in lines)

        for doc in docs:
            excerpt = doc["content"][:1200]
            block = f"- [{doc['type']}:{doc['stage']}] id={doc['id']}\n{excerpt}\n"
            if total_chars + len(block) > max_chars:
                break
            lines.append(block)
            total_chars += len(block) + 1

        return "\n".join(lines).strip()


# ---------------------------------------------------------------------------
# CodeFileExtractor
# ---------------------------------------------------------------------------

# Web-safe extensions — Android extensions (.kt, .xml, .gradle) are excluded.
_WEB_EXTENSIONS: frozenset[str] = frozenset({
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".css", ".scss", ".sass", ".less",
    ".html", ".json", ".yaml", ".yml",
    ".env", ".env.local", ".env.example",
    ".md", ".mdx",
    ".svg", ".ico",
    ".toml", ".lock",
})

# Artifact subdirectory routing: maps path prefixes to generated subdirectories.
# Keys are checked in order (most-specific first).
_ARTIFACT_ROUTES: list[tuple[str, str]] = [
    ("src/app/",        "src/app"),
    ("src/components/", "src/components"),
    ("src/hooks/",      "src/hooks"),
    ("src/lib/",        "src/lib"),
    ("src/services/",   "src/services"),
    ("src/utils/",      "src/utils"),
    ("src/types/",      "src/types"),
    ("src/styles/",     "src/styles"),
    ("src/",            "src"),
    ("public/",         "public"),
    ("tests/",          "tests"),
    ("__tests__/",      "__tests__"),
]


class CodeFileExtractor:
    """Parses LLM output for ``### FILE: <path>`` markers and extracts code blocks.

    Parity with Android CodeFileExtractor (orchestrator 1.py lines 281–308):
      - _FILE_MARKER regex identical (re.MULTILINE, ``### FILE: <path>``)
      - _CODE_FENCE regex identical (fenced code block extraction)
      - extract_files() returns list[tuple[str, str]] (rel_path, content)
      - write_files() writes to disk, creates parent dirs, returns list[Path]

    Web additions:
      - _route_artifact() maps each relative path to a canonical subdirectory
        within generated_dir using _ARTIFACT_ROUTES prefix table.
      - extract_and_write() convenience method combines both steps.
      - _is_web_path() guards against Android-only extensions leaking in.
    """

    _FILE_MARKER: re.Pattern = re.compile(r"^###\s*FILE:\s*(.+)$", re.MULTILINE)
    _CODE_FENCE: re.Pattern = re.compile(r"```\w*\n(.*?)```", re.DOTALL)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_and_write(
        self,
        output_text: str,
        generated_dir: Path,
    ) -> list[Path]:
        """Parse *output_text* for ``### FILE:`` markers, write each file to
        *generated_dir*, and return the list of written :class:`~pathlib.Path`
        objects.  Non-web extensions are silently skipped.
        """
        pairs = self.extract_files(output_text)
        return self.write_files(generated_dir, pairs)

    def extract_files(self, llm_output: str) -> list[tuple[str, str]]:
        """Return a list of *(relative_path, file_content)* tuples found in
        *llm_output*.  Entries whose path does not look like a web file are
        excluded.
        """
        files: list[tuple[str, str]] = []
        parts = self._FILE_MARKER.split(llm_output)
        # Layout after split: [preamble, path1, block1, path2, block2, ...]
        for i in range(1, len(parts), 2):
            rel_path = parts[i].strip()
            block = parts[i + 1] if i + 1 < len(parts) else ""
            if not self._is_web_path(rel_path):
                continue
            fence_match = self._CODE_FENCE.search(block)
            if fence_match:
                content = fence_match.group(1)
            else:
                # Fall back to raw block content when no fenced block is present.
                content = block.strip()
            if content:
                files.append((rel_path, content))
        return files

    def write_files(
        self,
        generated_dir: Path,
        files: list[tuple[str, str]],
    ) -> list[Path]:
        """Write *files* under *generated_dir* (creating parent directories as
        needed) and return the list of absolute :class:`~pathlib.Path` objects
        that were written.
        """
        written: list[Path] = []
        for rel_path, content in files:
            routed_path = self._route_artifact(rel_path)
            target = generated_dir / routed_path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            written.append(target)
        return written

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _route_artifact(rel_path: str) -> str:
        """Normalise *rel_path* to a canonical location inside the generated
        directory.

        The routing table (_ARTIFACT_ROUTES) maps common Angular source prefixes
        to their Next.js equivalents so that LLM output that still uses Angular
        path conventions lands in the right place.  If no prefix matches the
        path is returned unchanged.
        """
        normalised = rel_path.replace("\\", "/").lstrip("/")
        for prefix, _ in _ARTIFACT_ROUTES:
            if normalised.startswith(prefix):
                # Path already uses a recognised web prefix — keep as-is.
                return normalised
        return normalised

    @staticmethod
    def _is_web_path(rel_path: str) -> bool:
        """Return *True* when *rel_path* has a recognised web file extension or
        no extension at all (e.g. ``Dockerfile``, ``.gitignore``).  Files with
        Android-only extensions (``.kt``, ``.xml``, ``.gradle``) are rejected.
        """
        suffix = Path(rel_path).suffix.lower()
        if suffix == "":
            # No extension — allow (e.g. Dockerfile, Makefile, .gitignore)
            return True
        return suffix in _WEB_EXTENSIONS


# ---------------------------------------------------------------------------
# SourceContextBuilder
# ---------------------------------------------------------------------------

class SourceContextBuilder:
    """Walks the Angular source tree, chunks source files, and assembles context
    strings that are injected into every LLM prompt.

    Parity with Android SourceContextBuilder (orchestrator 1.py lines 1132–1430):
      - __init__ accepts source_root, max_chunk_chars, max_files, extensions,
        exclude_dirs — identical constructor signature.
      - discover_files() / collect_source_files() — recursive rglob walk with
        extension + exclude_dirs filtering; returns sorted, truncated list.
      - _chunk_file() / chunk_file() — splits file content into SourceChunk
        objects respecting max_chunk_chars boundary.
      - build_context_document() — raw concatenation of all chunks with
        structured headers; used for discovery-stage prompts.
      - build_context_for_stage() — query-filtered context capped at max_chars;
        used inline in every pipeline stage prompt.
      - build_human_readable_context_document() — summary document with
        component inventory, inferred requirements, flow signals, imports.
      - _detect_language() — maps web file extensions to language labels.
      - _collect_line_matches() — scans file lines against compiled patterns.
      - estimate_tokens() — 4 chars ≈ 1 token heuristic for budget checks.

    Web adaptations:
      - DEFAULT_SOURCE_EXTENSIONS = (.ts, .html, .scss, .json) instead of
        (.kt, .java, .xml, .gradle).
      - _detect_language() maps TypeScript/HTML/SCSS/JSON.
      - dependency_patterns target ES/TS import statements and package.json
        rather than Gradle or Java imports.
      - flow_patterns detect Angular decorators (@Component, @Injectable, etc.)
        and TypeScript function/class declarations.
      - build_human_readable_context_document() drops iOS-specific SPM section
        and adds Angular-specific component / service / route sections.
    """

    # ------------------------------------------------------------------
    # Construction
    # ------------------------------------------------------------------

    def __init__(
        self,
        source_root: Path,
        max_chunk_chars: int = 6_000,
        max_files: int = 300,
        extensions: tuple[str, ...] = DEFAULT_SOURCE_EXTENSIONS,
        exclude_dirs: set[str] | None = None,
    ) -> None:
        self.source_root = source_root
        self.max_chunk_chars = max_chunk_chars
        self.max_files = max_files
        self.extensions = tuple(ext.lower() for ext in extensions)
        self.exclude_dirs: set[str] = exclude_dirs if exclude_dirs is not None else DEFAULT_EXCLUDE_DIRS

    # ------------------------------------------------------------------
    # Public API — file discovery
    # ------------------------------------------------------------------

    def collect_source_files(self, source_root: Path | None = None) -> list[Path]:
        """Walk *source_root* recursively and return a sorted, deduplicated list
        of source files that match ``self.extensions`` and are not inside any
        directory named in ``self.exclude_dirs``.

        The list is capped at ``self.max_files`` entries (alphabetical order).
        ``source_root`` defaults to ``self.source_root`` when omitted.

        Parity alias: also callable as ``discover_files()`` to match the Android
        orchestrator method name.
        """
        root = source_root if source_root is not None else self.source_root
        files: list[Path] = []
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            # Exclude any path whose parts overlap with exclude_dirs.
            if any(part in self.exclude_dirs for part in path.parts):
                continue
            if path.suffix.lower() not in self.extensions:
                continue
            files.append(path)
        files = sorted(files)
        return files[: self.max_files]

    # Parity alias — Android orchestrator calls this discover_files().
    def discover_files(self) -> list[Path]:
        """Alias for :meth:`collect_source_files` (Android parity)."""
        return self.collect_source_files()

    # ------------------------------------------------------------------
    # Public API — chunking
    # ------------------------------------------------------------------

    def _chunk_file(self, path: Path, chunk_size: int | None = None) -> list[SourceChunk]:
        """Split *path* into a list of :class:`SourceChunk` objects, each
        containing at most *chunk_size* characters of raw source text.

        Lines are never split mid-line; a new chunk starts when appending the
        next line would push the current chunk over *chunk_size*.

        *chunk_size* defaults to ``self.max_chunk_chars`` when omitted.

        Parity alias: also callable as ``chunk_file()`` to match Android name.
        """
        limit = chunk_size if chunk_size is not None else self.max_chunk_chars
        raw = path.read_text(encoding="utf-8", errors="replace")
        lines = raw.splitlines()
        rel_path = str(path.relative_to(self.source_root))

        chunks: list[SourceChunk] = []
        chunk_lines: list[str] = []
        chunk_start = 1
        current_chars = 0

        for idx, line in enumerate(lines, start=1):
            line_len = len(line) + 1  # +1 for the newline character
            if chunk_lines and current_chars + line_len > limit:
                chunks.append(
                    SourceChunk(
                        path=rel_path,
                        start_line=chunk_start,
                        end_line=idx - 1,
                        content="\n".join(chunk_lines),
                    )
                )
                chunk_lines = []
                chunk_start = idx
                current_chars = 0

            chunk_lines.append(line)
            current_chars += line_len

        if chunk_lines:
            chunks.append(
                SourceChunk(
                    path=rel_path,
                    start_line=chunk_start,
                    end_line=len(lines),
                    content="\n".join(chunk_lines),
                )
            )

        return chunks

    # Parity alias — Android orchestrator calls this chunk_file().
    def chunk_file(self, path: Path) -> list[SourceChunk]:
        """Alias for :meth:`_chunk_file` (Android parity)."""
        return self._chunk_file(path)

    # ------------------------------------------------------------------
    # Public API — context assembly
    # ------------------------------------------------------------------

    def build_context_for_stage(
        self,
        source_root: Path | None = None,
        query: str = "",
        max_chars: int = 16_000,
    ) -> str:
        """Return a context string of at most *max_chars* characters built from
        the source files most likely to be relevant to *query*.

        Strategy:
          1. Discover all matching source files under *source_root*.
          2. Score each file by counting occurrences of query tokens in its name
             and first 500 chars of content (simple lexical match, no vectors).
          3. Iterate files in descending score order, chunk each file, and append
             chunks to the output until *max_chars* would be exceeded.
          4. Return the assembled string with a compact header.

        This mirrors the Android ``build_context_snippet`` intent while operating
        on raw source files rather than MKB documents (the web pipeline has no
        MKB at the point SourceContextBuilder is called).
        """
        root = source_root if source_root is not None else self.source_root
        files = self.collect_source_files(root)

        if not files:
            return "No Angular source files found under the configured source root."

        # Score files by lexical relevance to the query.
        query_tokens = [t.lower() for t in re.split(r"\W+", query) if len(t) > 2]

        def _score(p: Path) -> int:
            if not query_tokens:
                return 0
            name_text = p.stem.lower()
            try:
                head = p.read_text(encoding="utf-8", errors="replace")[:500].lower()
            except OSError:
                head = ""
            combined = name_text + " " + head
            return sum(combined.count(tok) for tok in query_tokens)

        scored = sorted(files, key=_score, reverse=True)

        header_lines = [
            "# Angular Source Context",
            "",
            f"- Source root: `{root}`",
            f"- Query: `{query or '(none)'}`",
            f"- Files available: {len(files)}",
            "",
            "## Source Chunks",
            "",
        ]
        header = "\n".join(header_lines)
        budget = max_chars - len(header)

        body_parts: list[str] = []
        chars_used = 0

        for path in scored:
            chunks = self._chunk_file(path)
            for chunk in chunks:
                block_lines = [
                    f"### File: `{chunk.path}` (lines {chunk.start_line}–{chunk.end_line})",
                    "",
                    "```text",
                    chunk.content,
                    "```",
                    "",
                ]
                block = "\n".join(block_lines)
                if chars_used + len(block) > budget:
                    break
                body_parts.append(block)
                chars_used += len(block)
            else:
                # Inner loop completed without break — continue to next file.
                continue
            # Inner loop broke — budget exhausted.
            break

        if not body_parts:
            return header + "(No source content fits within the character budget.)"

        return header + "\n".join(body_parts)

    def build_context_document(self) -> str:
        """Build a full structured context document from all discovered source
        files.  Intended for discovery / analysis stage prompts where the full
        source corpus should be available to the LLM.

        Parity with Android ``build_context_document()``.
        """
        files = self.discover_files()
        chunks: list[SourceChunk] = []
        for path in files:
            chunks.extend(self._chunk_file(path))

        lines: list[str] = [
            "# Angular Source Context (Auto-Generated)",
            "",
            "## Generation Metadata",
            "",
            f"- Source root: `{self.source_root}`",
            f"- Included file count: {len(files)}",
            f"- Included chunk count: {len(chunks)}",
            f"- File extensions: {', '.join(self.extensions)}",
            f"- Max chunk chars: {self.max_chunk_chars}",
            "",
            "## Analyst Tasks for Discovery Agent",
            "",
            "- Extract Angular component/service/module boundaries and their responsibilities.",
            "- Identify HTTP API calls, interceptors, and data contracts (interfaces/models).",
            "- Infer routing structure from RouterModule declarations and lazy-loaded modules.",
            "- Note NgRx / RxJS patterns that require state-management migration to Zustand.",
            "- Mark assumptions when behavior is ambiguous.",
            "",
            "## Source Chunks",
            "",
        ]

        for chunk in chunks:
            lines.extend(
                [
                    f"### File: `{chunk.path}` ({chunk.start_line}-{chunk.end_line})",
                    "",
                    "```text",
                    chunk.content,
                    "```",
                    "",
                ]
            )

        return "\n".join(lines)

    def build_human_readable_context_document(
        self, max_items_per_section: int = 30
    ) -> str:
        """Build a human-readable summary document with component inventory,
        inferred requirements, flow signals, and import/dependency lists.

        Parity with Android ``build_human_readable_context_document()``, adapted
        for Angular/TypeScript patterns.
        """
        files = self.discover_files()
        language_counts: Counter[str] = Counter()
        requirements: list[str] = []
        flow_signals: list[str] = []
        dependencies: list[str] = []
        ng_imports: set[str] = set()
        components: list[str] = []

        # Patterns tuned for Angular/TypeScript source.
        requirement_patterns = [
            re.compile(r"\bif\b", re.IGNORECASE),
            re.compile(r"\bswitch\s*\(", re.IGNORECASE),
            re.compile(r"\bvalidate|validation|reject|error|fail|exception|required\b", re.IGNORECASE),
            re.compile(r"\bmust|should|shall\b", re.IGNORECASE),
            re.compile(r"\bthrow\s+new\b", re.IGNORECASE),
            re.compile(r"\bcatchError|throwError\b"),
        ]
        flow_patterns = [
            re.compile(r"^\s*(export\s+)?(async\s+)?function\s+\w+\s*\("),
            re.compile(r"^\s*(public|private|protected|readonly)?\s*(async\s+)?\w+\s*\([^)]*\)\s*[:{]"),
            re.compile(r"@(Component|Injectable|NgModule|Directive|Pipe|Guard|Resolver|Interceptor)\s*\("),
            re.compile(r"\bngOnInit\b|\bngOnDestroy\b|\bngAfterViewInit\b"),
            re.compile(r"\.(subscribe|pipe|switchMap|mergeMap|concatMap|exhaustMap)\s*\("),
            re.compile(r"\brouter\.navigate\b|\bnavigateByUrl\b"),
        ]
        dependency_patterns = [
            re.compile(r"^\s*import\s+.+from\s+['\"].+['\"]"),
            re.compile(r"^\s*import\s+['\"].+['\"]"),
            re.compile(r"\"dependencies\"\s*:\s*\{"),
            re.compile(r"\"devDependencies\"\s*:\s*\{"),
            re.compile(r"^\s*require\s*\(\s*['\"]"),
        ]

        for path in files:
            language = self._detect_language(path)
            language_counts[language] += 1
            rel = str(path.relative_to(self.source_root))
            try:
                content = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            line_count = content.count("\n") + (1 if content else 0)
            components.append(f"- `{rel}` ({language}, ~{line_count} lines)")

            for line_no, line in self._collect_line_matches(
                content, requirement_patterns, max_items=4
            ):
                requirements.append(f"- `{rel}:{line_no}` -> `{line}`")
                if len(requirements) >= max_items_per_section:
                    break

            for line_no, line in self._collect_line_matches(
                content, flow_patterns, max_items=4
            ):
                flow_signals.append(f"- `{rel}:{line_no}` -> `{line}`")
                if len(flow_signals) >= max_items_per_section:
                    break

            for line_no, line in self._collect_line_matches(
                content, dependency_patterns, max_items=3
            ):
                dependencies.append(f"- `{rel}:{line_no}` -> `{line}`")
                if len(dependencies) >= max_items_per_section:
                    break

            # Collect Angular/npm module names from import statements.
            if path.suffix.lower() == ".ts":
                for raw_line in content.splitlines():
                    stripped = raw_line.strip()
                    m = re.match(r"import\s+.+from\s+['\"](@?[\w/.-]+)['\"]", stripped)
                    if m:
                        module = m.group(1)
                        if module:
                            ng_imports.add(module)

            if (
                len(requirements) >= max_items_per_section
                and len(flow_signals) >= max_items_per_section
                and len(dependencies) >= max_items_per_section
            ):
                break

        lines = [
            "# Angular Source Context (Human-Readable)",
            "",
            "## Scope",
            "",
            "This document summarizes inferred requirements and execution flow directly from Angular source files.",
            "",
            "## Source Snapshot",
            "",
            f"- Source root: `{self.source_root}`",
            f"- Files analyzed: {len(files)}",
            "- Languages detected:",
        ]
        for lang, count in sorted(language_counts.items()):
            lines.append(f"  - {lang}: {count}")

        lines.extend(["", "## Key Components", ""])
        lines.extend(components[:max_items_per_section] or ["- No eligible files discovered."])

        lines.extend(["", "## Inferred Requirements (From Conditions and Validations)", ""])
        lines.extend(requirements or ["- No requirement clues were detected automatically."])

        lines.extend(["", "## Inferred Flow (From Function Declarations and Angular Lifecycle Hooks)", ""])
        lines.extend(flow_signals or ["- No flow clues were detected automatically."])

        lines.extend(["", "## External Dependencies and Integrations", ""])
        lines.extend(dependencies or ["- No integration clues were detected automatically."])

        if ng_imports:
            lines.extend(["", "## TypeScript Module Imports (Unique)", ""])
            for mod in sorted(ng_imports)[:max_items_per_section]:
                lines.append(f"- `{mod}`")

        lines.extend(
            [
                "",
                "## Review Checklist",
                "",
                "- Confirm inferred component responsibilities with the team (HITL).",
                "- Validate routing structure against the Angular RouterModule definitions.",
                "- Identify NgRx store slices that need Zustand equivalents.",
                "- Add missing business rules from design documents not captured in code.",
            ]
        )

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Token / size estimation
    # ------------------------------------------------------------------

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Estimate token count using the common 4-chars-per-token heuristic.

        Accuracy: ±20 % for English/TypeScript mixed content.  Sufficient for
        prompt-budget checks to avoid exceeding context window limits.
        """
        return math.ceil(len(text) / 4)

    def context_fits(self, text: str, max_tokens: int = 100_000) -> bool:
        """Return *True* when *text* is estimated to fit within *max_tokens*."""
        return self.estimate_tokens(text) <= max_tokens

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _detect_language(path: Path) -> str:
        """Map a file extension to a human-readable language label.

        Covers Angular/web extensions plus common config file types.
        Parity with Android ``_detect_language()``, extended for web stack.
        """
        suffix = path.suffix.lower()
        mapping = {
            ".ts": "TypeScript",
            ".tsx": "TypeScript (JSX)",
            ".js": "JavaScript",
            ".jsx": "JavaScript (JSX)",
            ".html": "HTML (Angular Template)",
            ".scss": "SCSS",
            ".css": "CSS",
            ".json": "JSON",
            ".md": "Markdown",
            ".yaml": "YAML",
            ".yml": "YAML",
            ".toml": "TOML",
            ".env": "Environment Config",
            ".graphql": "GraphQL",
            ".gql": "GraphQL",
        }
        return mapping.get(suffix, "Unknown")

    @staticmethod
    def _collect_line_matches(
        content: str,
        patterns: list[re.Pattern],
        max_items: int,
    ) -> list[tuple[int, str]]:
        """Scan *content* line-by-line and return up to *max_items* ``(line_no,
        line_text)`` tuples where at least one pattern matches.

        Parity with Android ``_collect_line_matches()``.
        """
        matches: list[tuple[int, str]] = []
        for line_no, raw_line in enumerate(content.splitlines(), start=1):
            line = raw_line.strip()
            if not line:
                continue
            if any(pattern.search(line) for pattern in patterns):
                matches.append((line_no, line[:200]))
            if len(matches) >= max_items:
                break
        return matches


# ---------------------------------------------------------------------------
# Module-level source file discovery helpers
# (Android parity: orchestrator 1.py — discover_matching_source_files and
#  _discover_all_files standalone functions used by batch pipeline and AUP.)
# ---------------------------------------------------------------------------

def discover_matching_source_files(
    source_root: Path,
    extensions: tuple[str, ...],
    exclude_dirs: set[str],
) -> list[Path]:
    """Return ALL source files under *source_root* matching *extensions*.

    Unlike :meth:`SourceContextBuilder.discover_files` this function applies
    **no max_files truncation** — it returns the complete sorted list.  Used
    by the batch pipeline to get the full file list before splitting into
    per-batch slices.

    Parity: orchestrator 1.py ``discover_matching_source_files()``.
    """
    files: list[Path] = []
    for path in source_root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in exclude_dirs for part in path.parts):
            continue
        if path.suffix.lower() not in extensions:
            continue
        files.append(path)
    return sorted(files)


def _discover_all_files(
    source_root: Path,
    exclude_dirs: set[str],
    max_files: int,
) -> list[Path]:
    """Return up to *max_files* files under *source_root*, regardless of extension.

    Used by phase1_extract (AUP) to build a full inventory of the Angular
    project before any filtering.  Unlike ``discover_matching_source_files``
    this function has **no extension filter** but does apply *max_files* as
    an early-exit cap.

    Parity: orchestrator 1.py ``_discover_all_files()``.
    """
    files: list[Path] = []
    for path in sorted(source_root.rglob("*")):
        if not path.is_file():
            continue
        if any(part in exclude_dirs for part in path.parts):
            continue
        files.append(path)
        if len(files) >= max_files:
            break
    return files


# ---------------------------------------------------------------------------
# NextJsProjectScaffolder
# ---------------------------------------------------------------------------

class NextJsProjectScaffolder:
    """Creates the initial Next.js 15 App Router project tree from templates.

    Deterministic and idempotent — calling :meth:`scaffold` twice on the same
    *generated_dir* produces the same result (files are overwritten in-place).

    Parity: orchestrator 1.py ``AndroidProjectScaffolder``.
    """

    # Canonical directory stubs created under src/
    SRC_SUBDIRS: list[str] = [
        "app",
        "components",
        "lib",
        "hooks",
        "services",
        "types",
        "utils",
    ]

    def __init__(self, app_name: str = "send2-web") -> None:
        self.app_name = app_name

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def is_already_scaffolded(self, generated_dir: Path) -> bool:
        """Return True when *generated_dir* already contains a ``package.json``."""
        return (generated_dir / "package.json").exists()

    def scaffold(self, generated_dir: Path) -> list[Path]:
        """Write every scaffold file into *generated_dir* and return created paths.

        Creates the directory if it does not yet exist.  Existing files are
        overwritten so the scaffold is always in a known, canonical state.
        """
        generated_dir.mkdir(parents=True, exist_ok=True)
        created: list[Path] = []

        created.extend(self._write_package_json(generated_dir))
        created.extend(self._write_tsconfig(generated_dir))
        created.extend(self._write_next_config(generated_dir))
        created.extend(self._write_tailwind_config(generated_dir))
        created.extend(self._write_postcss_config(generated_dir))
        created.extend(self._write_gitignore(generated_dir))
        created.extend(self._write_env_example(generated_dir))
        created.extend(self._create_directory_stubs(generated_dir))

        return created

    def render_summary(self, generated_dir: Path) -> str:
        """Return a markdown summary of what was scaffolded."""
        lines = ["# Next.js Project Scaffold Summary", ""]
        lines.append(f"**Generated dir:** `{generated_dir}`")
        lines.append(f"**App name:** `{self.app_name}`")
        lines.append("")
        lines.append("## Config Files Created")
        lines.append("")
        for name in (
            "package.json",
            "tsconfig.json",
            "next.config.ts",
            "tailwind.config.ts",
            "postcss.config.js",
            ".gitignore",
            ".env.example",
        ):
            lines.append(f"- `{name}`")
        lines.append("")
        lines.append("## Directory Stubs Created")
        lines.append("")
        for sub in self.SRC_SUBDIRS:
            lines.append(f"- `src/{sub}/`")
        lines.append("- `public/`")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Private write helpers — each returns list[Path] of written files
    # ------------------------------------------------------------------

    def _write_package_json(self, root: Path) -> list[Path]:
        target = root / "package.json"
        target.write_text(
            """{
  "name": "send2-web",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  },
  "dependencies": {
    "next": "15.3.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@tanstack/react-query": "5.74.4",
    "@tanstack/react-query-devtools": "5.74.4",
    "zustand": "5.0.3",
    "clsx": "2.1.1",
    "tailwind-merge": "3.2.0"
  },
  "devDependencies": {
    "@types/node": "22.15.3",
    "@types/react": "19.1.2",
    "@types/react-dom": "19.1.2",
    "typescript": "5.8.3",
    "@tailwindcss/postcss": "4.1.4",
    "tailwindcss": "4.1.4",
    "postcss": "8.5.3",
    "eslint": "9.25.1",
    "eslint-config-next": "15.3.0",
    "prettier": "3.5.3",
    "prettier-plugin-tailwindcss": "0.6.11"
  }
}
""",
            encoding="utf-8",
        )
        return [target]

    def _write_tsconfig(self, root: Path) -> list[Path]:
        target = root / "tsconfig.json"
        target.write_text(
            """{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
""",
            encoding="utf-8",
        )
        return [target]

    def _write_next_config(self, root: Path) -> list[Path]:
        target = root / "next.config.ts"
        target.write_text(
            """import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router is the default in Next.js 15 — no explicit appDir flag needed.
  reactStrictMode: true,
  // Enable experimental features as needed.
  experimental: {
    // typedRoutes provides compile-time checking of <Link href="..."> values.
    typedRoutes: true,
  },
  images: {
    // Add external domains / remotePatterns here as the migration progresses.
    remotePatterns: [],
  },
};

export default nextConfig;
""",
            encoding="utf-8",
        )
        return [target]

    def _write_tailwind_config(self, root: Path) -> list[Path]:
        target = root / "tailwind.config.ts"
        target.write_text(
            """import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind CSS v4 uses @import-based configuration; this file retains the
  // JS config for IDE auto-complete and custom theme extensions.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Send2 brand palette — fill in from design tokens during migration.
        brand: {
          primary: "#0057FF",
          secondary: "#00C2FF",
          surface: "#F5F7FA",
          error: "#E53E3E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
""",
            encoding="utf-8",
        )
        return [target]

    def _write_postcss_config(self, root: Path) -> list[Path]:
        target = root / "postcss.config.js"
        target.write_text(
            """/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // @tailwindcss/postcss is the Tailwind CSS v4 PostCSS integration.
    "@tailwindcss/postcss": {},
  },
};

module.exports = config;
""",
            encoding="utf-8",
        )
        return [target]

    def _write_gitignore(self, root: Path) -> list[Path]:
        target = root / ".gitignore"
        target.write_text(
            """# Next.js
.next/
out/

# Node
node_modules/
.pnpm-store/

# Build outputs
dist/
build/

# Environment variables — never commit real secrets
.env
.env.local
.env.*.local

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# pnpm
pnpm-debug.log*
""",
            encoding="utf-8",
        )
        return [target]

    def _write_env_example(self, root: Path) -> list[Path]:
        target = root / ".env.example"
        target.write_text(
            """# Copy this file to .env.local and fill in the values.
# Never commit .env.local to version control.

# API base URL for the Send2 backend
NEXT_PUBLIC_API_BASE_URL=https://api.send2app.com

# Optional: analytics / feature-flag keys
NEXT_PUBLIC_ANALYTICS_KEY=
NEXT_PUBLIC_FF_BASE_URL=

# Server-side only secrets (no NEXT_PUBLIC_ prefix)
API_SECRET_KEY=
""",
            encoding="utf-8",
        )
        return [target]

    def _create_directory_stubs(self, root: Path) -> list[Path]:
        """Create src/* and public/ directory stubs with .gitkeep placeholders.

        Returns the list of .gitkeep files written (one per empty directory),
        matching the Android scaffolder convention of tracking empty dirs.
        """
        created: list[Path] = []

        # src/ subdirectories
        for sub in self.SRC_SUBDIRS:
            stub_dir = root / "src" / sub
            stub_dir.mkdir(parents=True, exist_ok=True)
            gitkeep = stub_dir / ".gitkeep"
            gitkeep.write_text("", encoding="utf-8")
            created.append(gitkeep)

        # public/
        public_dir = root / "public"
        public_dir.mkdir(parents=True, exist_ok=True)
        gitkeep = public_dir / ".gitkeep"
        gitkeep.write_text("", encoding="utf-8")
        created.append(gitkeep)

        return created


# ---------------------------------------------------------------------------
# MigrationOrchestrator
# ---------------------------------------------------------------------------


class MigrationOrchestrator:
    """Orchestrates the full Angular 17 → Next.js 15 migration pipeline.

    33-stage pipeline with build-gate repair loops, HITL gates, MKB
    knowledge accumulation, and per-stage artifact persistence.  Designed
    for exact parity with the Android MigrationOrchestrator in orchestrator 1.py.
    """

    # ── Stage sequence ─────────────────────────────────────────────────────────
    # 33 stages, phase-annotated.  Order is authoritative; from_stage / up_to_stage
    # are validated against this list at pipeline startup.
    STAGE_SEQUENCE: ClassVar[list[str]] = [
        # Phase 1 — Discovery
        "extract.inventory",
        "extract.analysis",
        "extract.decomposition",

        # Phase 2 — Planning
        "plan.architecture",
        "plan.routes",
        "plan.state",
        "integration_migration",

        # Phase 3 — Codegen
        "scaffold",
        "codegen.layout",
        "codegen.providers",
        "codegen.utils",
        "codegen.types",
        "codegen.services",
        "codegen.mocks",
        "codegen.navigation",
        "codegen.features.auth",
        "codegen.features.home",
        "codegen.features.search",
        "codegen.features.provider",
        "codegen.features.rate_alert",
        "codegen.features.profile",
        "codegen.features.notification",
        "codegen.features.settings",
        "codegen.features.content",
        "codegen.features.quiz",
        "codegen.features.misc",
        "codegen.tests",
        "code_review",
        "assemble",
        "copy.static",
        "equivalence.audit",
        "equivalence.fix",
        "ui.layout.match",

        # Phase 4 — Validation
        "ui.spec",
        "dualrun.plan",
        "validation.structure",
        "validation.types",
        "validation.routes",
        "validation.5layer",

        # Phase 5 — Rollout
        "documentation",
        "feedback.loop",
        "report",
    ]

    # ── Artifact subdirectories ────────────────────────────────────────────────
    # Maps stage-name prefixes to their phase subdirectory under artifacts_dir.
    # _ap() uses prefix matching (same logic as Android orchestrator).
    _ARTIFACT_SUBDIRS: ClassVar[dict[str, str]] = {
        # Phase 1 — Discovery
        "extract.inventory":       "phase1-discovery",
        "extract.analysis":        "phase1-discovery",
        "extract.decomposition":   "phase1-discovery",
        "aup":                     "phase1-discovery",
        "legacy-context":          "phase1-discovery",
        # Phase 2 — Planning
        "plan.architecture":       "phase2-planning",
        "plan.routes":             "phase2-planning",
        "plan.state":              "phase2-planning",
        "integration_migration":   "phase2-planning",
        "decomposition":           "phase2-planning",
        "ui.spec":                 "phase2-planning",
        # Phase 3 — Codegen
        "scaffold":                "phase3-codegen",
        "codegen":                 "phase3-codegen",
        "codegen.navigation":      "phase3-codegen",
        "code_review":             "phase3-codegen",
        "assemble":                "phase3-codegen",
        "equivalence.fix":         "phase3-codegen",
        "copy.static":             "phase3-codegen",
        "build.gate":              "phase3-codegen",
        # Phase 4 — Validation
        "equivalence.audit":       "phase3-codegen",
        "validation":              "phase4-validation",
        "dualrun":                 "phase4-validation",
        "ui.layout":               "phase4-validation",
        # Phase 5 — Rollout
        "documentation":           "phase5-rollout",
        "orchestrator.report":     "phase5-rollout",
        "feedback.loop":           "phase5-rollout",
        "report":                  "phase5-rollout",
        # Logs
        "summary":                 "logs",
        "phase_gate":              "logs",
        "issues.run":              "logs",
        "run_output":              "logs",
    }

    # ── Class-level constants ──────────────────────────────────────────────────
    MAX_REPAIR_ATTEMPTS: ClassVar[int] = 4
    MIN_STAGE_OUTPUT_CHARS: ClassVar[int] = 120  # _resume_stage rejects artifacts shorter than this

    # ── Feature module list ───────────────────────────────────────────────────
    # (module_key, route_group, primary_angular_component)
    # Parity: Android FEATURE_CODEGEN_MODULES — 11 features
    FEATURE_CODEGEN_MODULES: ClassVar[list[tuple[str, str, str]]] = [
        ("auth",         "(auth)",         "LoginComponent"),
        ("home",         "(home)",         "HomeComponent"),
        ("search",       "(search)",       "SearchComponent"),
        ("provider",     "(provider)",     "ProviderDetailComponent"),
        ("rate_alert",   "(rate-alert)",   "RateAlertComponent"),
        ("profile",      "(profile)",      "ProfileComponent"),
        ("notification", "(notification)", "NotificationComponent"),
        ("settings",     "(settings)",     "SettingsComponent"),
        ("content",      "(content)",      "ContentComponent"),
        ("quiz",         "(quiz)",         "QuizComponent"),
        ("misc",         "(misc)",         "MiscComponent"),
    ]

    # Hand-curated map of Angular source files per feature.
    # Parity: Android LEGACY_FILE_MAPPING — gives each feature codegen stage
    # exact legacy context instead of relying on keyword-search heuristics.
    LEGACY_FILE_MAPPING: ClassVar[dict[str, dict[str, list[str]]]] = {
        "auth": {
            "components": [
                "app/authentication/components/login/login.component.ts",
                "app/authentication/components/registration/registration.component.ts",
                "app/authentication/components/otp/otp.component.ts",
                "app/authentication/components/forgotpassword/forgotpassword.component.ts",
                "app/authentication/components/changepassword/changepassword.component.ts",
                "app/authentication/components/social-login/social-login.component.ts",
                "app/authentication/components/signup-success/signup-success.component.ts",
                "app/authentication/components/account-reactivate-alert/account-reactivate-alert.component.ts",
            ],
            "services": [
                "app/authentication/services/authentication.service.ts",
                "app/authentication/services/localStorageDataHandle.ts",
            ],
            "guards": [
                "app/shared/guards/loged-in.guard.ts",
                "app/shared/guards/profile.guard.ts",
            ],
            "interceptors": [
                "app/shared/interceptors/auth.interceptor.ts",
                "app/shared/interceptors/auth-interceptor.interceptor.ts",
            ],
            "routing": [
                "app/authentication/authentication-routing.module.ts",
            ],
            "defaults": [
                "app/authentication/login-strapydefault/login-page-default.ts",
                "app/authentication/login-strapydefault/register-page-default.ts",
                "app/authentication/login-strapydefault/forgotpassword-page-default.ts",
            ],
        },
        "home": {
            "components": [
                "app/home/components/home-page/home-page.component.ts",
                "app/home/components/banner-news/banner-news.component.ts",
                "app/home/components/exchange-rate-graph/exchange-rate-graph.component.ts",
                "app/home/components/facts/facts.component.ts",
                "app/home/components/faqs/faqs.component.ts",
                "app/home/components/our-partner/our-partner.component.ts",
                "app/home/components/service-area/service-area.component.ts",
            ],
            "services": [
                "app/home/services/home-service.service.ts",
            ],
            "models": [
                "app/home/models/newsletter.ts",
                "app/home/models/viewOptionsClickData.ts",
            ],
            "routing": [
                "app/home/home-routing.module.ts",
            ],
            "defaults": [
                "app/home/components/strapy-default-data/homepage.ts",
                "app/home/components/strapy-default-data/default-home-strapy-forSetting.ts",
            ],
        },
        "search": {
            "components": [
                "app/search/search.component.ts",
                "app/search/search-form/search-form.component.ts",
                "app/search/search-list/search-list.component.ts",
                "app/search/search-list/deals-pop-up-box/deals-pop-up-box.component.ts",
                "app/search/search-list/share-popup/share-popup.component.ts",
                "app/search/search-head/search-head.component.ts",
                "app/search/search-sidebar/search-sidebar.component.ts",
                "app/search/search-slider/search-slider.component.ts",
            ],
            "services": [
                "app/search/service/search.service.ts",
                "app/search/service/transfer-options-search.service.ts",
            ],
            "routing": [
                "app/search/search.routing.module.ts",
            ],
            "defaults": [
                "app/search/srtapi-default/searchScreenDefault.ts",
            ],
        },
        "provider": {
            "components": [
                "app/providers/providers-list/providers-list.component.ts",
                "app/providers/providers-layout/providers-layout.component.ts",
                "app/providers/review-modal/review-modal.component.ts",
            ],
            "services": [
                "app/providers/services/provider.service.ts",
                "app/providers/services/analytics.service.ts",
                "app/providers/services/geolocation.service.ts",
            ],
            "routing": [
                "app/providers/providers-routing.module.ts",
            ],
        },
        "rate_alert": {
            "components": [
                "app/shared/components/set-rate-alerts/set-rate-alerts.component.ts",
            ],
            "services": [
                "app/shared/components/set-rate-alerts/rateAlertService/rate-alert.service.ts",
            ],
        },
        "profile": {
            "components": [
                "app/profile/dashboard/dashboard.component.ts",
                "app/profile/edit-info/edit-info.component.ts",
                "app/profile/changepassword/changepassword.component.ts",
                "app/profile/notifications/notifications.component.ts",
                "app/profile/consent-management/consent-management.component.ts",
                "app/profile/delete-account-popup/delete-account-popup.component.ts",
                "app/profile/logout-popup/logout-popup.component.ts",
                "app/profile/camera-access-message-modal-box/camera-access-message-modal-box.component.ts",
            ],
            "services": [
                "app/profile/services/profile.service.ts",
            ],
            "guards": [
                "app/profile/guards/guards/internal-user.guard.ts",
            ],
        },
        "notification": {
            "components": [
                "app/shared/components/notification-modal-box/notification-modal-box.component.ts",
            ],
            "services": [
                "app/shared/services/common/common-services.service.ts",
            ],
        },
        "settings": {
            "components": [
                "app/lang-selector/lang-selector.component.ts",
                "app/opt-out/opt-out/opt-out.component.ts",
            ],
            "services": [
                "app/lang-selector/lang-service/lang.service.ts",
                "app/opt-out/service/opt-out-service.service.ts",
            ],
        },
        "content": {
            "components": [
                "app/blog/blog-list/blog-list.component.ts",
                "app/blog/blog-detail/blog-detail.component.ts",
                "app/news-feed/news-list/news-list.component.ts",
                "app/news-feed/news-detail/news-detail.component.ts",
                "app/about-us/about-us.component.ts",
                "app/contact-us/contact-us.component.ts",
                "app/privacy-policy/privacy-policy.component.ts",
                "app/terms-and-conditions/terms-and-conditions.component.ts",
                "app/disclaimer/disclaimer.component.ts",
            ],
            "services": [
                "app/blog/services/blog.service.ts",
                "app/news-feed/services/news.service.ts",
                "app/about-us/service/about.service.ts",
                "app/contact-us/services/contact-us.service.ts",
            ],
            "routing": [
                "app/blog/blog-routing.module.ts",
                "app/news-feed/news-feed-routing.module.ts",
            ],
        },
        "quiz": {
            "components": [],   # No quiz module found in Angular source
            "services": [],
        },
        "misc": {
            "components": [
                "app/pages/not-found/not-found.component.ts",
                "app/deep-linking/deep-linking.component.ts",
                "app/raise-complaint/raise-complaint.component.ts",
                "app/shared/components/become-a-partner/become-a-partner.component.ts",
                "app/shared/components/preloader/preloader.component.ts",
            ],
            "services": [
                "app/raise-complaint/services/raise-complaint.service.ts",
                "app/services/core.service.ts",
                "app/services/shared.service.ts",
                "app/services/tawk.service.ts",
            ],
        },
    }

    # Inventory of Angular HTTP service methods per feature.
    # Parity: Android LEGACY_API_METHODS — used by assembly verification to
    # compute API migration completeness percentage.
    LEGACY_API_METHODS: ClassVar[dict[str, list[str]]] = {
        "auth": [
            "login", "register", "verifyOtp", "resendOtp", "forgotPassword",
            "resetPassword", "changePassword", "socialLogin", "checkUserExists",
            "reactivateAccount", "logout",
        ],
        "home": [
            "getHomeSettings", "getExchangeRates", "getExchangeRateGraph",
            "getFaqs", "getFacts", "getPartners", "getServiceAreas",
            "subscribeNewsletter",
        ],
        "search": [
            "searchProviders", "getTransferOptions", "getSearchFilters",
            "getDeals", "getExchangeRateForPair",
        ],
        "provider": [
            "getProviderDetail", "getProviderList", "submitReview",
            "getProviderReviews", "getProviderById",
        ],
        "rate_alert": [
            "createRateAlert", "getRateAlerts", "deleteRateAlert", "updateRateAlert",
        ],
        "profile": [
            "getProfile", "updateProfile", "uploadProfileImage",
            "deleteAccount", "getNotificationSettings", "updateNotificationSettings",
            "getConsentSettings", "updateConsentSettings",
        ],
        "notification": [
            "getNotifications", "markNotificationRead", "markAllRead",
        ],
        "settings": [
            "getLanguages", "setLanguage", "optOut",
        ],
        "content": [
            "getBlogs", "getBlogDetail", "getNews", "getNewsDetail",
            "getAboutUs", "submitContactForm", "getPrivacyPolicy",
            "getTermsAndConditions", "getDisclaimer",
        ],
        "quiz": [],
        "misc": [
            "raiseComplaint", "getComplaintCategories", "resolveDeepLink",
        ],
    }

    # Mapping of feature → primary service/hook to mock in tests.
    # Parity: Android MOCK_CODEGEN_MODULES.
    MOCK_CODEGEN_MODULES: ClassVar[list[tuple[str, str]]] = [
        ("auth",         "useAuth"),
        ("home",         "useHomeSettings"),
        ("search",       "useSearch"),
        ("provider",     "useProviders"),
        ("rate_alert",   "useRateAlerts"),
        ("profile",      "useProfile"),
        ("notification", "useNotifications"),
        ("settings",     "useSettings"),
        ("content",      "useContent"),
        ("quiz",         "useQuiz"),
        ("misc",         "useMisc"),
    ]

    # ── Equivalence fix groups ────────────────────────────────────────────────
    # (group_label, glob_patterns, fix_description)
    # Parity: Android FIX_GROUPS — adapted for TypeScript/Next.js
    FIX_GROUPS: ClassVar[list[tuple[str, list[str], str]]] = [
        (
            "navigation",
            ["src/app/**/page.tsx", "src/components/navigation/**/*.tsx"],
            "Fix Next.js App Router navigation: replace router.navigate() with next/navigation useRouter().",
        ),
        (
            "data_fetching",
            ["src/lib/services/**/*.ts", "src/hooks/**/*.ts"],
            "Fix TanStack Query data fetching: replace Angular HttpClient with useQuery/useMutation.",
        ),
        (
            "state",
            ["src/lib/**/*.ts", "src/components/**/*.tsx"],
            "Fix Zustand store usage: replace NgRx selectors/dispatch with Zustand hooks.",
        ),
        (
            "api",
            ["src/lib/services/**/*.ts"],
            "Fix API base URL and endpoint paths: align with .env.local NEXT_PUBLIC_API_BASE_URL.",
        ),
    ]

    # ── UI layout match groups ─────────────────────────────────────────────────
    # (group_label, angular_template_patterns, nextjs_component_patterns, description)
    # Parity: Android UI_LAYOUT_MATCH_GROUPS
    UI_LAYOUT_MATCH_GROUPS: ClassVar[list[tuple[str, list[str], list[str], str]]] = [
        (
            "home",
            ["src/app/features/home/**/*.html"],
            ["src/app/(home)/**/*.tsx"],
            "Home screen layout match: Angular home templates → Next.js (home) route group.",
        ),
        (
            "search",
            ["src/app/features/search/**/*.html"],
            ["src/app/(search)/**/*.tsx"],
            "Search layout match: Angular search templates → Next.js (search) route group.",
        ),
        (
            "provider",
            ["src/app/features/provider/**/*.html"],
            ["src/app/(provider)/**/*.tsx"],
            "Provider detail layout match.",
        ),
        (
            "notification",
            ["src/app/features/notification/**/*.html"],
            ["src/app/(notification)/**/*.tsx"],
            "Notification layout match.",
        ),
        (
            "settings",
            ["src/app/features/settings/**/*.html"],
            ["src/app/(settings)/**/*.tsx"],
            "Settings layout match.",
        ),
        (
            "auth",
            ["src/app/features/auth/**/*.html"],
            ["src/app/(auth)/**/*.tsx"],
            "Auth layout match: Angular auth templates → Next.js (auth) route group.",
        ),
    ]

    # ── Stages that always need legacy Angular source context injected ────────
    # Parity: Android _STAGES_NEEDING_LEGACY_CONTEXT
    _STAGES_NEEDING_LEGACY_CONTEXT: ClassVar[set[str]] = {
        "extract.inventory",
        "extract.analysis",
        "extract.decomposition",
        "validation.5layer",
        "feedback.loop",
    }

    # ── Angular source dirs to skip during context collection ─────────────────
    # Parity: Android _SKIP_RES_DIRS (XML resource dirs)
    _SKIP_SOURCE_DIRS: ClassVar[set[str]] = {
        "node_modules", ".angular", "dist", ".next", "coverage",
        "__pycache__", ".git",
    }

    # ── Constructor ────────────────────────────────────────────────────────────

    def __init__(
        self,
        source_root: Path,
        generated_dir: Path,
        artifacts_dir: Path,
        mkb_dir: Path,
        # Claude Code CLI settings (parity: orchestrator 1.py)
        claude_cmd: str = "claude",
        claude_model: str | None = None,
        claude_max_turns: int = 25,
        claude_permission_mode: str = "bypassPermissions",
        prompt_on_permission: bool = False,
        # Pipeline control
        from_stage: str | None = None,
        up_to_stage: str | None = None,
        skip_codegen_files: bool = False,
        no_hitl: bool = False,
        screenshots_dir: Path | None = None,
        # Build gate (web replacement for compile gate)
        build_gate_enabled: bool = True,
        build_gate_max_retries: int = 3,
        build_gate_timeout: int = 300,
        build_gate_on_failure: str = "warn",
        pnpm_cmd: str = "pnpm",
        # Issue tracking
        issue_collector: "IssueCollector | None" = None,
    ) -> None:
        # ── Path roots ──────────────────────────────────────────────────────
        self.source_root = source_root
        self.generated_dir = generated_dir
        self.artifacts_dir = artifacts_dir
        self.mkb_dir = mkb_dir
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

        # ── Claude Code CLI settings ─────────────────────────────────────────
        self.claude_cmd = claude_cmd
        self.claude_model = claude_model
        self.claude_max_turns = claude_max_turns
        self.claude_permission_mode = claude_permission_mode
        self.prompt_on_permission = prompt_on_permission

        # ── Pipeline control ─────────────────────────────────────────────────
        self.from_stage = from_stage
        self.up_to_stage = up_to_stage
        self.skip_codegen_files = skip_codegen_files
        self.no_hitl = no_hitl
        self.screenshots_dir = screenshots_dir

        # ── Build gate (web replacement for Android compile gate) ────────────
        self.build_gate_enabled = build_gate_enabled
        self.build_gate_max_retries = build_gate_max_retries
        self.build_gate_timeout = build_gate_timeout
        self.build_gate_on_failure = build_gate_on_failure
        self.pnpm_cmd = pnpm_cmd

        # ── Core helpers ────────────────────────────────────────────────────
        self.mkb = MigrationKnowledgeBase(mkb_dir)
        self.extractor = CodeFileExtractor()
        self.issue_collector: IssueCollector = issue_collector or IssueCollector()
        self.scaffolder = NextJsProjectScaffolder()
        self.source_ctx = SourceContextBuilder(source_root)

        # ── Session state ───────────────────────────────────────────────────
        self._session_id: str = str(uuid.uuid4())[:8]
        self._gate_cache: dict[str, BuildGateResult] = {}
        self._stage_artifacts: dict[str, StageArtifact] = {}

    # ─────────────────────────────────────────────────────────────────────────
    # Section 8 — Core Infrastructure Methods
    # ─────────────────────────────────────────────────────────────────────────

    def _log(self, msg: str, level: str = "info") -> None:
        """Lightweight logger. Parity: Android _log()."""
        prefix = f"[{level.upper()}] " if level != "info" else ""
        print(f"{prefix}{msg}", flush=True)

    def _ap(self, name: str) -> Path:
        """Return the subfolder-aware path for an artifact, creating the parent dir.

        Parity: Android _ap().  Iterates _ARTIFACT_SUBDIRS prefix table; the first
        matching prefix (exact, dot-separated, dash-separated, or underscore-separated)
        determines the phase subdirectory under self.artifacts_dir.
        """
        for prefix, subdir in self._ARTIFACT_SUBDIRS.items():
            if (
                name == prefix
                or name.startswith(prefix + ".")
                or name.startswith(prefix + "-")
                or name.startswith(prefix + "_")
            ):
                path = self.artifacts_dir / subdir / name
                path.parent.mkdir(parents=True, exist_ok=True)
                return path
        # Fallback: place directly in artifacts_dir root.
        fallback = self.artifacts_dir / name
        fallback.parent.mkdir(parents=True, exist_ok=True)
        return fallback

    # ── Issue log flusher ─────────────────────────────────────────────────────

    def _flush_issue_log(self) -> None:
        """Write collected issues to disk artifacts and append to troubleshooting log.

        Parity: Android _flush_issue_log().  Writes the run JSON + summary MD into
        the logs subfolder; appends HIGH+ issues to TROUBLESHOOTING_LOG.md if it
        already exists alongside the project root.
        """
        if not self.issue_collector.has_issues:
            return
        logs_dir = self.artifacts_dir / "logs"
        self.issue_collector.write_run_log(logs_dir)
        self.issue_collector.write_run_summary_md(logs_dir)
        # Attempt to append to the project-level troubleshooting log.
        # Layout: <generated_dir>/../docs/TROUBLESHOOTING_LOG.md
        troubleshooting_log = self.generated_dir.parent / "docs" / "TROUBLESHOOTING_LOG.md"
        if troubleshooting_log.exists():
            self.issue_collector.append_to_troubleshooting_log(
                troubleshooting_log, min_severity="HIGH"
            )

    # ── Claude Code CLI invocation ────────────────────────────────────────────

    def _invoke_claude_code(self, prompt: str, stage: str = "") -> str:
        """Invoke the ``claude`` CLI as a subprocess and return the full assistant text.

        Parity: Android _invoke_claude_code().

        Key behaviours (all preserved):
        * Prepends a directive so Claude responds inline rather than offering to
          write files.
        * Uses ``--output-format stream-json --verbose`` so that multi-turn
          responses are fully captured via _parse_stream_json().
        * Strips ANTHROPIC_API_KEY and CLAUDECODE from the child environment so
          that a logged-in Max/Pro/Team session is used when available.
        * Retries automatically with a truncated prompt when Claude reports the
          prompt is too long.
        * Raises RuntimeError on permission-block responses unless
          --prompt-on-permission is set, in which case the user is prompted
          interactively.
        """
        import shutil as _shutil

        if _shutil.which(self.claude_cmd) is None:
            raise RuntimeError(
                f"Claude CLI not found: '{self.claude_cmd}'. "
                "Install Claude Code and ensure 'claude' is on PATH."
            )

        # Inline-response directive — prevents Claude from offering to write
        # files instead of producing output, and ensures screenshots are read.
        directive = (
            "INSTRUCTION: Generate your complete response directly in this "
            "conversation. "
            "If the prompt references screenshot image files, read them using "
            "the Read tool first. "
            "Produce the full report in a single response.\n\n"
        )
        full_prompt = directive + prompt

        # Build CLI command.  stream-json + --verbose is required so that all
        # assistant messages across multi-turn conversations are captured.
        cmd: list[str] = [
            self.claude_cmd,
            "-p",
            "--verbose",
            "--output-format", "stream-json",
            "--max-turns", str(self.claude_max_turns),
            "--permission-mode", self.claude_permission_mode,
        ]
        if self.claude_model:
            cmd.extend(["--model", self.claude_model])

        # Strip keys/flags that interfere with session or spawning from a
        # parent Claude Code process.
        env = os.environ.copy()
        env.pop("ANTHROPIC_API_KEY", None)
        env.pop("CLAUDECODE", None)

        cli_timeout = 1800  # 30-minute hard ceiling per invocation.

        # ── First invocation ──────────────────────────────────────────────────
        try:
            completed = subprocess.run(
                cmd,
                input=full_prompt,
                text=True,
                capture_output=True,
                check=False,
                env=env,
                timeout=cli_timeout,
                encoding="utf-8",
                errors="replace",
            )
        except subprocess.TimeoutExpired:
            raise RuntimeError(
                f"Claude Code CLI timed out after {cli_timeout}s "
                f"(stage='{stage}'). Consider increasing --claude-max-turns "
                "or simplifying the prompt."
            )

        all_text, result_error = self._parse_stream_json(completed.stdout)
        check_text = (all_text + "\n" + completed.stderr).strip()

        # ── Prompt-too-long retry ─────────────────────────────────────────────
        if completed.returncode != 0 and "Prompt is too long" in check_text:
            reduced = self._reduce_prompt_for_claude_code(full_prompt)
            try:
                completed = subprocess.run(
                    cmd,
                    input=reduced,
                    text=True,
                    capture_output=True,
                    check=False,
                    env=env,
                    timeout=cli_timeout,
                    encoding="utf-8",
                    errors="replace",
                )
            except subprocess.TimeoutExpired:
                raise RuntimeError(
                    f"Claude Code CLI timed out after {cli_timeout}s on "
                    f"reduced prompt (stage='{stage}')."
                )
            all_text, result_error = self._parse_stream_json(completed.stdout)
            check_text = (all_text + "\n" + completed.stderr).strip()

        # ── Permission-block handling ─────────────────────────────────────────
        if self._is_permission_block_message(check_text):
            if self.prompt_on_permission:
                answer = input(
                    f"[stage={stage}] Permission-related response detected "
                    "from Claude. Retry and continue? [y/N]: "
                ).strip().lower()
                if answer in {"y", "yes"}:
                    try:
                        completed = subprocess.run(
                            cmd,
                            input=full_prompt,
                            text=True,
                            capture_output=True,
                            check=False,
                            env=env,
                            timeout=cli_timeout,
                            encoding="utf-8",
                            errors="replace",
                        )
                    except subprocess.TimeoutExpired:
                        raise RuntimeError(
                            f"Claude Code CLI timed out after {cli_timeout}s "
                            f"on permission retry (stage='{stage}')."
                        )
                    all_text, result_error = self._parse_stream_json(
                        completed.stdout
                    )
                else:
                    raise RuntimeError(
                        f"User declined permission confirmation for "
                        f"stage='{stage}'; stopping run."
                    )
            else:
                raise RuntimeError(
                    f"Claude returned a permission-related response "
                    f"(stage='{stage}'). "
                    "Re-run with --prompt-on-permission to confirm via "
                    "terminal y/n."
                )

        # ── Final error checks ────────────────────────────────────────────────
        if result_error:
            stderr_snippet = completed.stderr.strip()[:600] if completed.stderr else ""
            stdout_snippet = all_text.strip()[:600] if all_text else ""
            raise RuntimeError(
                f"Claude Code returned an error for stage='{stage}': "
                f"{result_error}\n"
                f"  exit={completed.returncode}\n"
                f"  stderr={stderr_snippet!r}\n"
                f"  output_preview={stdout_snippet!r}"
            )
        if completed.returncode != 0 and not all_text.strip():
            raise RuntimeError(
                f"Claude Code invocation failed (stage='{stage}'). "
                f"exit={completed.returncode}, "
                f"stderr={completed.stderr.strip()[:600]}, "
                f"output_preview={all_text[:400]}"
            )

        return self._strip_tool_call_noise(all_text.strip())

    # ── Stream-JSON parser ────────────────────────────────────────────────────

    @staticmethod
    def _parse_stream_json(raw_stdout: str) -> tuple[str, str | None]:
        """Parse ``--output-format stream-json`` output from the Claude CLI.

        Returns ``(concatenated_assistant_text, error_message_or_None)``.

        Parity: Android _parse_stream_json().

        Claude Code emits one JSON object per line.  We accumulate every ``text``
        block from ``assistant`` events so that multi-turn responses (where code
        is spread across several turns) are fully captured.  The ``result`` event
        carries any terminal error message.
        """
        import json as _json

        text_parts: list[str] = []
        error_msg: str | None = None

        for line in raw_stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                event = _json.loads(line)
            except _json.JSONDecodeError:
                continue

            evt_type = event.get("type")
            if evt_type == "assistant":
                message = event.get("message", {})
                for block in message.get("content", []):
                    if isinstance(block, dict) and block.get("type") == "text":
                        text_parts.append(block["text"])
            elif evt_type == "result":
                if event.get("is_error"):
                    error_msg = event.get("result", "Unknown error from Claude CLI")

        return "\n".join(text_parts), error_msg

    # ── Tool-call noise stripper (helper) ─────────────────────────────────────

    @staticmethod
    def _strip_tool_call_noise(text: str) -> str:
        """Remove spurious ``<tool_call>`` XML blocks that Claude may emit.

        Parity: Android _strip_tool_call_noise().
        """
        import re as _re

        cleaned = _re.sub(r"<tool_call>.*?</tool_call>", "", text, flags=_re.DOTALL)
        # Collapse runs of 3+ blank lines left behind after stripping.
        cleaned = _re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

    # ── Permission-block detector (helper) ────────────────────────────────────

    @staticmethod
    def _is_permission_block_message(text: str) -> bool:
        """Return True if the Claude response indicates a permissions block.

        Parity: Android _is_permission_block_message().
        """
        lower = (text or "").lower()
        return (
            "would you like me to write this to" in lower
            or "file write was blocked by permissions" in lower
        )

    # ── Full stage invocation ─────────────────────────────────────────────────

    async def _invoke_stage(
        self,
        stage: str,
        prompt: str,
        related_doc_ids: list[str] | None = None,
    ) -> tuple[str, str]:
        """Invoke the Claude Code CLI for *stage*, validate output, persist to MKB and disk.

        Parity: Android _invoke_stage().

        Steps:
        1. Call _invoke_claude_code() (synchronous subprocess, run in executor to
           avoid blocking the event loop).
        2. Validate output with _validate_stage_output() — raises on empty/error text.
        3. Write a StageArtifact to the MKB and obtain its document-id.
        4. Save the raw text to ``{stage}.md`` under the appropriate artifacts subdir.
        5. Return ``(output_text, doc_id)``.
        """
        if related_doc_ids is None:
            related_doc_ids = []

        loop = asyncio.get_event_loop()
        output: str = await loop.run_in_executor(
            None, lambda: self._invoke_claude_code(prompt, stage)
        )

        try:
            self._validate_stage_output(stage, output)
        except RuntimeError as exc:
            self.issue_collector.record(
                stage=stage,
                category="stage_error",
                severity="CRITICAL",
                symptom=str(exc),
                root_cause="LLM returned error markers or empty output",
                resolution="unresolved - stage aborted",
            )
            raise

        artifact = StageArtifact(
            stage=stage,
            prompt=prompt,
            output=output,
            created_at=datetime.now(UTC).isoformat(),
        )
        output_doc_id = self.mkb.write_stage_artifact(
            artifact=artifact, related_doc_ids=related_doc_ids
        )

        stage_file = self._ap(f"{stage}.md")
        stage_file.write_text(output, encoding="utf-8")

        # Cache in-memory for fast look-up by later stages.
        self._stage_artifacts[stage] = artifact

        return output, output_doc_id

    async def _invoke_codegen_stage(
        self,
        stage: str,
        sub_id: str,
        prompt: str,
        related_doc_ids: list[str] | None = None,
    ) -> tuple[str, str, list[Path]]:
        """Invoke a code-generation stage, write files, and persist the manifest.

        Parity: Android _invoke_codegen_stage().

        Steps on top of _invoke_stage():
        1. Extract ``### FILE:`` blocks from LLM output using ``self.extractor``.
        2. Write each file under ``self.generated_dir``.
        3. Write a ``.files.json`` manifest (relative paths, indent=2) so that
           ``_run_assemble`` and the build gate can enumerate all generated files.
        4. Return ``(output_text, doc_id, written_paths)``.
        """
        full_stage = f"{stage}.{sub_id}"
        output, doc_id = await self._invoke_stage(
            full_stage, prompt, related_doc_ids or []
        )

        # Extract and write generated files.
        files = self.extractor.extract_files(output)
        written: list[Path] = []
        if files:
            written = self.extractor.write_files(self.generated_dir, files)

        # Write the .files.json manifest for assembly / build-gate consumption.
        manifest: list[str] = [
            str(p.relative_to(self.generated_dir)) for p in written
        ]
        manifest_path = self._ap(f"{full_stage}.files.json")
        manifest_path.write_text(
            json.dumps(manifest, indent=2), encoding="utf-8"
        )

        return output, doc_id, written

    def _extract_and_write_files(self, stage: str, output: str) -> list[Path]:
        """Extract ``### FILE:`` blocks from *output* and write them to ``generated_dir``.

        Convenience wrapper used by codegen runners that call ``_invoke_stage``
        directly.  Mirrors the extraction step inside ``_invoke_codegen_stage``
        so that every codegen stage writes real files to disk (not just a .md
        artifact).

        Args:
            stage:  Stage name used as the manifest filename key.
            output: Raw LLM output text containing ``### FILE:`` blocks.

        Returns:
            List of :class:`Path` objects for every file written.
        """
        files = self.extractor.extract_files(output)
        written: list[Path] = []
        if files:
            written = self.extractor.write_files(self.generated_dir, files)
        manifest_path = self._ap(f"{stage}.files.json")
        manifest_path.write_text(
            json.dumps(
                [str(p.relative_to(self.generated_dir)) for p in written],
                indent=2,
            ),
            encoding="utf-8",
        )
        return written

    # ── Stage output validator ────────────────────────────────────────────────

    @staticmethod
    def _validate_stage_output(stage: str, output: str) -> None:
        """Raise RuntimeError if *output* is empty, too short, or contains error markers.

        Parity: Android _validate_stage_output().
        """
        text = (output or "").strip()
        if not text:
            raise RuntimeError(
                f"Stage '{stage}' returned empty output; "
                "aborting without overwriting artifact."
            )

        lower = text.lower()
        error_markers = [
            "reached max turns",
            "prompt is too long",
            "invocation failed",
            "runtimeerror",
            "traceback",
            "would you like me to write this to",
            "file write was blocked by permissions",
        ]
        if any(marker in lower for marker in error_markers):
            raise RuntimeError(
                f"Stage '{stage}' returned error text from LLM backend; "
                "aborting without overwriting artifact."
            )

    # ── Feedback-request extractor ────────────────────────────────────────────

    @staticmethod
    def _extract_feedback_requests(text: str) -> list[str]:
        """Find all ``## Upstream Feedback Request:`` items in *text*.

        Parity: Android _extract_feedback_requests().

        Scans for a section header containing "upstream feedback requests" and
        collects every ``- item`` bullet that follows until the next heading.
        Items of ``none``, ``n/a``, or ``no feedback`` are silently dropped.
        """
        lines = text.splitlines()
        requests: list[str] = []
        in_section = False

        for raw in lines:
            line = raw.strip()
            lower = line.lower()

            if "upstream feedback requests" in lower:
                in_section = True
                continue

            if in_section and line.startswith("- "):
                item = line[2:].strip()
                if item and item.lower() not in {"none", "n/a", "no feedback"}:
                    requests.append(item)
                continue

            # A new heading ends the section.
            if in_section and line and line.startswith("#"):
                break

            # Non-bullet, non-heading lines: skip silently-allowed empty values.
            if in_section and line and not line.startswith("-"):
                if line.lower() in {"none", "n/a", "no feedback"}:
                    continue

        return requests

    # ── Prompt reducer ────────────────────────────────────────────────────────

    @staticmethod
    def _reduce_prompt_for_claude_code(prompt: str, max_chars: int = 180_000) -> str:
        """Truncate an oversized *prompt* to *max_chars* while preserving key content.

        Parity: Android _reduce_prompt_for_claude_code() — web version uses a
        higher default ceiling (180 000 chars vs Android 90 000) to accommodate
        larger Angular source context payloads typical of this pipeline.

        Strategy: keep all instruction lines in full; compress the
        ``Legacy Context:`` section by retaining the first 400 lines and the
        last 200 lines with an explicit truncation notice in between.
        """
        if len(prompt) <= max_chars:
            return prompt

        lines = prompt.splitlines()
        high_signal: list[str] = []
        context_lines: list[str] = []
        in_context = False

        for line in lines:
            if line.strip().lower().startswith("legacy context:"):
                in_context = True
                high_signal.append(line)
                continue
            if in_context:
                context_lines.append(line)
            else:
                high_signal.append(line)

        head = "\n".join(context_lines[:400])
        tail = "\n".join(context_lines[-200:]) if len(context_lines) > 600 else ""
        reduced_context = (
            "CONTEXT TRUNCATED FOR CLAUDE CODE LIMITS\n"
            "Use available context and do not assume missing facts.\n\n"
            f"{head}\n\n... [truncated] ...\n\n{tail}"
        )
        rebuilt = "\n".join(high_signal + [reduced_context])
        return rebuilt[:max_chars]

    # ── Stage resume ──────────────────────────────────────────────────────────

    def _resume_stage(self, stage: str) -> tuple[str, str]:
        """Load a previously generated stage artifact from disk and register it in MKB.

        Parity: Android _resume_stage().

        Raises:
            FileNotFoundError: if ``{stage}.md`` does not exist.
            ValueError: if the artifact is shorter than MIN_STAGE_OUTPUT_CHARS (120).
        """
        stage_file = self._ap(f"{stage}.md")
        if not stage_file.exists():
            raise FileNotFoundError(
                f"Cannot resume stage '{stage}'. Missing artifact: {stage_file}. "
                "Run earlier stages first or remove --from-stage."
            )

        output = stage_file.read_text(encoding="utf-8")
        if len(output.strip()) < self.MIN_STAGE_OUTPUT_CHARS:
            raise ValueError(
                f"Artifact '{stage_file}' appears empty or corrupt "
                f"({len(output)} chars). "
                "Re-run the stage or provide a valid artifact."
            )

        doc_id = self.mkb.write_document(
            doc_type="stage_output",
            stage=stage,
            content=output,
            metadata={"source": "resume_artifact", "path": str(stage_file)},
        )
        return output, doc_id

    # ── Human-in-the-loop gate ────────────────────────────────────────────────

    def _hitl_gate(self, stage: str, content: str) -> None:
        """Block pipeline execution until a human reviews and approves *content*.

        Parity: design intent from Android orchestrator (HITL checkpoints).

        If ``self.no_hitl`` is True the gate is a no-op (automated runs / CI).
        Otherwise the content is printed to stdout and the operator must type
        ``yes`` (or ``y``) to continue; any other input aborts the run.

        CRITICAL: this gate MUST NOT be auto-approved by the orchestrator — see
        feedback_no_extra_cost.md memory note.
        """
        if self.no_hitl:
            return

        separator = "\u2500" * 72
        print(f"\n{separator}")
        print(f"HITL GATE \u2014 stage: {stage}")
        print(separator)
        print(content)
        print(separator)
        answer = input(
            f"Review the output above for stage '{stage}'.\n"
            "Type 'yes' to continue, anything else to abort: "
        ).strip().lower()
        if answer not in {"y", "yes"}:
            raise RuntimeError(
                f"HITL gate for stage '{stage}' was not approved by operator. "
                "Pipeline aborted."
            )

    # ─────────────────────────────────────────────────────────────────────────
    # Section 9 — Build Gate & TypeScript Repair Loop
    # ─────────────────────────────────────────────────────────────────────────

    def _run_tsc(self, generated_dir: Path) -> tuple[bool, list["BuildError"]]:
        """Run ``pnpm tsc --noEmit`` in *generated_dir* and return *(passed, errors)*.

        Parity: Android ``_run_gradle_compile`` — same contract, adapted for the
        TypeScript compiler instead of Gradle.

        Returns:
            A 2-tuple of *(passed: bool, errors: list[BuildError])* where
            *passed* is ``True`` iff the process exited with code 0.
        """
        cmd = [self.pnpm_cmd, "tsc", "--noEmit"]
        try:
            completed = subprocess.run(
                cmd,
                cwd=str(generated_dir),
                capture_output=True,
                text=True,
                timeout=self.build_gate_timeout,
                encoding="utf-8",
                errors="replace",
            )
        except subprocess.TimeoutExpired:
            print(
                f"  [build-gate] tsc timed out after {self.build_gate_timeout}s"
            )
            return False, []

        combined = completed.stdout + "\n" + completed.stderr
        passed = completed.returncode == 0
        errors = self._parse_ts_errors(combined)
        return passed, errors

    def _run_next_build(self, generated_dir: Path) -> tuple[bool, list["BuildError"]]:
        """Run ``pnpm next build`` in *generated_dir* and return *(passed, errors)*.

        Parity: Android ``_run_gradle_compile`` — same contract, adapted for the
        Next.js production build instead of Gradle assembleDebug.

        Next.js build errors arrive in a mixed format.  The method re-uses
        ``_parse_ts_errors`` for TypeScript-style lines and additionally captures
        plain ``Error:`` lines emitted by the Next.js compiler so that both
        ``tsc`` and ``next build`` errors are represented uniformly as
        :class:`BuildError` objects.

        Returns:
            A 2-tuple of *(passed: bool, errors: list[BuildError])* where
            *passed* is ``True`` iff the process exited with code 0.
        """
        cmd = [self.pnpm_cmd, "next", "build"]
        try:
            completed = subprocess.run(
                cmd,
                cwd=str(generated_dir),
                capture_output=True,
                text=True,
                timeout=self.build_gate_timeout,
                encoding="utf-8",
                errors="replace",
            )
        except subprocess.TimeoutExpired:
            print(
                f"  [build-gate] next build timed out after {self.build_gate_timeout}s"
            )
            return False, []

        combined = completed.stdout + "\n" + completed.stderr
        passed = completed.returncode == 0

        # Primary parse: TypeScript-style errors embedded in Next.js output.
        errors: list[BuildError] = self._parse_ts_errors(combined)

        # Secondary parse: plain ``Error:`` lines not captured by the TS regex.
        # These appear as module-resolution or build-pipeline failures.
        plain_error_re = re.compile(
            r"^\s*(?:>?\s*)?Error:\s+(.+)$",
            re.MULTILINE,
        )
        seen_messages = {e.message for e in errors}
        for match in plain_error_re.finditer(combined):
            msg = match.group(1).strip()
            if msg and msg not in seen_messages:
                seen_messages.add(msg)
                errors.append(BuildError(
                    file_path="",
                    line=0,
                    column=0,
                    message=msg,
                    error_code="NEXT_BUILD",
                ))

        return passed, errors

    @staticmethod
    def _parse_ts_errors(output: str) -> list["BuildError"]:
        """Parse TypeScript compiler output and return a deduplicated list of
        :class:`BuildError` objects.

        Parity: Android ``_parse_gradle_errors`` — same dedup logic, same
        return contract, adapted for the TypeScript error format::

            src/app/page.tsx(12,5): error TS2345: Argument of type …

        The regex also handles the alternate format emitted by ``tsc`` when
        running inside Next.js::

            ./src/app/page.tsx
            Type error: …  (no line/col)

        Lines that carry neither a ``TS``-code nor explicit location info are
        captured as zero-location entries so that the repair prompt can still
        surface them.

        Args:
            output: Raw combined stdout+stderr from a ``tsc`` or ``next build``
                invocation.

        Returns:
            Deduplicated list of :class:`BuildError`; order matches first
            occurrence in *output*.
        """
        errors: list[BuildError] = []
        seen: set[tuple[str, int, str]] = set()

        # Primary pattern: ``file.ts(line,col): error TSxxxx: message``
        # Handles optional leading ``./`` as emitted by Next.js.
        primary_re = re.compile(
            r"^(\.{0,2}[^\s(]+\.[tj]sx?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$",
            re.MULTILINE,
        )
        for m in primary_re.finditer(output):
            file_path = m.group(1).strip().lstrip("./")
            line = int(m.group(2))
            column = int(m.group(3))
            error_code = m.group(4)
            message = m.group(5).strip()
            key = (file_path, line, message)
            if key not in seen:
                seen.add(key)
                errors.append(BuildError(
                    file_path=file_path,
                    line=line,
                    column=column,
                    message=message,
                    error_code=error_code,
                ))

        # Secondary pattern: ``./src/foo.tsx\nType error: message``
        # Emitted by Next.js when tsc is run internally.
        secondary_re = re.compile(
            r"^(\.{0,2}[^\s(]+\.[tj]sx?)\s*\n\s*(?:Type error|error):\s+(.+)$",
            re.MULTILINE,
        )
        for m in secondary_re.finditer(output):
            file_path = m.group(1).strip().lstrip("./")
            message = m.group(2).strip()
            key = (file_path, 0, message)
            if key not in seen:
                seen.add(key)
                errors.append(BuildError(
                    file_path=file_path,
                    line=0,
                    column=0,
                    message=message,
                    error_code="TS_TYPE_ERROR",
                ))

        return errors

    def _build_repair_prompt(
        self,
        errors: list["BuildError"],
        generated_dir: Path,
        mkb_context: str,
    ) -> str:
        """Build the LLM repair prompt from a list of TypeScript *errors*.

        Parity: Android ``_build_repair_prompt`` — same structure (header,
        common-fix hints, context block, errors-by-file with current file
        contents, output instructions).  Adapted for TypeScript/Next.js:

        * Language sections use ``typescript`` fences.
        * Common-fix hints target React / Next.js patterns.
        * MKB context replaces the Android API-contracts block.
        * Output format instructs Claude to use ``### FILE: path`` markers with
          fenced ``typescript`` code blocks, matching :class:`CodeFileExtractor`.

        Args:
            errors:        List of :class:`BuildError` objects to repair.
            generated_dir: Root of the generated Next.js project; used to read
                           current file contents for the prompt.
            mkb_context:   Relevant snippet from the MigrationKnowledgeBase to
                           provide project-level context.

        Returns:
            The full repair prompt string ready to pass to ``_invoke_claude_code``.
        """
        from collections import defaultdict

        # Group errors by file so the prompt presents a clean per-file view.
        errors_by_file: dict[str, list[BuildError]] = defaultdict(list)
        for err in errors:
            errors_by_file[err.file_path].append(err)

        sections: list[str] = []
        sections.append("# Build Gate Repair — TypeScript/Next.js")
        sections.append("")
        sections.append(
            f"The project has **{len(errors)} TypeScript compilation error(s)**. "
            "Fix ALL errors listed below. Output the corrected files using "
            "`### FILE: <relative-path>` markers with fenced `typescript` code blocks."
        )
        sections.append("")

        # ── Common fix patterns (TypeScript / Next.js) ───────────────────────
        sections.append("## Common Fix Patterns")
        sections.append(
            "- **TS2345 / TS2322 type mismatch**: Align the value type with the "
            "declared parameter or return type. Check generic type parameters."
        )
        sections.append(
            "- **TS2305 / TS2339 missing export or property**: Ensure the "
            "named export exists in the source module, add it if absent."
        )
        sections.append(
            "- **TS2307 cannot find module**: Verify the import path is correct "
            "and that the module is listed in package.json / tsconfig paths."
        )
        sections.append(
            "- **TS7006 implicit any**: Add an explicit type annotation to the "
            "parameter or variable."
        )
        sections.append(
            "- **Next.js 'use client' / 'use server' boundary**: If a Server "
            "Component uses browser APIs or React hooks, add `'use client'` at "
            "the top of the file."
        )
        sections.append(
            "- **next/navigation vs next/router**: Use `useRouter` from "
            "`next/navigation` in the App Router; never import from `next/router`."
        )
        sections.append(
            "- **Missing React import**: Next.js 13+ does not auto-import React; "
            "add `import React from 'react'` when JSX is used without it."
        )
        sections.append("")

        # ── MKB context (replaces Android's API-contracts block) ─────────────
        if mkb_context:
            sections.append("## Migration Knowledge Base Context")
            sections.append(mkb_context)
            sections.append("")

        # ── Errors by file with current file contents ─────────────────────────
        sections.append("## Errors by File")
        # Limit to at most 5 unique files to keep prompt size bounded.
        unique_files = list(errors_by_file.keys())[:5]
        for file_path in unique_files:
            file_errors = errors_by_file[file_path]
            label = f"`{file_path}`" if file_path else "(unattributed)"
            sections.append(f"\n### Errors in {label} ({len(file_errors)} error(s))")
            for err in file_errors:
                if err.line:
                    sections.append(
                        f"- Line {err.line}:{err.column} [{err.error_code}] — {err.message}"
                    )
                else:
                    sections.append(f"- [{err.error_code}] — {err.message}")

            # Embed current file content so the LLM can see what needs changing.
            if file_path:
                abs_path = Path(file_path)
                if not abs_path.is_absolute():
                    abs_path = generated_dir / file_path
                if abs_path.exists():
                    try:
                        current_content = abs_path.read_text(encoding="utf-8")
                        sections.append(f"\n#### Current content of `{file_path}`")
                        sections.append("```typescript")
                        sections.append(current_content)
                        sections.append("```")
                    except Exception:
                        sections.append(
                            f"*(Could not read `{file_path}` — file may have been deleted)*"
                        )

        # Mention any additional files not included above.
        remaining = len(errors_by_file) - len(unique_files)
        if remaining > 0:
            sections.append(
                f"\n*({remaining} additional file(s) with errors not shown — "
                "fix the errors listed above first, as they may cascade.)*"
            )

        sections.append("")

        # ── Output instructions ───────────────────────────────────────────────
        sections.append("## Output Instructions")
        sections.append(
            "Output **only** the files that need changes. "
            "Use the exact format below for each file — no prose between files:"
        )
        sections.append("")
        sections.append("### FILE: src/app/example/page.tsx")
        sections.append("```typescript")
        sections.append("// full corrected file content here")
        sections.append("```")
        sections.append("")
        sections.append(
            "- Use the path relative to the project root (e.g. `src/app/page.tsx`)."
        )
        sections.append(
            "- Include the **entire** file content, not just the changed lines."
        )
        sections.append(
            "- Do **not** truncate with `// ... rest unchanged` — output the "
            "complete file so it can be written directly to disk."
        )

        return "\n".join(sections)

    def _collect_ts_context_for_repair(self, gate_id: str) -> str:
        """Collect TypeScript export signatures from shared modules for repair context.

        Parity: Android ``_collect_api_context_for_repair`` — scans compiled
        module artifacts to extract public API signatures and feeds them into the
        repair prompt so the LLM can align import paths and type names.

        For feature-module gates the method reads ``src/lib`` and
        ``src/components`` TypeScript files and extracts ``export`` declaration
        lines (functions, types, interfaces, constants).  For app-level gates it
        additionally includes page component signatures.

        Args:
            gate_id: The gate identifier, e.g. ``"gate.phase2.tsc"``.  The
                     string is inspected for ``"features"`` or ``"app"`` to
                     decide which modules to scan.

        Returns:
            A string ready to embed in the repair prompt, or ``""`` if nothing
            useful was found.
        """
        context_parts: list[str] = []
        generated_dir = self.generated_dir

        # ── Shared lib / hooks — always included ────────────────────────────
        for subdir in ("src/lib", "src/hooks", "src/store"):
            lib_dir = generated_dir / subdir
            if not lib_dir.exists():
                continue
            for ts_file in sorted(lib_dir.rglob("*.ts")) + sorted(lib_dir.rglob("*.tsx")):  # type: ignore[operator]
                try:
                    content = ts_file.read_text(encoding="utf-8")
                except Exception:
                    continue
                sig_lines = [
                    line.strip()
                    for line in content.splitlines()
                    if line.strip().startswith("export ")
                ]
                if sig_lines:
                    rel = str(ts_file.relative_to(generated_dir)).replace("\\", "/")
                    context_parts.append(f"### {rel}")
                    context_parts.extend(sig_lines[:15])
                    context_parts.append("")

        # ── Feature page components — included for app-level gates ──────────
        if "app" in gate_id or "full" in gate_id:
            for mod_name, _namespace, _comp in self.FEATURE_CODEGEN_MODULES:
                feature_dir = generated_dir / "src" / "app" / f"({mod_name})"
                if not feature_dir.exists():
                    continue
                for tsx_file in sorted(feature_dir.rglob("page.tsx")):
                    try:
                        content = tsx_file.read_text(encoding="utf-8")
                    except Exception:
                        continue
                    for line in content.splitlines():
                        stripped = line.strip()
                        if stripped.startswith("export ") and (
                            "function" in stripped or "const" in stripped or "default" in stripped
                        ):
                            rel = str(tsx_file.relative_to(generated_dir)).replace("\\", "/")
                            context_parts.append(f"  {rel}: {stripped}")
                    if context_parts and context_parts[-1] != "":
                        context_parts.append("")

        return "\n".join(context_parts) if context_parts else ""

    async def _build_gate_and_repair(
        self,
        stage: str,
        gate_id: str,
    ) -> "BuildGateResult":
        """Run the TypeScript build gate and auto-repair loop for *gate_id*.

        This is the web-pipeline equivalent of Android
        ``_compile_gate_and_repair``.  It mirrors the Android design exactly:

        1. Short-circuit when ``self.build_gate_enabled`` is ``False``.
        2. Return a cached result from ``self._gate_cache`` when the same
           *gate_id* has already passed in this session.
        3. Check for a persisted JSON report on disk (resume support).
        4. Run ``pnpm tsc --noEmit`` (and optionally ``pnpm next build``) to
           collect :class:`BuildError` objects.
        5. On failure: build a repair prompt, invoke ``_invoke_claude_code``,
           extract repaired files via ``self.extractor``, and write them to
           ``self.generated_dir``.
        6. Repeat up to ``self.build_gate_max_retries`` additional attempts;
           abort early if the error count stops decreasing.
        7. Write JSON + Markdown reports, record issues, and return a
           :class:`BuildGateResult`.

        Parity: Android ``_compile_gate_and_repair`` — identical structure,
        all six design invariants preserved.

        Args:
            stage:   The pipeline stage that triggered this gate, e.g.
                     ``"codegen.features.auth"``.  Used for issue-collector
                     attribution.
            gate_id: Unique key for this gate check, e.g.
                     ``"gate.phase2.tsc"``.  Controls the cache key and the
                     on-disk report filename.

        Returns:
            A :class:`BuildGateResult` describing the outcome of the gate.
        """
        import time as _time

        # ── 1. Disabled gate — pass immediately ──────────────────────────────
        if not self.build_gate_enabled:
            result = BuildGateResult(
                gate_id=gate_id,
                build_command=f"{self.pnpm_cmd} tsc --noEmit",
                passed=True,
                total_attempts=0,
                errors_per_attempt=[],
                repaired_files=[],
                elapsed_seconds=0.0,
            )
            return result

        # ── 2. In-session cache — already passed ─────────────────────────────
        if gate_id in self._gate_cache:
            cached = self._gate_cache[gate_id]
            if cached.passed:
                print(f"  [build-gate] {gate_id}: skipping (already passed in this session)")
                return cached

        start = _time.monotonic()

        # ── 3. Disk resume — skip if a passing report exists ─────────────────
        report_json = self._ap(f"build.gate.{gate_id}.json")
        if report_json.exists():
            try:
                prev = json.loads(report_json.read_text(encoding="utf-8"))
                if prev.get("passed"):
                    print(f"  [build-gate] {gate_id}: skipping (already passed, loaded from disk)")
                    result = BuildGateResult(
                        gate_id=gate_id,
                        build_command=prev.get("build_command", f"{self.pnpm_cmd} tsc --noEmit"),
                        passed=True,
                        total_attempts=prev.get("total_attempts", 0),
                        errors_per_attempt=prev.get("errors_per_attempt", []),
                        repaired_files=prev.get("repaired_files", []),
                        elapsed_seconds=prev.get("elapsed_seconds", 0.0),
                    )
                    self._gate_cache[gate_id] = result
                    return result
            except (json.JSONDecodeError, KeyError):
                pass  # Corrupt report — re-run the gate.

        # ── 4. Build + repair loop ────────────────────────────────────────────
        errors_per_attempt: list[int] = []
        repaired_files: list[str] = []
        build_cmd_label = f"{self.pnpm_cmd} tsc --noEmit"
        max_attempts = self.build_gate_max_retries + 1  # 1 initial + N retries

        for attempt in range(1, max_attempts + 1):
            print(
                f"  [build-gate] {gate_id}: TypeScript build attempt "
                f"{attempt}/{max_attempts} ..."
            )

            # Run tsc.
            tsc_passed, tsc_errors = self._run_tsc(self.generated_dir)

            if tsc_passed:
                print(f"  [build-gate] {gate_id}: tsc PASSED on attempt {attempt}")
                errors_per_attempt.append(0)
                elapsed = _time.monotonic() - start
                result = BuildGateResult(
                    gate_id=gate_id,
                    build_command=build_cmd_label,
                    passed=True,
                    total_attempts=attempt,
                    errors_per_attempt=errors_per_attempt,
                    repaired_files=repaired_files,
                    elapsed_seconds=elapsed,
                )
                report_json.write_text(
                    json.dumps(asdict(result), indent=2), encoding="utf-8"
                )
                self._gate_cache[gate_id] = result
                if attempt > 1:
                    self.issue_collector.record(
                        stage=stage,
                        category="build_error",
                        severity="MEDIUM",
                        symptom=(
                            f"Build gate {gate_id}: {errors_per_attempt[0]} initial "
                            f"TypeScript error(s), repaired in {attempt} attempt(s)"
                        ),
                        root_cause="TypeScript compilation errors after code generation",
                        resolution=(
                            f"Auto-repaired by LLM. Error progression: "
                            f"{' -> '.join(str(e) for e in errors_per_attempt)}"
                        ),
                        files_affected=repaired_files,
                        error_count=errors_per_attempt[0],
                        metadata={
                            "error_progression": errors_per_attempt,
                            "build_command": build_cmd_label,
                            "gate_id": gate_id,
                        },
                    )
                return result

            # tsc failed — collect errors.
            errors: list[BuildError] = tsc_errors
            error_count = len(errors)
            errors_per_attempt.append(error_count)
            print(f"  [build-gate] {gate_id}: {error_count} TypeScript error(s) on attempt {attempt}")

            if error_count == 0:
                # Non-zero exit but no parseable errors (e.g. config / env issue).
                print(
                    f"  [build-gate] {gate_id}: tsc failed but no parseable errors — "
                    "skipping repair"
                )
                break

            # Early exit: stalled repair — error count not decreasing.
            if attempt >= 3 and errors_per_attempt[-1] >= errors_per_attempt[-2]:
                print(
                    f"  [build-gate] {gate_id}: error count not decreasing "
                    f"({errors_per_attempt[-2]} -> {errors_per_attempt[-1]}), "
                    "stopping repair"
                )
                break

            if attempt == max_attempts:
                break  # Exhausted retries — fall through to failure handling.

            # ── 5. Invoke LLM repair ─────────────────────────────────────────
            mkb_context = self.mkb.build_context_snippet(
                "typescript type error import missing module next.js component"
            )
            ts_context = self._collect_ts_context_for_repair(gate_id)
            if ts_context:
                mkb_context = mkb_context + "\n\n## TypeScript Exports\n" + ts_context

            repair_prompt = self._build_repair_prompt(
                errors=errors,
                generated_dir=self.generated_dir,
                mkb_context=mkb_context,
            )

            print(
                f"  [build-gate] {gate_id}: invoking LLM for repair "
                f"(attempt {attempt}) ..."
            )
            try:
                repair_output = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self._invoke_claude_code(repair_prompt, stage=f"build.gate.{gate_id}"),
                )
            except Exception as exc:
                print(f"  [build-gate] {gate_id}: LLM repair invocation failed: {exc}")
                break

            # ── 6. Extract and write repaired files ──────────────────────────
            files = self.extractor.extract_files(repair_output)
            if not files:
                print(
                    f"  [build-gate] {gate_id}: LLM returned no ### FILE: markers — "
                    "stopping repair"
                )
                break

            written = self.extractor.write_files(self.generated_dir, files)
            for w in written:
                try:
                    rel = str(w.relative_to(self.generated_dir)).replace("\\", "/")
                except ValueError:
                    rel = str(w).replace("\\", "/")
                if rel not in repaired_files:
                    repaired_files.append(rel)
            print(
                f"  [build-gate] {gate_id}: wrote {len(written)} repaired file(s)"
            )

        # ── 7. Final result (failed or retries exhausted) ─────────────────────
        elapsed = _time.monotonic() - start
        final_error_count = errors_per_attempt[-1] if errors_per_attempt else 0
        passed = final_error_count == 0

        result = BuildGateResult(
            gate_id=gate_id,
            build_command=build_cmd_label,
            passed=passed,
            total_attempts=len(errors_per_attempt),
            errors_per_attempt=errors_per_attempt,
            repaired_files=repaired_files,
            elapsed_seconds=elapsed,
        )

        # Persist JSON report (enables resume on next run).
        report_json.write_text(json.dumps(asdict(result), indent=2), encoding="utf-8")

        # Human-readable Markdown report.
        md_lines = [
            f"# Build Gate Report: {gate_id}",
            f"- Build command: `{build_cmd_label}`",
            f"- Passed: **{passed}**",
            f"- Attempts: {result.total_attempts}",
            f"- Error progression: {' → '.join(str(e) for e in errors_per_attempt)}",
            f"- Repaired files: {len(repaired_files)}",
            f"- Elapsed: {elapsed:.1f}s",
        ]
        if repaired_files:
            md_lines.append("\n## Repaired Files")
            for rf in repaired_files:
                md_lines.append(f"- `{rf}`")
        report_md = self._ap(f"build.gate.{gate_id}.md")
        report_md.write_text("\n".join(md_lines), encoding="utf-8")

        # Cache the result regardless of pass/fail.
        self._gate_cache[gate_id] = result

        if not passed:
            self.issue_collector.record(
                stage=stage,
                category="build_error",
                severity="HIGH" if final_error_count < 10 else "CRITICAL",
                symptom=(
                    f"Build gate {gate_id}: FAILED after {result.total_attempts} "
                    f"attempt(s) ({final_error_count} TypeScript error(s) remaining)"
                ),
                root_cause=(
                    "TypeScript compilation errors that the LLM repair loop could "
                    "not fully resolve"
                ),
                resolution="unresolved",
                files_affected=repaired_files,
                error_count=final_error_count,
                metadata={
                    "error_progression": errors_per_attempt,
                    "build_command": build_cmd_label,
                    "gate_id": gate_id,
                },
            )
            failure_msg = (
                f"Build gate '{gate_id}' FAILED after {result.total_attempts} attempt(s). "
                f"Error progression: {errors_per_attempt}. "
                f"See {report_md} for details."
            )
            if self.build_gate_on_failure == "block":
                raise RuntimeError(failure_msg)
            print(f"  [build-gate] WARNING: {failure_msg}")

        return result

    def _collect_ts_api_context_for_repair(self, gate_id: str, project_dir: Path) -> str:
        """Collect TypeScript public API signatures for the repair prompt.

        Parity: Android _collect_api_context_for_repair().

        For feature or app-level gates, scans src/lib, src/hooks, src/services,
        src/types for exported type/function signatures to give the LLM repair
        prompt enough context about available APIs to fix import errors.
        """
        import re as _re

        context_parts: list[str] = []
        sig_pattern = _re.compile(
            r"^\s*(export\s+)?(async\s+)?(function|const|class|interface|type|enum)\s+\w",
            _re.MULTILINE,
        )

        scan_dirs: list[Path] = []
        if any(kw in gate_id for kw in ("features", "app", "assemble")):
            for sub in ("lib", "hooks", "services", "types"):
                d = project_dir / "src" / sub
                if d.is_dir():
                    scan_dirs.append(d)

        for scan_dir in scan_dirs:
            ts_files = sorted(scan_dir.rglob("*.ts")) + sorted(scan_dir.rglob("*.tsx"))
            for ts_file in ts_files:
                try:
                    content = ts_file.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue
                sig_lines = [
                    line.strip()
                    for line in content.splitlines()
                    if sig_pattern.match(line)
                ][:15]
                if sig_lines:
                    try:
                        rel = str(ts_file.relative_to(project_dir))
                    except ValueError:
                        rel = str(ts_file)
                    context_parts.append(f"### {rel}")
                    context_parts.extend(sig_lines)
                    context_parts.append("")

        return "\n".join(context_parts) if context_parts else ""

    def _write_build_gate_summary(self) -> None:
        """Write a Markdown summary table of all build gate results.

        Parity: Android _write_compile_gate_summary().
        Called after each major codegen phase when build_gate_enabled=True.
        """
        gate_reports = sorted(self.artifacts_dir.rglob("build.gate.*.json"))
        if not gate_reports:
            return

        rows: list[dict] = []
        total_passed = 0
        total_failed = 0
        total_repaired = 0

        for report_path in gate_reports:
            try:
                data = json.loads(report_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue
            rows.append(data)
            if data.get("passed"):
                total_passed += 1
            else:
                total_failed += 1
            total_repaired += len(data.get("repaired_files", []))

        lines: list[str] = [
            "# Build Gate Summary",
            "",
            "| Gate ID | npm script | Passed | Attempts | Error Progression | Repaired Files | Time |",
            "| --- | --- | --- | --- | --- | --- | --- |",
        ]
        for row in rows:
            prog = " → ".join(str(e) for e in row.get("errors_per_attempt", []))
            lines.append(
                f"| {row.get('gate_id', '')} "
                f"| {row.get('build_command', '')} "
                f"| {'✅' if row.get('passed') else '❌'} "
                f"| {row.get('total_attempts', 0)} "
                f"| {prog} "
                f"| {len(row.get('repaired_files', []))} "
                f"| {row.get('elapsed_seconds', 0):.1f}s |"
            )

        lines.append("")
        lines.append(
            f"**Total: {total_passed} passed, {total_failed} failed, "
            f"{total_repaired} files repaired**"
        )

        summary_path = self._ap("build.gate.summary.md")
        summary_path.write_text("\n".join(lines), encoding="utf-8")
        print(f"  [build-gate] Summary written to {summary_path}")

    # ─────────────────────────────────────────────────────────────────────────
    # Section 10 — Source Collectors
    # ─────────────────────────────────────────────────────────────────────────

    def _collect_angular_source(self, max_chars: int = 60_000) -> str:
        """Return formatted source context for all Angular source files.

        Delegates to SourceContextBuilder.build_context_for_stage() with a
        broad query so the builder can apply TF-IDF / BM25 scoring across the
        entire Angular codebase.  Used by extract.* and validation stages that
        need full project context.

        Parity: Android _collect_generated_source() / _collect_legacy_source_for_app().
        """
        query = (
            "Angular components services modules routing state NgRx HttpClient "
            "TypeScript interfaces models"
        )
        ctx = self.source_ctx.build_context_for_stage(
            self.source_root, query, max_chars
        )
        if not ctx or not ctx.strip():
            return "(no Angular source files found under source root)"
        return ctx

    def _collect_feature_source(
        self, feature: str, max_chars: int = 40_000
    ) -> str:
        """Return formatted source context scoped to a single Angular feature module.

        If the feature is present in LEGACY_FILE_MAPPING, reads exactly those
        listed source files from ``self.source_root`` and concatenates them with
        ``### FILE:`` headers (parity: Android hand-curated file map).  Falls
        back to the SourceContextBuilder keyword-search heuristic for any
        feature not in the map.

        Args:
            feature:   Feature key, e.g. ``"auth"``, ``"home"``, ``"search"``.
            max_chars: Hard cap on returned context length.

        Parity: Android _collect_legacy_source_for_feature().
        """
        if feature in self.LEGACY_FILE_MAPPING:
            parts: list[str] = []
            total = 0
            file_groups = self.LEGACY_FILE_MAPPING[feature]
            for _group, rel_paths in file_groups.items():
                for rel_path in rel_paths:
                    abs_path = self.source_root / rel_path
                    if not abs_path.exists():
                        continue
                    try:
                        text = abs_path.read_text(encoding="utf-8", errors="replace")
                    except OSError:
                        continue
                    header = f"### FILE: {rel_path}\n"
                    chunk = header + text + "\n"
                    if total + len(chunk) > max_chars:
                        remaining = max_chars - total
                        if remaining > len(header) + 100:
                            parts.append(header + text[: remaining - len(header)] + "\n")
                        break
                    parts.append(chunk)
                    total += len(chunk)
                if total >= max_chars:
                    break
            if parts:
                return "".join(parts)
            return f"(no Angular source files found for feature '{feature}')"

        # ── Fallback: keyword-search heuristic ───────────────────────────────
        query = (
            f"Angular {feature} component service module routing template "
            f"NgRx state HttpClient interface model"
        )
        ctx = self.source_ctx.build_context_for_stage(
            self.source_root, query, max_chars
        )
        if not ctx or not ctx.strip():
            return f"(no Angular source files found for feature '{feature}')"
        return ctx

    def _collect_routing_source(self, max_chars: int = 20_000) -> str:
        """Return formatted source context for Angular routing files.

        Targets routing modules, route guards, lazy-loaded route definitions,
        and the app-routing.module.ts.  Used by plan.routes to understand the
        full Angular routing tree before mapping to Next.js App Router.

        Parity: Android _collect_legacy_nav_graph().
        """
        query = (
            "Angular routing module routes path loadChildren canActivate guard "
            "RouterModule forRoot forChild lazy-load"
        )
        ctx = self.source_ctx.build_context_for_stage(
            self.source_root, query, max_chars
        )
        if not ctx or not ctx.strip():
            return "(no Angular routing source files found)"
        return ctx

    def _collect_service_source(self, max_chars: int = 20_000) -> str:
        """Return formatted source context for Angular service files.

        Targets Injectable services, HttpClient calls, interceptors, and API
        endpoint definitions.  Used by codegen.services to generate the
        Next.js / TanStack Query equivalents.

        Parity: Android _collect_legacy_source_for_services().
        """
        query = (
            "Angular Injectable service HttpClient get post put delete "
            "interceptor API endpoint environment Observable"
        )
        ctx = self.source_ctx.build_context_for_stage(
            self.source_root, query, max_chars
        )
        if not ctx or not ctx.strip():
            return "(no Angular service source files found)"
        return ctx

    def _collect_component_source(
        self, feature: str = "", max_chars: int = 30_000
    ) -> str:
        """Return formatted source context for Angular component files.

        When *feature* is provided the query is narrowed to that feature's
        components; otherwise all component files are considered.  Used by
        codegen.layout and ui.spec stages.

        Args:
            feature:   Optional feature filter, e.g. ``"auth"`` or ``"home"``.
            max_chars: Hard cap on returned context length.

        Parity: Android _collect_screen_composables().
        """
        feature_clause = f"{feature} " if feature else ""
        query = (
            f"Angular {feature_clause}component template HTML CSS OnInit "
            f"ChangeDetection Input Output EventEmitter ViewChild"
        )
        ctx = self.source_ctx.build_context_for_stage(
            self.source_root, query, max_chars
        )
        if not ctx or not ctx.strip():
            label = f" for feature '{feature}'" if feature else ""
            return f"(no Angular component source files found{label})"
        return ctx

    def _collect_existing_generated_files(
        self, glob_patterns: list[str], max_chars: int = 30_000
    ) -> str:
        """Return contents of already-generated Next.js files matching glob patterns.

        Used by equivalence.fix and ui.layout.match stages to give the LLM the
        current generated code before requesting corrections.

        Parity: Android _collect_existing_generated_files().
        """
        parts: list[str] = []
        total = 0
        for pattern in glob_patterns:
            for path in sorted(self.generated_dir.glob(pattern)):
                if not path.is_file():
                    continue
                try:
                    text = path.read_text(encoding="utf-8", errors="replace")
                except OSError:
                    continue
                rel = path.relative_to(self.generated_dir)
                header = f"\n### FILE: {rel}\n"
                chunk = header + text
                if total + len(chunk) > max_chars:
                    break
                parts.append(chunk)
                total += len(chunk)
        if not parts:
            return "(no matching generated files found)"
        return "".join(parts)

    def _collect_angular_templates(
        self, glob_patterns: list[str], max_chars: int = 30_000
    ) -> str:
        """Return contents of Angular HTML templates matching glob patterns.

        Used by ui.layout.match to compare Angular template layout with the
        generated Next.js component for visual parity.

        Parity: Android _collect_legacy_layout_xml().
        """
        parts: list[str] = []
        total = 0
        for pattern in glob_patterns:
            for path in sorted(self.source_root.glob(pattern)):
                if not path.is_file():
                    continue
                try:
                    text = path.read_text(encoding="utf-8", errors="replace")
                except OSError:
                    continue
                rel = path.relative_to(self.source_root)
                header = f"\n### TEMPLATE: {rel}\n"
                chunk = header + text
                if total + len(chunk) > max_chars:
                    break
                parts.append(chunk)
                total += len(chunk)
        if not parts:
            return "(no matching Angular template files found)"
        return "".join(parts)

    # ─────────────────────────────────────────────────────────────────────────
    # Section 11 — Stage Runners
    # ─────────────────────────────────────────────────────────────────────────

    # ── Phase 1 — Discovery ───────────────────────────────────────────────────

    async def _run_extract_inventory(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        context_doc_id: str = "",
    ) -> tuple[str, str]:
        """Runner: extract.inventory — inventory all Angular source files."""
        stage = "extract.inventory"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        legacy_ctx = self._collect_angular_source()
        mkb_ctx = self.mkb.build_context_snippet(
            "Angular inventory components services modules routes", top_k=3
        )
        prompt = self._prompt_extract_inventory(legacy_ctx, mkb_ctx)
        related = [context_doc_id] if context_doc_id else []
        return await self._invoke_stage(stage, prompt, related)

    async def _run_extract_analysis(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        inventory_output: str,
    ) -> tuple[str, str]:
        """Runner: extract.analysis — deep analysis of Angular codebase."""
        stage = "extract.analysis"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        legacy_ctx = self._collect_angular_source()
        mkb_ctx = self.mkb.build_context_snippet(
            "Angular analysis NgRx state HttpClient dependency injection patterns", top_k=3
        )
        prompt = self._prompt_extract_analysis(legacy_ctx, inventory_output, mkb_ctx)
        return await self._invoke_stage(stage, prompt)

    async def _run_extract_decomposition(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        inventory_output: str,
        analysis_output: str,
    ) -> tuple[str, str]:
        """Runner: extract.decomposition — decompose Angular modules into migration units."""
        stage = "extract.decomposition"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        legacy_ctx = self._collect_angular_source()
        mkb_ctx = self.mkb.build_context_snippet(
            "Angular module decomposition feature boundary migration unit", top_k=3
        )
        prompt = self._prompt_extract_decomposition(
            legacy_ctx, inventory_output, analysis_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    # ── Phase 2 — Planning ────────────────────────────────────────────────────

    async def _run_plan_architecture(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        inventory_output: str,
        analysis_output: str,
        decomposition_output: str,
    ) -> tuple[str, str]:
        """Runner: plan.architecture — design Next.js 15 target architecture."""
        stage = "plan.architecture"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "Next.js App Router architecture Zustand TanStack Query 5-layer", top_k=3
        )
        prompt = self._prompt_plan_architecture(
            inventory_output, analysis_output, decomposition_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_plan_routes(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        decomposition_output: str,
    ) -> tuple[str, str]:
        """Runner: plan.routes — map Angular routes to Next.js App Router route groups."""
        stage = "plan.routes"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        routing_ctx = self._collect_routing_source()
        mkb_ctx = self.mkb.build_context_snippet(
            "Next.js App Router route group layout page segment convention", top_k=3
        )
        prompt = self._prompt_plan_routes(
            routing_ctx, architecture_output, decomposition_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_plan_state(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        analysis_output: str,
    ) -> tuple[str, str]:
        """Runner: plan.state — design Zustand store slices replacing NgRx."""
        stage = "plan.state"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "Zustand store slice NgRx replace state management selector action", top_k=3
        )
        prompt = self._prompt_plan_state(
            architecture_output, analysis_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_integration_migration(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        analysis_output: str,
        decomposition_output: str,
    ) -> tuple[str, str]:
        """Runner: integration_migration — plan API contracts, interceptors, guards, and third-party SDK migration.

        Parity: Android integration_migration stage.
        Produces an integration migration plan that all codegen stages reference
        for consistent API integration patterns.
        """
        stage = "integration_migration"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        legacy_ctx = self._collect_angular_source(max_chars=25_000)
        mkb_ctx = self.mkb.build_context_snippet(
            "HTTP interceptor route guard third-party SDK Firebase Google Maps API contract adapter", top_k=3
        )
        prompt = self._prompt_integration_migration(
            architecture_output=architecture_output,
            analysis_output=analysis_output,
            decomposition_output=decomposition_output,
            legacy_ctx=legacy_ctx,
            mkb_ctx=mkb_ctx,
        )
        return await self._invoke_stage(stage, prompt)

    # ── Phase 3 — Scaffold (deterministic) ───────────────────────────────────

    async def _run_scaffold(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
    ) -> tuple[str, str]:
        """Runner: scaffold — deterministic Next.js project scaffold (no LLM call).

        Calls NextJsProjectScaffolder.scaffold() to write config files and
        directory stubs, then writes the render_summary to disk and MKB.

        Parity: Android _run_codegen_assemble (deterministic stage pattern).
        """
        stage = "scaffold"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        # Deterministic — no LLM call
        self.scaffolder.scaffold(self.generated_dir)
        render_summary = self.scaffolder.render_summary(self.generated_dir)

        # Write artifact to disk
        stage_file = self._ap(f"{stage}.md")
        stage_file.write_text(render_summary, encoding="utf-8")

        # Register in MKB (prompt placeholder documents the deterministic nature)
        artifact = StageArtifact(
            stage=stage,
            prompt="(deterministic -- no LLM call)",
            output=render_summary,
            created_at=datetime.now(UTC).isoformat(),
        )
        doc_id = self.mkb.write_stage_artifact(artifact=artifact, related_doc_ids=[])
        self._stage_artifacts[stage] = artifact

        print(f"  [scaffold] Next.js project scaffold written to {self.generated_dir}")
        return render_summary, doc_id

    async def _run_copy_static(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
    ) -> tuple[str, str]:
        """Runner: copy.static — copy Angular static assets to Next.js public/ directory.

        Parity: Android _run_copy_assets() — deterministic file copy, no LLM call.
        Copies src/assets/ and any public/ files from the Angular source to generated/public/.
        """
        import shutil as _shutil

        stage = "copy.static"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )

        # Resume check
        manifest_path = self._ap("copy.static.files.json")
        artifact_path = self._ap("copy.static.md")
        if manifest_path.exists() and artifact_path.exists():
            output = artifact_path.read_text(encoding="utf-8")
            doc_id = self.mkb.write_document(
                doc_type="stage_output", stage=stage,
                content=output, metadata={"source": "resume_artifact"},
            )
            print("  [copy.static] Skipping (already copied)")
            return output, doc_id

        target_public = self.generated_dir / "public"
        target_public.mkdir(parents=True, exist_ok=True)

        written_files: list[str] = []
        category_counts: dict[str, int] = {}

        # Angular asset directories to copy
        asset_sources = [
            self.source_root / "assets",
            self.source_root / "public",
            self.source_root.parent / "public",
            self.source_root.parent / "assets",
        ]

        for src_dir in asset_sources:
            if not src_dir.is_dir():
                continue
            print(f"  [copy.static] Copying {src_dir} -> {target_public}")
            for src_file in sorted(src_dir.rglob("*")):
                if not src_file.is_file():
                    continue
                rel = src_file.relative_to(src_dir)
                dst = target_public / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                _shutil.copy2(src_file, dst)
                rel_str = str(dst.relative_to(self.generated_dir)).replace("\\", "/")
                written_files.append(rel_str)
                base = src_file.suffix or "misc"
                category_counts[base] = category_counts.get(base, 0) + 1

        # Write manifest
        manifest_path.write_text(json.dumps(written_files, indent=2), encoding="utf-8")

        summary_lines = [f"# Copy Static Assets\n\nCopied {len(written_files)} files to public/\n"]
        for ext, count in sorted(category_counts.items()):
            summary_lines.append(f"- `{ext}`: {count} files")
        if not written_files:
            summary_lines.append("- No Angular asset directories found (src/assets/, public/)")

        output = "\n".join(summary_lines)
        artifact_path.write_text(output, encoding="utf-8")

        artifact = StageArtifact(
            stage=stage,
            prompt="(deterministic file copy — no LLM)",
            output=output,
            created_at=datetime.now(UTC).isoformat(),
        )
        doc_id = self.mkb.write_stage_artifact(artifact=artifact, related_doc_ids=[])
        return output, doc_id

    # ── Phase 3 — Codegen (LLM) ──────────────────────────────────────────────

    async def _run_codegen_layout(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        scaffold_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.layout — generate Next.js root layout and shell components."""
        stage = "codegen.layout"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        component_ctx = self._collect_component_source(max_chars=30_000)
        mkb_ctx = self.mkb.build_context_snippet(
            "Next.js root layout RootLayout shell navigation header footer", top_k=3
        )
        prompt = self._prompt_codegen_layout(
            component_ctx, architecture_output, plan_routes_output,
            scaffold_output, mkb_ctx
        )
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        if self.build_gate_enabled and should_run(stage):
            await self._build_gate_and_repair(stage, f"gate.{stage}")
        return output, doc_id

    async def _run_codegen_providers(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_state_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.providers — generate React context providers and Zustand stores."""
        stage = "codegen.providers"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "React context provider Zustand store create slice NgRx replace", top_k=3
        )
        prompt = self._prompt_codegen_providers(
            architecture_output, plan_state_output, codegen_layout_output, mkb_ctx
        )
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        return output, doc_id

    async def _run_codegen_utils(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        analysis_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.utils — generate shared utility functions (lib/utils/)."""
        stage = "codegen.utils"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "utility helper format date currency string validation shared lib", top_k=3
        )
        prompt = self._prompt_codegen_utils(architecture_output, analysis_output, mkb_ctx)
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        return output, doc_id

    async def _run_codegen_types(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        analysis_output: str,
        decomposition_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.types — generate TypeScript interface and type definitions."""
        stage = "codegen.types"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "TypeScript interface type model DTO API response Angular equivalent", top_k=3
        )
        prompt = self._prompt_codegen_types(analysis_output, decomposition_output, mkb_ctx)
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        return output, doc_id

    async def _run_codegen_services(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        analysis_output: str,
        codegen_types_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.services — generate TanStack Query hooks replacing Angular services."""
        stage = "codegen.services"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        service_ctx = self._collect_service_source()
        mkb_ctx = self.mkb.build_context_snippet(
            "TanStack Query useQuery useMutation Angular HttpClient service replace", top_k=3
        )
        prompt = self._prompt_codegen_services(
            service_ctx, analysis_output, codegen_types_output, mkb_ctx
        )
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        if self.build_gate_enabled and should_run(stage):
            await self._build_gate_and_repair(stage, f"gate.{stage}")
        return output, doc_id

    async def _run_codegen_mocks(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        codegen_types_output: str,
        codegen_services_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.mocks — generate MSW mock handlers and fixture data."""
        stage = "codegen.mocks"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "MSW mock service worker handler fixture data test environment", top_k=3
        )
        prompt = self._prompt_codegen_mocks(
            codegen_types_output, codegen_services_output, mkb_ctx
        )
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        return output, doc_id

    async def _run_codegen_navigation(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        codegen_layout_output: str,
        integration_migration_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.navigation — generate Next.js App Router routing files.

        Parity: Android _run_codegen_navigation().
        Generates middleware.ts, route group layouts, loading.tsx, error.tsx,
        and any auth-gated route wrappers. This is a dedicated stage so routing
        is consistent across all feature codegen stages that follow.
        """
        stage = "codegen.navigation"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        routing_ctx = self._collect_routing_source(max_chars=15_000)
        mkb_ctx = self.mkb.build_context_snippet(
            "Next.js App Router middleware route group layout auth guard navigation", top_k=3
        )
        prompt = self._prompt_codegen_navigation(
            architecture_output=architecture_output,
            plan_routes_output=plan_routes_output,
            codegen_layout_output=codegen_layout_output,
            integration_migration_output=integration_migration_output,
            routing_ctx=routing_ctx,
            mkb_ctx=mkb_ctx,
        )
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        if self.build_gate_enabled and should_run(stage):
            await self._build_gate_and_repair(stage, f"gate.{stage}")
        return output, doc_id

    # ── Phase 3 — Feature Codegen ─────────────────────────────────────────────

    async def _run_codegen_feature(
        self,
        feature: str,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.<feature> — generate all pages and components for one feature.

        Args:
            feature: Feature key matching FEATURE_CODEGEN_MODULES, e.g. ``"auth"``.

        Parity: Android _run_codegen_<module> pattern (one runner per feature).
        """
        stage = f"codegen.features.{feature}"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        feature_ctx = self._collect_feature_source(feature)
        component_ctx = self._collect_component_source(feature)
        mkb_ctx = self.mkb.build_context_snippet(
            f"Next.js {feature} page component route group TypeScript React migration", top_k=3
        )
        prompt = self._prompt_codegen_feature(
            feature=feature,
            feature_ctx=feature_ctx,
            component_ctx=component_ctx,
            architecture_output=architecture_output,
            plan_routes_output=plan_routes_output,
            plan_state_output=plan_state_output,
            codegen_types_output=codegen_types_output,
            codegen_services_output=codegen_services_output,
            codegen_layout_output=codegen_layout_output,
            mkb_ctx=mkb_ctx,
        )
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        if self.build_gate_enabled and should_run(stage):
            await self._build_gate_and_repair(stage, f"gate.{stage}")
        return output, doc_id

    async def _run_codegen_features_auth(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.auth"""
        return await self._run_codegen_feature(
            "auth", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_home(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.home"""
        return await self._run_codegen_feature(
            "home", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_search(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.search"""
        return await self._run_codegen_feature(
            "search", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_provider(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.provider"""
        return await self._run_codegen_feature(
            "provider", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_rate_alert(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.rate_alert"""
        return await self._run_codegen_feature(
            "rate_alert", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_profile(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.profile"""
        return await self._run_codegen_feature(
            "profile", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_notification(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.notification"""
        return await self._run_codegen_feature(
            "notification", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_settings(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.settings"""
        return await self._run_codegen_feature(
            "settings", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_content(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.content"""
        return await self._run_codegen_feature(
            "content", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_quiz(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.quiz"""
        return await self._run_codegen_feature(
            "quiz", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_features_misc(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.features.misc"""
        return await self._run_codegen_feature(
            "misc", before_from, should_run,
            architecture_output, plan_routes_output, plan_state_output,
            codegen_types_output, codegen_services_output, codegen_layout_output,
        )

    async def _run_codegen_tests(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_mocks_output: str,
    ) -> tuple[str, str]:
        """Runner: codegen.tests — generate Vitest / Testing Library unit test files."""
        stage = "codegen.tests"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "Vitest Testing Library unit test component hook service MSW", top_k=3
        )
        prompt = self._prompt_codegen_tests(
            architecture_output, codegen_types_output,
            codegen_services_output, codegen_mocks_output, mkb_ctx
        )
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        if self.build_gate_enabled and should_run(stage):
            await self._build_gate_and_repair(stage, f"gate.{stage}")
        return output, doc_id

    async def _run_code_review(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        assemble_output: str = "",
    ) -> tuple[str, str]:
        """Runner: code_review — LLM review pass over generated code for quality, security, equivalence.

        Parity: Android code_review stage.
        Reviews generated files before assembly catches issues that propagate into later stages.
        """
        stage = "code_review"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        generated_ctx = self._collect_existing_generated_files(
            ["src/**/*.tsx", "src/**/*.ts"], max_chars=25_000
        )
        mkb_ctx = self.mkb.build_context_snippet(
            "code quality security maintainability unused imports error handling equivalence", top_k=3
        )
        prompt = self._prompt_code_review(
            architecture_output=architecture_output,
            generated_ctx=generated_ctx,
            mkb_ctx=mkb_ctx,
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_assemble(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
    ) -> tuple[str, str]:
        """Runner: assemble — verify generated/ directory structure; run final tsc check."""
        stage = "assemble"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "assemble Next.js project structure verify imports barrel index", top_k=3
        )
        prompt = self._prompt_assemble(architecture_output, plan_routes_output, mkb_ctx)
        output, doc_id = await self._invoke_stage(stage, prompt)
        self._extract_and_write_files(stage, output)
        # Full build gate after all codegen completes
        if self.build_gate_enabled and should_run(stage):
            await self._build_gate_and_repair(stage, "gate.assemble.full")
        return output, doc_id

    @staticmethod
    def _safe_rglob(root: "Path", pattern: str) -> "list[Path]":
        """rglob replacement that skips node_modules/.git/.next to avoid Windows long-path crashes."""
        import os as _os, fnmatch as _fnmatch
        _SKIP = {"node_modules", ".git", ".next"}
        norm = pattern.replace("\\", "/").replace("**/", "").replace("/**", "")
        use_full = "/" in norm
        result: list = []
        for _dp, _dns, _fns in _os.walk(str(root), topdown=True):
            _dns[:] = [d for d in _dns if d not in _SKIP]
            for _fn in _fns:
                if use_full:
                    _rel = _os.path.relpath(_os.path.join(_dp, _fn), str(root)).replace("\\", "/")
                    if _fnmatch.fnmatch(_rel, norm):
                        result.append(Path(_dp) / _fn)
                else:
                    if _fnmatch.fnmatch(_fn, norm):
                        result.append(Path(_dp) / _fn)
        return result

    def _verify_assembly(self) -> dict:
        """Deterministic post-assemble verification pass.

        Runs ~11 Python checks against actual files in generated_dir without
        invoking the LLM.  Returns a dict with keys:
          ok (bool), issues (list[str]), warnings (list[str]), stats (dict).

        Parity: Android _verify_assembly() which does ~11 checks against
        actual Kotlin/Compose files after the assemble stage.

        Checks:
          1. File existence — every file listed in .files.json manifests exists
          2. TypeScript syntax — basic parse: no lone '<' outside JSX, unmatched braces
          3. Route coverage — every feature in LEGACY_FILE_MAPPING has a page.tsx
          4. API coverage — each LEGACY_API_METHODS key has a matching hook file
          5. Component count — each feature dir has at least 1 .tsx component
          6. Placeholder detection — no TODO/PlaceholderPage pattern in page files
          7. Middleware presence — middleware.ts exists at generated root
          8. Env vars — .env.local exists and has NEXT_PUBLIC_API_BASE_URL
          9. Import self-consistency — no relative imports escaping src/
          10. Barrel exports — each feature directory has an index.ts
          11. No empty files — all written .ts/.tsx files are non-empty
        """
        gen = self.generated_dir
        issues: list[str] = []
        warnings: list[str] = []
        stats: dict = {}

        # ── 1. File existence from .files.json manifests ──────────────────────
        manifest_paths = list(self.artifacts_dir.rglob("*.files.json"))
        missing_files: list[str] = []
        total_manifest_files = 0
        for mp in manifest_paths:
            try:
                entries = json.loads(mp.read_text(encoding="utf-8"))
                if not isinstance(entries, list):
                    continue
                for rel in entries:
                    total_manifest_files += 1
                    target = gen / rel
                    if not target.exists():
                        missing_files.append(rel)
            except (json.JSONDecodeError, OSError):
                continue
        stats["manifest_files_total"] = total_manifest_files
        stats["manifest_files_missing"] = len(missing_files)
        for mf in missing_files[:10]:
            issues.append(f"[1-missing] Manifest entry not on disk: {mf}")
        if len(missing_files) > 10:
            issues.append(f"[1-missing] ...and {len(missing_files) - 10} more missing")

        # ── 2. TypeScript syntax (heuristic) ──────────────────────────────────
        ts_files = self._safe_rglob(gen, "*.ts") + self._safe_rglob(gen, "*.tsx")
        ts_syntax_errors = 0
        for tsf in ts_files:
            try:
                text = tsf.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            opens = text.count("{")
            closes = text.count("}")
            if abs(opens - closes) > 5:
                warnings.append(
                    f"[2-syntax] Brace mismatch ({opens} open vs {closes} close): "
                    f"{tsf.relative_to(gen)}"
                )
                ts_syntax_errors += 1
        stats["ts_brace_mismatch_count"] = ts_syntax_errors

        # ── 3. Route coverage ─────────────────────────────────────────────────
        feature_missing_routes: list[str] = []
        for feature in self.LEGACY_FILE_MAPPING:
            # page.tsx can live under src/app/(feature)/, src/app/feature/, etc.
            route_files = self._safe_rglob(gen, f"*{feature}*/page.tsx") + self._safe_rglob(gen, f"*(({feature}))/page.tsx")
            if not route_files:
                feature_missing_routes.append(feature)
        stats["route_coverage_missing"] = len(feature_missing_routes)
        for fr in feature_missing_routes:
            issues.append(f"[3-routes] No page.tsx found for feature '{fr}'")

        # ── 4. API coverage — each feature has a matching hooks/ file ─────────
        api_missing: list[str] = []
        for feature, methods in self.LEGACY_API_METHODS.items():
            if not methods:
                continue
            hook_files = self._safe_rglob(gen, f"*{feature}*.ts") + self._safe_rglob(gen, f"*{feature}*.tsx")
            if not hook_files:
                api_missing.append(feature)
        stats["api_coverage_missing"] = len(api_missing)
        for feat in api_missing:
            issues.append(f"[4-api] No hook/service file found for feature '{feat}'")

        # ── 5. Component count per feature ────────────────────────────────────
        low_component_features: list[str] = []
        for feature in self.LEGACY_FILE_MAPPING:
            tsx_count = len(self._safe_rglob(gen, f"*{feature}*/*.tsx")) + len(self._safe_rglob(gen, f"*{feature}*/*.tsx"))
            if tsx_count == 0:
                low_component_features.append(feature)
        stats["features_with_no_components"] = len(low_component_features)
        for feat in low_component_features:
            warnings.append(f"[5-components] No .tsx components found for feature '{feat}'")

        # ── 6. Placeholder detection ──────────────────────────────────────────
        placeholder_patterns = ["PlaceholderPage", "TODO: implement", "NotImplemented"]
        placeholder_hits: list[str] = []
        for tsf in self._safe_rglob(gen, "*page.tsx"):
            try:
                text = tsf.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for pat in placeholder_patterns:
                if pat in text:
                    placeholder_hits.append(str(tsf.relative_to(gen)))
                    break
        stats["placeholder_pages"] = len(placeholder_hits)
        for ph in placeholder_hits:
            issues.append(f"[6-placeholder] Placeholder pattern in: {ph}")

        # ── 7. Middleware presence ────────────────────────────────────────────
        middleware_candidates = self._safe_rglob(gen, "middleware.ts")
        if not middleware_candidates:
            issues.append("[7-middleware] middleware.ts not found in generated/")
            stats["middleware_present"] = False
        else:
            stats["middleware_present"] = True

        # ── 8. Env vars ───────────────────────────────────────────────────────
        env_local = gen / ".env.local"
        if not env_local.exists():
            warnings.append("[8-env] .env.local not found in generated/")
            stats["env_local_present"] = False
        else:
            env_text = env_local.read_text(encoding="utf-8", errors="replace")
            if "NEXT_PUBLIC_API_BASE_URL" not in env_text:
                issues.append("[8-env] NEXT_PUBLIC_API_BASE_URL missing from .env.local")
            stats["env_local_present"] = True

        # ── 9. Import self-consistency — no ../../ escaping src/ ─────────────
        escape_imports: list[str] = []
        for tsf in ts_files:
            try:
                text = tsf.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for line in text.splitlines():
                if "from '../../../.." in line or "from '../../../../.." in line:
                    escape_imports.append(str(tsf.relative_to(gen)))
                    break
        stats["deep_relative_imports"] = len(escape_imports)
        for ei in escape_imports[:5]:
            warnings.append(f"[9-imports] Deep relative import (use alias) in: {ei}")

        # ── 10. Barrel exports ────────────────────────────────────────────────
        # Every feature-level directory under src/app should have an index.ts
        app_dir = gen / "src" / "app"
        barrel_missing: list[str] = []
        if app_dir.exists():
            for child in app_dir.iterdir():
                if child.is_dir() and not child.name.startswith("."):
                    if not (child / "index.ts").exists() and not (child / "index.tsx").exists():
                        barrel_missing.append(child.name)
        stats["barrel_missing_count"] = len(barrel_missing)
        for bm in barrel_missing:
            warnings.append(f"[10-barrel] No index.ts barrel in src/app/{bm}/")

        # ── 11. Empty files ───────────────────────────────────────────────────
        empty_files: list[str] = []
        for tsf in ts_files:
            try:
                if tsf.stat().st_size < 10:
                    empty_files.append(str(tsf.relative_to(gen)))
            except OSError:
                continue
        stats["empty_files"] = len(empty_files)
        for ef in empty_files[:5]:
            issues.append(f"[11-empty] Nearly-empty file: {ef}")

        ok = len(issues) == 0
        result = {
            "ok": ok,
            "issues": issues,
            "warnings": warnings,
            "stats": stats,
            "issue_count": len(issues),
            "warning_count": len(warnings),
        }

        # Write report to artifacts
        report_path = self.artifacts_dir / "phase3-codegen" / "assembly.verification.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

        # Write human-readable summary to MKB
        summary_lines = [
            "# Assembly Verification Report",
            "",
            f"Status: {'PASS' if ok else 'FAIL'}",
            f"Issues: {len(issues)}  Warnings: {len(warnings)}",
            "",
            "## Stats",
        ]
        for k, v in stats.items():
            summary_lines.append(f"- {k}: {v}")
        if issues:
            summary_lines += ["", "## Issues"]
            summary_lines += [f"- {i}" for i in issues]
        if warnings:
            summary_lines += ["", "## Warnings"]
            summary_lines += [f"- {w}" for w in warnings]
        summary_text = "\n".join(summary_lines)

        self.mkb.write_stage_artifact(
            artifact=StageArtifact(
                stage="assemble.verify",
                prompt="deterministic assembly verification",
                output=summary_text,
                created_at=datetime.now(UTC).isoformat(),
            ),
            related_doc_ids=[],
        )

        # Log to console
        status_str = "PASS" if ok else f"FAIL ({len(issues)} issues)"
        self._log(f"[verify_assembly] {status_str} | {len(warnings)} warnings | stats={stats}")
        if issues:
            for iss in issues:
                self._log(f"  [ISSUE] {iss}", level="warning")

        return result

    async def _run_equivalence_fix(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        assemble_output: str,
    ) -> tuple[str, str]:
        """Runner: equivalence.fix — per-group LLM repair pass over generated code.

        Iterates FIX_GROUPS.  For each group:
          1. Checks .files.json resume artefact — skips group if already done.
          2. Collects current generated files matching the group's glob patterns.
          3. Calls _invoke_codegen_stage with the equivalence-fix prompt.
          4. Optional build gate after all groups finish.

        Parity: Android _run_equivalence_fix().
        """
        stage = "equivalence.fix"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )

        mkb_ctx = self.mkb.build_context_snippet(
            "equivalence fix Angular Next.js navigation state API repair correction", top_k=5
        )

        group_summaries: list[str] = []
        for group_label, glob_patterns, description in self.FIX_GROUPS:
            group_stage = f"{stage}.{group_label}"
            manifest_path = self._ap(f"{group_stage}.files.json")
            if manifest_path.exists():
                group_summaries.append(f"- **{group_label}**: resumed from disk")
                continue

            existing_code = self._collect_existing_generated_files(glob_patterns)
            prompt = self._prompt_equivalence_fix_group(
                group_label=group_label,
                description=description,
                existing_code=existing_code,
                assemble_output=assemble_output,
                mkb_ctx=mkb_ctx,
            )
            _out, _doc_id, _written = await self._invoke_codegen_stage(
                stage=stage, sub_id=group_label, prompt=prompt
            )
            group_summaries.append(f"- **{group_label}**: generated ({len(_out)} chars)")

        if self.build_gate_enabled:
            await self._build_gate_and_repair(stage, "gate.equivalence.fix")

        summary = (
            f"# Equivalence Fix\n\n"
            f"Processed {len(self.FIX_GROUPS)} fix groups:\n"
            + "\n".join(group_summaries)
            + f"\n\n## Assemble Reference (truncated)\n{assemble_output[:1000]}"
        )
        artifact_path = self._ap(f"{stage}.md")
        artifact_path.write_text(summary, encoding="utf-8")
        artifact = StageArtifact(
            stage=stage,
            prompt="(equivalence fix group summary)",
            output=summary,
            created_at=datetime.now(UTC).isoformat(),
        )
        doc_id = self.mkb.write_stage_artifact(artifact=artifact, related_doc_ids=[])
        return summary, doc_id

    async def _run_equivalence_audit(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        assemble_output: str,
    ) -> tuple[str, str]:
        """Runner: equivalence.audit — compare Angular source vs generated Next.js for mismatches.

        Parity: Android equivalence.audit stage.
        Produces a structured Functional Equivalence Audit Report that equivalence.fix uses
        to know exactly what to repair.  Without this audit, equivalence.fix runs blind.
        """
        stage = "equivalence.audit"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        legacy_ctx = self._collect_angular_source(max_chars=20_000)
        generated_ctx = self._collect_existing_generated_files(
            ["src/**/*.tsx", "src/**/*.ts"],
            max_chars=20_000,
        )
        mkb_ctx = self.mkb.build_context_snippet(
            "equivalence mismatch invented logic missing feature navigation behavior drift", top_k=5
        )
        prompt = self._prompt_equivalence_audit(
            legacy_ctx=legacy_ctx,
            generated_ctx=generated_ctx,
            assemble_output=assemble_output,
            mkb_ctx=mkb_ctx,
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_ui_layout_match(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        assemble_output: str,
    ) -> tuple[str, str]:
        """Runner: ui.layout.match — per-group layout parity pass.

        Collects Angular HTML templates and existing generated TSX components for
        each group, then asks the LLM to align the Next.js layout to match the
        Angular original.  Optional build gate after all groups.

        Parity: Android _run_ui_layout_match().
        """
        stage = "ui.layout.match"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )

        mkb_ctx = self.mkb.build_context_snippet(
            "UI layout visual match Angular template Next.js component parity", top_k=5
        )

        group_summaries: list[str] = []
        for group_label, angular_patterns, nextjs_patterns, description in self.UI_LAYOUT_MATCH_GROUPS:
            group_stage = f"{stage}.{group_label}"
            manifest_path = self._ap(f"{group_stage}.files.json")
            if manifest_path.exists():
                group_summaries.append(f"- **{group_label}**: resumed from disk")
                continue

            angular_templates = self._collect_angular_templates(angular_patterns)
            existing_nextjs = self._collect_existing_generated_files(nextjs_patterns)
            prompt = self._prompt_ui_layout_match_group(
                group_label=group_label,
                description=description,
                angular_templates=angular_templates,
                existing_nextjs=existing_nextjs,
                mkb_ctx=mkb_ctx,
            )
            _out, _doc_id, _written = await self._invoke_codegen_stage(
                stage=stage, sub_id=group_label, prompt=prompt
            )
            group_summaries.append(f"- **{group_label}**: generated ({len(_out)} chars)")

        if self.build_gate_enabled:
            await self._build_gate_and_repair(stage, "gate.ui.layout.match")

        summary = (
            f"# UI Layout Match\n\n"
            f"Processed {len(self.UI_LAYOUT_MATCH_GROUPS)} layout groups:\n"
            + "\n".join(group_summaries)
            + f"\n\n## Assemble Reference (truncated)\n{assemble_output[:1000]}"
        )
        artifact_path = self._ap(f"{stage}.md")
        artifact_path.write_text(summary, encoding="utf-8")
        artifact = StageArtifact(
            stage=stage,
            prompt="(ui layout match group summary)",
            output=summary,
            created_at=datetime.now(UTC).isoformat(),
        )
        doc_id = self.mkb.write_stage_artifact(artifact=artifact, related_doc_ids=[])
        return summary, doc_id

    async def _resolve_placeholder_screens(self) -> None:
        """Scan generated Next.js app for placeholder page patterns and generate missing components.

        After all codegen feature stages complete, the generated routing files may
        contain TODO stubs like:
          // TODO: placeholder - <ComponentName>
          export default function PlaceholderPage() { ... }

        This method:
          1. Scans all .tsx and .ts files under generated_dir for these patterns.
          2. For each unique placeholder label found, maps it to the owning feature
             module via PLACEHOLDER_PAGE_TO_ROUTE.
          3. Generates the missing page component via _invoke_codegen_stage.
          4. Overwrites the placeholder with the real component in generated_dir.

        Called from _run_pipeline after codegen.tests, before assemble.
        Parity: Android _resolve_placeholder_screens().
        """
        # Map placeholder labels to route group / feature module
        PLACEHOLDER_PAGE_TO_ROUTE: dict[str, str] = {
            "home":           "codegen.features.home",
            "search":         "codegen.features.search",
            "provider":       "codegen.features.provider",
            "rate_alert":     "codegen.features.rate_alert",
            "profile":        "codegen.features.profile",
            "notification":   "codegen.features.notification",
            "settings":       "codegen.features.settings",
            "content":        "codegen.features.content",
            "quiz":           "codegen.features.quiz",
            "auth":           "codegen.features.auth",
            "login":          "codegen.features.auth",
            "register":       "codegen.features.auth",
        }

        import re
        placeholder_re = re.compile(
            r"//\s*TODO:\s*placeholder\s*[-–]\s*(\w+)"
            r"|PlaceholderPage\(['\"](\w+)['\"]\)"
            r"|export\s+default\s+function\s+PlaceholderPage",
            re.IGNORECASE,
        )

        found: dict[str, list[Path]] = {}  # label -> list of files containing it

        if not self.generated_dir.exists():
            return

        import os as _os
        for dirpath, dirnames, filenames in _os.walk(self.generated_dir):
            dirnames[:] = [d for d in dirnames if d != "node_modules"]
            for filename in filenames:
                if not filename.endswith(".tsx"):
                    continue
                tsx_path = Path(dirpath) / filename
                try:
                    content = tsx_path.read_text(encoding="utf-8", errors="replace")
                except OSError:
                    continue
                for m in placeholder_re.finditer(content):
                    label = (m.group(1) or m.group(2) or tsx_path.stem).lower()
                    found.setdefault(label, []).append(tsx_path)

        if not found:
            return

        print(
            f"  [placeholder] Found {len(found)} placeholder label(s): "
            + ", ".join(sorted(found.keys()))
        )

        for label, files in found.items():
            feature_stage = PLACEHOLDER_PAGE_TO_ROUTE.get(label)
            if not feature_stage:
                print(f"  [placeholder] No route mapping for '{label}' — skipping")
                continue

            group_stage = f"placeholder.{label}"
            mkb_ctx = self.mkb.build_context_snippet(
                f"{label} page component Next.js App Router TypeScript", top_k=3
            )
            feature_source = self._collect_feature_source(label)
            existing_stub = ""
            if files:
                try:
                    existing_stub = files[0].read_text(encoding="utf-8", errors="replace")
                except OSError:
                    pass

            prompt = f"""# Task: Replace Placeholder Page — {label}

## Role
You are implementing the missing Next.js 15 App Router page component for the
**{label}** feature, migrated from Angular 17.

## Existing Placeholder Stub
```tsx
{existing_stub[:3000]}
```

## Angular Source Reference
{feature_source[:6000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Requirements
1. Replace the placeholder with a fully-implemented Next.js 15 page component.
2. Use TypeScript strict mode, Tailwind CSS, TanStack Query for data fetching.
3. Match the Angular feature's layout and behaviour as closely as possible.
4. Export a default React function component named after the feature
   (e.g. `export default function {label.capitalize()}Page`).
5. Write ### FILE: blocks for every file that must be created or replaced.

## Output
Return only ### FILE: blocks. No prose outside file blocks.
"""
            print(f"  [placeholder] Generating real component for '{label}' (stage {group_stage})")
            await self._invoke_codegen_stage(stage="placeholder", sub_id=label, prompt=prompt)

            # Invalidate route cache so assemble re-reads generated_dir
            for cache_candidate in [
                self._ap("plan.routes.md"),
                self.generated_dir / "src" / "app" / "routing-manifest.json",
            ]:
                if cache_candidate.exists():
                    try:
                        cache_candidate.unlink()
                    except OSError:
                        pass

    # ── Phase 4 — Validation ──────────────────────────────────────────────────

    async def _run_ui_spec(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        analysis_output: str,
        architecture_output: str,
    ) -> tuple[str, str]:
        """Runner: ui.spec — write UI specification mapping Angular templates to Next.js pages."""
        stage = "ui.spec"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        component_ctx = self._collect_component_source(max_chars=30_000)
        mkb_ctx = self.mkb.build_context_snippet(
            "UI spec Angular template HTML CSS mapping Next.js page pixel-accurate", top_k=3
        )
        prompt = self._prompt_ui_spec(
            component_ctx, analysis_output, architecture_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_dualrun_plan(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        analysis_output: str,
        architecture_output: str,
        ui_spec_output: str,
    ) -> tuple[str, str]:
        """Runner: dualrun.plan — plan dual-run equivalence test strategy."""
        stage = "dualrun.plan"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "dual-run same input output comparison cutover equivalence Angular Next.js", top_k=3
        )
        prompt = self._prompt_dualrun_plan(
            analysis_output, architecture_output, ui_spec_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_validation_structure(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        architecture_output: str,
        plan_routes_output: str,
        assemble_output: str,
    ) -> tuple[str, str]:
        """Runner: validation.structure — validate generated/ directory structure vs plan."""
        stage = "validation.structure"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "Next.js directory structure App Router convention validation gap", top_k=3
        )
        prompt = self._prompt_validation_structure(
            architecture_output, plan_routes_output, assemble_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_validation_types(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        codegen_types_output: str,
        assemble_output: str,
    ) -> tuple[str, str]:
        """Runner: validation.types — validate TypeScript types and interface coverage."""
        stage = "validation.types"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "TypeScript type coverage interface DTO gap missing any unknown", top_k=3
        )
        prompt = self._prompt_validation_types(codegen_types_output, assemble_output, mkb_ctx)
        return await self._invoke_stage(stage, prompt)

    async def _run_validation_routes(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        plan_routes_output: str,
        assemble_output: str,
    ) -> tuple[str, str]:
        """Runner: validation.routes — validate all planned routes are implemented."""
        stage = "validation.routes"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        routing_ctx = self._collect_routing_source()
        mkb_ctx = self.mkb.build_context_snippet(
            "route missing unimplemented redirect guard navigation Next.js page", top_k=3
        )
        prompt = self._prompt_validation_routes(
            routing_ctx, plan_routes_output, assemble_output, mkb_ctx
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_validation_5layer(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        analysis_output: str,
        architecture_output: str,
        assemble_output: str,
        validation_structure_output: str,
        validation_types_output: str,
        validation_routes_output: str,
    ) -> tuple[str, str]:
        """Runner: validation.5layer — 5-layer validation (unit/integration/business/NFR/UAT)."""
        stage = "validation.5layer"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        legacy_ctx = self._collect_angular_source(max_chars=30_000)
        mkb_ctx = self.mkb.build_context_snippet(
            "unit integration business non-functional UAT acceptance test coverage", top_k=3
        )
        prompt = self._prompt_validation_5layer(
            legacy_ctx=legacy_ctx,
            analysis_output=analysis_output,
            architecture_output=architecture_output,
            assemble_output=assemble_output,
            validation_structure_output=validation_structure_output,
            validation_types_output=validation_types_output,
            validation_routes_output=validation_routes_output,
            mkb_ctx=mkb_ctx,
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_documentation(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        analysis_output: str,
        architecture_output: str,
        assemble_output: str,
        validation_5layer_output: str,
    ) -> tuple[str, str]:
        """Runner: documentation — generate migration documentation and runbook.

        Parity: Android documentation stage.
        """
        stage = "documentation"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "runbook operational docs traceability matrix migration guide", top_k=3
        )
        prompt = self._prompt_documentation(
            analysis_output=analysis_output,
            architecture_output=architecture_output,
            assemble_output=assemble_output,
            validation_5layer_output=validation_5layer_output,
            mkb_ctx=mkb_ctx,
        )
        return await self._invoke_stage(stage, prompt)

    # ── Phase 5 — Rollout ─────────────────────────────────────────────────────

    async def _run_feedback_loop(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        analysis_output: str,
        architecture_output: str,
        assemble_output: str,
        validation_5layer_output: str,
        dualrun_plan_output: str,
    ) -> tuple[str, str]:
        """Runner: feedback.loop — self-improvement loop; surface gap insights into MKB.

        Parity: Android _run_feedback_loops() — reads all prior stage outputs,
        identifies systematic gaps, writes upgraded guidance documents to MKB
        for future runs.  CRITICAL: never auto-approves HITL gates (see
        feedback_no_extra_cost.md memory note).
        """
        stage = "feedback.loop"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        legacy_ctx = self._collect_angular_source(max_chars=30_000)
        mkb_ctx = self.mkb.build_context_snippet(
            "feedback loop gap analysis improvement MKB knowledge base upgrade", top_k=5
        )
        # Pre-extract structured feedback items from each prior stage output
        # so the LLM receives a concise resolution queue, not raw text.
        extracted_feedback: dict[str, list[str]] = {
            "analysis": self._extract_feedback_requests(analysis_output),
            "architecture": self._extract_feedback_requests(architecture_output),
            "assemble": self._extract_feedback_requests(assemble_output),
            "validation_5layer": self._extract_feedback_requests(validation_5layer_output),
            "dualrun_plan": self._extract_feedback_requests(dualrun_plan_output),
        }
        feedback_summary = "\n".join(
            f"### {key}\n" + ("\n".join(f"- {item}" for item in items) if items else "- (none)")
            for key, items in extracted_feedback.items()
        )
        prompt = self._prompt_feedback_loop(
            legacy_ctx=legacy_ctx,
            analysis_output=analysis_output,
            architecture_output=architecture_output,
            assemble_output=assemble_output,
            validation_5layer_output=validation_5layer_output,
            dualrun_plan_output=dualrun_plan_output,
            mkb_ctx=mkb_ctx + f"\n\n## Pre-Extracted Feedback Items\n{feedback_summary}",
        )
        return await self._invoke_stage(stage, prompt)

    async def _run_report(
        self,
        before_from: "Callable[[str], bool]",
        should_run: "Callable[[str], bool]",
        outputs: dict[str, str],
    ) -> tuple[str, str]:
        """Runner: report — final orchestrator run report summarising all stage outcomes.

        Parity: Android orchestrator.report stage.
        """
        stage = "report"
        if before_from(stage):
            return self._resume_stage(stage)
        if not should_run(stage):
            raise RuntimeError(
                f"Stage '{stage}' is neither before_from nor should_run — logic error."
            )
        mkb_ctx = self.mkb.build_context_snippet(
            "workflow state escalation progress HITL approvals stage summary", top_k=3
        )
        prompt = self._prompt_report(outputs, mkb_ctx)
        return await self._invoke_stage(stage, prompt)

    # ─────────────────────────────────────────────────────────────────────────
    # Section 12 — Pipeline
    # ─────────────────────────────────────────────────────────────────────────

    async def _run_pipeline(self, legacy_context: str) -> dict:
        """Execute the full 33-stage migration pipeline."""
        outputs: dict[str, str] = {}
        up_to_stage = getattr(self, "up_to_stage", None)
        from_stage = getattr(self, "from_stage", None)
        stage_idx = {name: i for i, name in enumerate(self.STAGE_SEQUENCE)}

        if from_stage and from_stage not in stage_idx:
            raise ValueError(f"Invalid from_stage: '{from_stage}'")
        if up_to_stage and up_to_stage not in stage_idx:
            raise ValueError(f"Invalid up_to_stage: '{up_to_stage}'")
        if from_stage and up_to_stage and stage_idx[from_stage] > stage_idx[up_to_stage]:
            raise ValueError("--from-stage must be before or equal to --up-to-stage.")

        from_idx = 0 if from_stage is None else stage_idx[from_stage]
        up_to_idx = (
            len(self.STAGE_SEQUENCE) - 1 if up_to_stage is None else stage_idx[up_to_stage]
        )

        def before_from(stage: str) -> bool:
            return stage_idx[stage] < from_idx

        def should_run(stage: str) -> bool:
            idx = stage_idx[stage]
            return from_idx <= idx <= up_to_idx

        def stop_after(stage: str) -> bool:
            return self.up_to_stage is not None and stage == self.up_to_stage

        # Write legacy context into MKB — capture doc_id for provenance chain
        context_doc_id = self.mkb.write_document(
            doc_type="legacy_context",
            stage="input",
            content=legacy_context,
            metadata={"source": "input_context"},
        )

        # ── Phase 1 — Discovery ───────────────────────────────────────────────

        stage = "extract.inventory"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_extract_inventory(before_from, should_run, context_doc_id)
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["extract_inventory"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "extract.analysis"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_extract_analysis(
                before_from, should_run,
                inventory_output=outputs["extract_inventory"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["extract_analysis"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "extract.decomposition"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_extract_decomposition(
                before_from, should_run,
                inventory_output=outputs["extract_inventory"],
                analysis_output=outputs["extract_analysis"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["extract_decomposition"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # ── Phase 2 — Planning ────────────────────────────────────────────────

        stage = "plan.architecture"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_plan_architecture(
                before_from, should_run,
                inventory_output=outputs["extract_inventory"],
                analysis_output=outputs["extract_analysis"],
                decomposition_output=outputs["extract_decomposition"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["plan_architecture"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "plan.routes"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_plan_routes(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                decomposition_output=outputs["extract_decomposition"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["plan_routes"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "plan.state"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_plan_state(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                analysis_output=outputs["extract_analysis"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["plan_state"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "integration_migration"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_integration_migration(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                analysis_output=outputs["extract_analysis"],
                decomposition_output=outputs["extract_decomposition"],
            )
        else:
            raise RuntimeError(f"Stage '{stage}' is required but was neither resumed nor executed.")
        outputs["integration_migration"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # ── Phase 3 — Scaffold (deterministic) ───────────────────────────────

        stage = "scaffold"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_scaffold(before_from, should_run)
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["scaffold"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # ── Phase 3 — Codegen (LLM) ──────────────────────────────────────────

        stage = "codegen.layout"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_layout(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                scaffold_output=outputs["scaffold"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_layout"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.providers"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_providers(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_state_output=outputs["plan_state"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_providers"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.utils"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_utils(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                analysis_output=outputs["extract_analysis"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_utils"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.types"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_types(
                before_from, should_run,
                analysis_output=outputs["extract_analysis"],
                decomposition_output=outputs["extract_decomposition"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_types"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.services"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_services(
                before_from, should_run,
                analysis_output=outputs["extract_analysis"],
                codegen_types_output=outputs["codegen_types"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_services"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.mocks"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_mocks(
                before_from, should_run,
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_mocks"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.navigation"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_navigation(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                codegen_layout_output=outputs["codegen_layout"],
                integration_migration_output=outputs.get("integration_migration", ""),
            )
        else:
            raise RuntimeError(f"Stage '{stage}' is required but was neither resumed nor executed.")
        outputs["codegen_navigation"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # ── Phase 3 — Feature Codegen ─────────────────────────────────────────

        stage = "codegen.features.auth"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_auth(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_auth"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.home"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_home(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_home"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.search"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_search(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_search"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.provider"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_provider(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_provider"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.rate_alert"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_rate_alert(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_rate_alert"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.profile"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_profile(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_profile"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.notification"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_notification(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_notification"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.settings"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_settings(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_settings"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.content"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_content(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_content"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.quiz"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_quiz(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_quiz"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.features.misc"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_features_misc(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                plan_state_output=outputs["plan_state"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_layout_output=outputs["codegen_layout"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_features_misc"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "codegen.tests"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_codegen_tests(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                codegen_types_output=outputs["codegen_types"],
                codegen_services_output=outputs["codegen_services"],
                codegen_mocks_output=outputs["codegen_mocks"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["codegen_tests"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "code_review"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_code_review(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
            )
        else:
            raise RuntimeError(f"Stage '{stage}' is required but was neither resumed nor executed.")
        outputs["code_review"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # Resolve any placeholder pages injected during codegen feature stages
        await self._resolve_placeholder_screens()

        stage = "assemble"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_assemble(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["assemble"] = output
        # Deterministic verification pass — no LLM call, pure Python file checks
        verify_result = self._verify_assembly()
        outputs["assembly_verification"] = verify_result
        if not verify_result["ok"]:
            self._log(
                f"[pipeline] Assembly verification FAIL — "
                f"{verify_result['issue_count']} issues; "
                "check phase3-codegen/assembly.verification.json",
                level="warning",
            )
        # Write build-gate summary now that assemble + verify are done
        if self.build_gate_enabled:
            self._write_build_gate_summary()
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "copy.static"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_copy_static(before_from, should_run)
        else:
            raise RuntimeError(f"Stage '{stage}' is required but was neither resumed nor executed.")
        outputs["copy_static"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "equivalence.audit"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_equivalence_audit(
                before_from, should_run,
                assemble_output=outputs["assemble"],
            )
        else:
            raise RuntimeError(f"Stage '{stage}' is required but was neither resumed nor executed.")
        outputs["equivalence_audit"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "equivalence.fix"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_equivalence_fix(
                before_from, should_run,
                assemble_output=outputs["assemble"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["equivalence_fix"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "ui.layout.match"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_ui_layout_match(
                before_from, should_run,
                assemble_output=outputs["assemble"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["ui_layout_match"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # ── Phase 4 — Validation ──────────────────────────────────────────────

        stage = "ui.spec"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_ui_spec(
                before_from, should_run,
                analysis_output=outputs["extract_analysis"],
                architecture_output=outputs["plan_architecture"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["ui_spec"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "dualrun.plan"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_dualrun_plan(
                before_from, should_run,
                analysis_output=outputs["extract_analysis"],
                architecture_output=outputs["plan_architecture"],
                ui_spec_output=outputs["ui_spec"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["dualrun_plan"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "validation.structure"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_validation_structure(
                before_from, should_run,
                architecture_output=outputs["plan_architecture"],
                plan_routes_output=outputs["plan_routes"],
                assemble_output=outputs["assemble"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["validation_structure"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "validation.types"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_validation_types(
                before_from, should_run,
                codegen_types_output=outputs["codegen_types"],
                assemble_output=outputs["assemble"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["validation_types"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "validation.routes"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_validation_routes(
                before_from, should_run,
                plan_routes_output=outputs["plan_routes"],
                assemble_output=outputs["assemble"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["validation_routes"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "validation.5layer"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_validation_5layer(
                before_from, should_run,
                analysis_output=outputs["extract_analysis"],
                architecture_output=outputs["plan_architecture"],
                assemble_output=outputs["assemble"],
                validation_structure_output=outputs["validation_structure"],
                validation_types_output=outputs["validation_types"],
                validation_routes_output=outputs["validation_routes"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["validation_5layer"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # ── Phase 5 — Rollout ─────────────────────────────────────────────────

        stage = "documentation"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_documentation(
                before_from, should_run,
                analysis_output=outputs.get("extract_analysis", ""),
                architecture_output=outputs.get("plan_architecture", ""),
                assemble_output=outputs.get("assemble", ""),
                validation_5layer_output=outputs.get("validation_5layer", ""),
            )
        else:
            raise RuntimeError(f"Stage '{stage}' is required but was neither resumed nor executed.")
        outputs["documentation"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "feedback.loop"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_feedback_loop(
                before_from, should_run,
                analysis_output=outputs["extract_analysis"],
                architecture_output=outputs["plan_architecture"],
                assemble_output=outputs["assemble"],
                validation_5layer_output=outputs["validation_5layer"],
                dualrun_plan_output=outputs["dualrun_plan"],
            )
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["feedback_loop"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        stage = "report"
        if before_from(stage):
            output, doc_id = self._resume_stage(stage)
        elif should_run(stage):
            output, doc_id = await self._run_report(before_from, should_run, outputs)
        else:
            raise RuntimeError(
                f"Stage '{stage}' is required but was neither resumed nor executed."
            )
        outputs["report"] = output
        if stop_after(stage):
            summary_path = self._ap("summary.json")
            summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
            return outputs

        # ── All stages complete — write final summary ─────────────────────────

        summary_path = self._ap("summary.json")
        summary_path.write_text(json.dumps(outputs, indent=2), encoding="utf-8")
        return outputs

    async def run(self, legacy_context: str = "") -> dict:
        """Public entry point for the migration pipeline."""
        try:
            return await self._run_pipeline(legacy_context)
        finally:
            self._flush_issue_log()


    # ─────────────────────────────────────────────────────────────────────────
    # Section 13 — Prompt Methods
    # ─────────────────────────────────────────────────────────────────────────

    # ── Phase 1 — Discovery ───────────────────────────────────────────────────

    def _prompt_extract_inventory(self, legacy_ctx: str, mkb_ctx: str) -> str:
        return f"""# Task: Inventory the Angular 17 Send2 Codebase

## Role
You are a senior migration engineer performing a full inventory of an Angular 17
application called Send2 (a remittance comparison and provider-discovery web app)
prior to migrating it to Next.js 15 with the App Router, React 19, TypeScript 5,
Zustand 5, TanStack Query 5, Tailwind CSS 4, and Vitest.

## Angular Source Files
{legacy_ctx[:12000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce
Produce a structured Markdown inventory with the following sections:

### 1. NgModules
List every `@NgModule` found: name, file path, declared components, imported
modules, exported symbols, providers registered.

### 2. Components
For every `@Component`:
- File path
- Selector
- Template file or inline template? (note any complex templates)
- Inputs / Outputs
- Injected services (via constructor or `inject()`)
- Change-detection strategy (Default or OnPush)
- Router usage (routerLink, Router, ActivatedRoute)

### 3. Services & Injectables
For every `@Injectable`:
- File path
- `providedIn` scope (`root`, module name, or none)
- HttpClient calls (method, URL, return type)
- Observables / RxJS operators used
- State held internally (fields, BehaviorSubject, etc.)

### 4. NgRx / State
- Store slices and their actions, reducers, selectors, effects
- Any plain BehaviorSubject / Subject used as ad-hoc state

### 5. Routing
- All `Routes` arrays found (file, path, component, canActivate guards, lazy-loaded modules)
- Auth guards, resolver services

### 6. HTTP Interceptors
- List each interceptor, what it injects into requests or responses

### 7. Environment Files
- `environment.ts` / `environment.prod.ts` keys and values (redact secrets)

### 8. Assets & Static Resources
- Images, fonts, i18n JSON files, SVG icons referenced

### 9. Third-Party Dependencies
- All `@angular/*` packages and their versions
- All non-Angular npm packages with versions

### 10. Test Files
- Test framework used (Karma/Jasmine/Jest?)
- Number of `.spec.ts` files, rough coverage areas

### 11. Build & CI Configuration
- `angular.json` build targets, output paths, environments, budgets
- Any CI config files (`.github/workflows`, `Jenkinsfile`, etc.)

## Output Format
Return a single Markdown document with the sections above. Be exhaustive — err
on the side of listing more rather than less. Do NOT omit files just because
they look trivial; every component and service is migration work.
"""

    def _prompt_extract_analysis(
        self,
        legacy_ctx: str,
        inventory_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Deep Analysis of Angular 17 Send2 Codebase

## Role
You are a migration architect analysing the Send2 Angular 17 application to
identify migration complexity, anti-patterns, and risk areas before planning
the Next.js 15 target architecture.

## Inventory (prior stage)
{inventory_output[:6000]}

## Angular Source Context
{legacy_ctx[:8000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce
Produce a structured analysis covering:

### 1. Architecture Pattern Assessment
- Is the app following smart/dumb component pattern? Where is it violated?
- How is data flowing: service-to-component push vs component pull?
- Is there a clear domain/feature module boundary or is it monolithic?

### 2. State Management Complexity
- Enumerate every piece of global state: NgRx slices, BehaviorSubjects, local
  component state that leaks across siblings via services.
- Classify each: trivial (single boolean), medium (paginated list with filters),
  complex (multi-step wizard state, optimistic updates, polling).
- Map Angular state to proposed Zustand store slices (one paragraph per slice).

### 3. HTTP / API Layer
- List every unique API endpoint called, with HTTP method and Angular service.
- Identify which calls are cacheable (GET + stable data) vs always-fresh
  (user-specific, mutation results, real-time rates).
- Flag any polling patterns (interval, timer-based refresh).
- Identify error-handling patterns (catchError, HTTP interceptors, global
  error boundaries).

### 4. RxJS Complexity
- List Observables that combine multiple sources (combineLatest, withLatestFrom,
  switchMap chaining) — these require TanStack Query equivalents.
- List Observables used purely for event streams that map to React event handlers.
- List Observables that can be replaced with simple async/await.

### 5. Angular-Specific Patterns to Replace
For each Angular concept, state the Next.js/React equivalent:
- `@Component` -> React Server Component or Client Component?
- `@Pipe` -> utility function in `lib/utils/`
- `ChangeDetectionStrategy.OnPush` -> React.memo / stable refs
- `ngOnDestroy` / subscription cleanup -> useEffect cleanup
- `@ViewChild` -> useRef
- `ContentChildren` / `ng-content` -> React children prop / slots
- Template-driven forms vs reactive forms -> react-hook-form
- `*ngFor`, `*ngIf`, `*ngSwitch` -> JSX map/conditional

### 6. Routing Complexity
- Nested routes, lazy-loaded modules, guards, resolvers — list each by risk.
- Auth guard pattern: where does it redirect? How does it integrate with session?
- Parameterised routes with complex data pre-loading.

### 7. Third-Party Library Migration
For each non-Angular library in use:
- Is there a direct React equivalent?
- Is the library framework-agnostic (can be imported unchanged)?
- Is it Angular-only and must be rewritten?

### 8. Performance Characteristics
- Bundle size budgets from angular.json
- SSR/prerendering already enabled?
- Image optimisation patterns (NgOptimizedImage, lazy img)

### 9. Migration Risk Register
| Item | Risk Level (Low/Med/High) | Reason | Mitigation |
|------|--------------------------|--------|------------|
(list at least 10 items)

### 10. Recommended Migration Order
Ordered list of feature modules from "migrate first" to "migrate last", with
rationale (low coupling first, highest-value/high-risk last with more prep).

## Output Format
Return a single Markdown document with numbered sections as above. Be specific
— name actual files, services, and components rather than speaking in generalities.
"""

    def _prompt_extract_decomposition(
        self,
        legacy_ctx: str,
        inventory_output: str,
        analysis_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Decompose Angular 17 Send2 into Migration Units

## Role
You are a migration planner breaking the Send2 Angular 17 application into
discrete, independently-migratable feature units that map 1-to-1 onto
Next.js 15 App Router route groups.

## Inventory (stage 1)
{inventory_output[:4000]}

## Analysis (stage 2)
{analysis_output[:4000]}

## Angular Source Context
{legacy_ctx[:4000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Decomposition Rules
1. Each migration unit must map to one App Router route group: `(auth)`,
   `(home)`, `(search)`, `(provider)`, `(profile)`, `(settings)`,
   `(content)`, `(rate-alert)`, `(notification)`, `(quiz)`, `(misc)`.
2. Shared infrastructure (layout, providers, utils, types, services/hooks)
   are classified as "core" units, NOT feature units.
3. Each unit must list its Angular inputs (components, services, routes,
   NgRx slices) and Next.js outputs (pages, components, hooks, store slices).
4. Cross-unit dependencies must be called out explicitly.

## What to Produce

### Core Units
For each core unit (layout, providers, types, utils, services/hooks, mocks):
- **Input:** Angular source files / constructs
- **Output:** Next.js target files
- **Dependencies:** None / other core units
- **Estimated effort:** S / M / L

### Feature Units
For each of the 11 feature areas, produce a decomposition card:

```
## Feature: <name>

### Angular Inputs
- Routes: [list]
- Components: [list with file paths]
- Services: [list]
- NgRx slices: [list]
- Guards / Resolvers: [list]

### Next.js Outputs
- Route group: `(<name>)/`
- Pages: [path -> component]
- Client components: [list]
- Server components: [list]
- TanStack Query hooks: [list]
- Zustand slice: [name + shape]

### Cross-Unit Dependencies
- Depends on: [list of other feature/core units]
- Depended on by: [list]

### Migration Complexity: Low / Medium / High
### Key Risks: [1-3 bullet points]
```

### Dependency Graph Summary
After the individual cards, produce a plain-text ASCII dependency graph showing
the migration order (core -> auth -> home -> search -> ... -> misc).

## Output Format
Return a single Markdown document structured exactly as specified above.
Do NOT skip any of the 11 feature units even if they appear trivial.
"""

    # ── Phase 2 — Planning ────────────────────────────────────────────────────

    def _prompt_plan_architecture(
        self,
        inventory_output: str,
        analysis_output: str,
        decomposition_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Design Next.js 15 Target Architecture for Send2

## Role
You are a principal frontend architect designing the complete target architecture
for migrating the Send2 Angular 17 application to Next.js 15 with the App Router,
React 19, TypeScript 5.4+, Zustand 5, TanStack Query 5, and Tailwind CSS 4.

## Inventory (stage 1)
{inventory_output[:3000]}

## Analysis (stage 2)
{analysis_output[:3000]}

## Decomposition (stage 3)
{decomposition_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Project Directory Structure
Produce the complete `src/` directory tree. Include every directory and
representative files. Use tree notation:

```
src/
  app/
    (auth)/
      login/
        page.tsx
        loading.tsx
      register/
        page.tsx
      layout.tsx
    (home)/
      page.tsx
      ...
    layout.tsx         <- root layout
    loading.tsx
    error.tsx
    not-found.tsx
    globals.css
  components/
    ui/
    navigation/
    forms/
    feedback/
  features/
    auth/
    home/
    search/
    provider/
    profile/
    settings/
    content/
    rate-alert/
    notification/
    quiz/
    misc/
  hooks/
  lib/
    utils/
    api/
  stores/
  types/
  __mocks__/
  __tests__/
```

### 2. Rendering Strategy Matrix
For each page/route group, specify:
| Route | Strategy | Reason |
|-------|----------|--------|
| `(auth)/login` | CSR (client only) | No SEO needed, form interaction |
| `(home)/` | ISR 60s | Public landing, SEO critical |
| ... (list all 11 groups) |

### 3. Data Fetching Architecture
- Server Components that use `fetch()` with `next: {{ revalidate }}` tags
- TanStack Query usage policy: only in Client Components, initial data from
  `dehydrateState` server-side via Hydrate boundary
- `src/lib/api/client.ts` — base fetch wrapper (auth headers, base URL, error
  normalisation)
- `src/lib/api/endpoints.ts` — typed endpoint definitions

### 4. State Management Architecture
Map each Angular NgRx/BehaviorSubject to a Zustand slice:
| Angular State | Zustand Store File | Slice Name | Shape (brief) |
|---|---|---|---|
(list at minimum: auth, search-filters, compare-basket, rate-alert, ui-preferences)

Describe the Zustand store design:
- `src/stores/authStore.ts`
- `src/stores/searchStore.ts`
- `src/stores/compareStore.ts`
- `src/stores/rateAlertStore.ts`
- `src/stores/uiStore.ts`
- `src/stores/index.ts` (barrel)

### 5. Authentication Architecture
- Session strategy: NextAuth.js v5 (Auth.js) OR custom JWT cookie?
- `middleware.ts` — route protection via `NextRequest` matchers
- `src/lib/auth/` helpers
- Token refresh flow

### 6. Styling Architecture
- Tailwind CSS 4 configuration (`tailwind.config.ts` key choices)
- Design token naming convention (colors, spacing, typography)
- CSS Modules vs Tailwind utility-first policy
- Dark mode strategy

### 7. Error Handling Architecture
- Root `error.tsx` and `global-error.tsx`
- TanStack Query `throwOnError` policy
- API error normalisation shape: `{{ code, message, details }}`
- Toast / notification system

### 8. TypeScript Configuration
- `tsconfig.json` paths aliases (`@/*`, `@components/*`, `@hooks/*`, etc.)
- Strict mode settings
- `src/types/` barrel organisation

### 9. Testing Architecture
- Vitest configuration
- Testing Library setup (`src/test-utils/`)
- MSW handlers location (`src/__mocks__/handlers/`)
- Coverage targets (80% lines minimum)

### 10. Build & Deployment Configuration
- `next.config.ts` key settings (env vars, image domains, redirects, headers)
- Environment variable schema (`src/lib/env.ts` with Zod validation)
- `pnpm` workspaces policy (single package or monorepo?)

### 11. Key Architecture Decisions Log
A table of significant decisions with rationale:
| Decision | Chosen Option | Rejected Alternative | Rationale |
|----------|--------------|---------------------|-----------|
(at least 10 decisions)

## Output Format
Return a single Markdown document with all 11 sections. Be concrete — include
example code snippets for the most important patterns (keep each snippet under
30 lines). Do NOT write complete file bodies here; that is for codegen stages.
"""

    def _prompt_plan_routes(
        self,
        routing_ctx: str,
        architecture_output: str,
        decomposition_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Map Angular 17 Routes to Next.js 15 App Router Route Groups

## Role
You are a routing specialist mapping every Angular route in Send2 to the
equivalent Next.js 15 App Router convention, including route groups, dynamic
segments, parallel routes, and intercepting routes where appropriate.

## Angular Routing Source
{routing_ctx[:8000]}

## Architecture Decisions (plan.architecture)
{architecture_output[:4000]}

## Decomposition (extract.decomposition)
{decomposition_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Complete Route Mapping Table
One row per Angular route:

| Angular Path | Angular Component | Guard? | Lazy? | Next.js File Path | Strategy | Notes |
|---|---|---|---|---|---|---|
| `/` | `HomeComponent` | No | No | `src/app/(home)/page.tsx` | ISR | Public landing |
| `/login` | `LoginComponent` | AuthGuard (redirect if authed) | Yes | `src/app/(auth)/login/page.tsx` | CSR | ... |
| ... | | | | | | |

Cover ALL routes found in the Angular source. Do not omit any.

### 2. Route Group Definitions
For each route group `(group-name)`:
- Files needed: `layout.tsx`, `loading.tsx`, `error.tsx`
- Shared state required in this group's layout
- Auth requirements (public / authenticated / role-based)

### 3. Dynamic Route Segments
List all Angular parameterised routes (`:id`, `:slug`, etc.) and their
Next.js equivalents (`[id]`, `[slug]`, `[[...slug]]`):

| Angular Param Route | Next.js File | Param Name | generateStaticParams? |
|---|---|---|---|

### 4. Redirect Map
Angular routes that must redirect to new URLs in Next.js. List all required
redirects in next.config.ts format:
source, destination, permanent (true/false).

### 5. Auth Middleware Configuration
Write the complete `middleware.ts` matcher configuration:
- Public routes (no auth required)
- Protected routes (must be signed in)
- Role-based routes (admin / provider / user)
- How to read the session token from the cookie

Produce a code sketch of `src/middleware.ts` (just the matcher config and
conditional redirect logic, approximately 30 lines).

### 6. Navigation Component Requirements
Based on the routes, specify:
- Top-level nav items (label, href, icon, auth requirement)
- Mobile bottom nav items (label, href, icon)
- Breadcrumb strategy for nested routes

### 7. Not-Found and Error Pages
- `src/app/not-found.tsx` requirements
- `src/app/error.tsx` requirements
- `src/app/global-error.tsx` requirements

## Output Format
Return a single Markdown document with all 7 sections. Be exhaustive in the
route mapping table — every Angular route must appear.
"""

    def _prompt_plan_state(
        self,
        architecture_output: str,
        analysis_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Design Zustand Store Architecture Replacing Angular NgRx / BehaviorSubjects

## Role
You are a state-management architect designing the Zustand 5 store layer that
replaces all NgRx store slices, effects, selectors, and ad-hoc BehaviorSubjects
found in the Angular 17 Send2 application.

## Architecture Decisions (plan.architecture)
{architecture_output[:5000]}

## Angular State Analysis (extract.analysis)
{analysis_output[:5000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Store Inventory
For every identified Angular state source (NgRx slice, BehaviorSubject, service
field), produce a mapping row:

| Angular Source | File | Shape | Zustand Store | Slice / Key | Migration Notes |
|---|---|---|---|---|---|

### 2. Store File Designs
For each Zustand store, write a detailed design spec (NOT the full implementation
— that is for codegen.providers):

#### `src/stores/authStore.ts`
- **State shape** (TypeScript interface):
  `{{ user: User | null, token: string | null, isLoading: boolean, error: string | null }}`
- **Actions**: `login(credentials)`, `logout()`, `refreshToken()`, `setUser(user)`
- **Selectors**: `selectIsAuthenticated`, `selectUser`, `selectAuthError`
- **Persistence**: `persist` middleware to `localStorage` for `token` only
- **Angular equivalent**: `AuthFacade` + `auth.reducer.ts`

#### `src/stores/searchStore.ts`
- **State shape**: filters object, results array, pagination, loading state
- **Actions**: setFilters, clearFilters, setResults, setPage, resetSearch
- **Selectors**: selectFilters, selectResults, selectIsSearching
- **Angular equivalent**: SearchFacade / search.reducer.ts

#### `src/stores/compareStore.ts`
- **State shape**: basket (array of provider IDs, max 3), comparison table visibility
- **Actions**: addToBasket, removeFromBasket, clearBasket, toggleComparison
- **Selectors**: selectBasket, selectBasketCount, selectIsInBasket(id)
- **Angular equivalent**: CompareService / compare BehaviorSubject

#### `src/stores/rateAlertStore.ts`
- **State shape**: alerts array, activeAlert, formState
- **Actions**: setAlerts, createAlert, deleteAlert, toggleAlert
- **Angular equivalent**: RateAlertService state

#### `src/stores/uiStore.ts`
- **State shape**: sidebarOpen, theme, activeModal, toasts[]
- **Actions**: openSidebar, closeSidebar, setTheme, pushToast, dismissToast
- **Angular equivalent**: LayoutService / UI BehaviorSubjects

#### `src/stores/notificationStore.ts`
- **State shape**: notifications[], unreadCount, lastFetched
- **Actions**: setNotifications, markRead, markAllRead, setUnreadCount, addNotification
- **Angular equivalent**: NotificationService

### 3. Zustand Middleware Strategy
- Which stores use `persist` middleware? What is persisted / excluded?
- Which stores use `immer` middleware for nested state updates?
- Devtools integration: `process.env.NODE_ENV === 'development'` guard

### 4. Selector Pattern
Standardise selector function pattern for all stores:
Preferred: `const user = useAuthStore((state) => state.user)` using stable
shallow-equality selectors. Avoid destructuring the full store object.

List all planned selector hooks for each store.

### 5. TanStack Query Integration
Describe the boundary between server state (TanStack Query) and client state
(Zustand):
- What data lives ONLY in TanStack Query cache (never duplicated in Zustand)?
- What data must be mirrored to Zustand after a successful mutation?
- Pattern for optimistic updates with rollback

### 6. Store Hydration (SSR)
- Which stores need to be hydrated from server-side props?
- Pattern for `initialState` prop drilling into Zustand `create` with `preloadedState`
- Avoiding hydration mismatch for `persist` stores

## Output Format
Return a single Markdown document. Be precise about TypeScript types — use
interface definitions rather than vague prose. The codegen.providers stage will
use this document to write the actual store files.
"""

    @staticmethod
    def _prompt_integration_migration(
        architecture_output: str,
        analysis_output: str,
        decomposition_output: str,
        legacy_ctx: str,
        mkb_ctx: str,
    ) -> str:
        return f"""
You are the Integration Migration Agent for the Send2 Angular→Next.js migration.

Produce an Integration Migration Plan covering:

## 1. HTTP INTERCEPTOR MIGRATION
- Angular interceptors found → Next.js middleware / axios interceptor equivalents
- Auth token injection pattern (httpOnly cookie → Authorization header proxy)
- Error handling (401 → redirect, 500 → toast)

## 2. ROUTE GUARD MIGRATION
- Angular guards found → Next.js middleware.ts matchers
- Auth guard → middleware redirect to /login
- Profile guard → middleware redirect to /profile/setup

## 3. THIRD-PARTY SDK MIGRATION
For each SDK detected (Firebase, Google Maps, Tawk.io, analytics):
- Angular integration pattern
- Next.js equivalent (client component, lazy load, env var for keys)

## 4. API CONTRACT SPECIFICATION
For each Angular service:
- HTTP method, endpoint path, request shape, response shape
- Which Next.js TanStack Query hook replaces it
- Any proxy needed (/api/... route)

## 5. COEXISTENCE STRATEGY
How Angular and Next.js can run in parallel during rollout (feature flags, route splitting).

ARCHITECTURE OUTPUT:
{architecture_output[:3000]}

ANALYSIS OUTPUT:
{analysis_output[:3000]}

DECOMPOSITION OUTPUT:
{decomposition_output[:2000]}

ANGULAR SOURCE:
{legacy_ctx}

{mkb_ctx}
""".strip()

    # ── Phase 3 — Codegen ─────────────────────────────────────────────────────

    def _prompt_codegen_layout(
        self,
        component_ctx: str,
        architecture_output: str,
        plan_routes_output: str,
        scaffold_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Generate Next.js 15 Root Layout and Navigation Shell

## Role
You are a senior React/Next.js engineer generating the root layout, shell
navigation, global CSS, and meta configuration for the Send2 Next.js 15 app.
The app uses: Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS 4,
`next/font` for Inter, and `next/navigation`.

## Architecture Decisions
{architecture_output[:4000]}

## Route Plan
{plan_routes_output[:3000]}

## Scaffold Summary
{scaffold_output[:1500]}

## Angular Component Context
{component_ctx[:4000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Files to Generate

### `src/app/layout.tsx`
Root layout that:
- Wraps children in `<Providers>` (imported from `@/components/providers/Providers`)
- Uses `next/font/google` Inter with subsets `['latin']`
- Sets `<html lang="en">` and `<body>` with Tailwind base classes
- Exports `metadata: Metadata` with title template, description, openGraph, icons
- Is a Server Component (no "use client")
- Includes `<Navbar>` and a responsive sidebar layout wrapper

### `src/app/globals.css`
- `@import "tailwindcss"` (Tailwind CSS 4 syntax)
- CSS custom properties for design tokens (colors, spacing from brand guide)
- Base body styles, scrollbar styling, focus-visible ring
- Print media query resets

### `src/app/loading.tsx`
- Full-page skeleton loading component using Tailwind `animate-pulse`
- Matches the rough shape of the home page (header bar, sidebar, main content area)

### `src/app/error.tsx`
- `"use client"` directive
- Accepts `{{ error: Error & {{ digest?: string }}, reset: () => void }}` props
- Renders a user-friendly error page with a "Try again" button
- Logs `error.digest` in development

### `src/app/not-found.tsx`
- Server Component
- 404 page with navigation back to home and search

### `src/components/navigation/Navbar.tsx`
- `"use client"` directive
- Responsive top navigation bar
- Logo (SVG inline or `next/image`)
- Desktop nav links: Home, Search, Deals, Blog
- User menu (avatar dropdown if authenticated, Sign In button if not)
- Uses `usePathname()` for active link highlighting
- Mobile hamburger that toggles the mobile sidebar
- Reads auth state from `useAuthStore`

### `src/components/navigation/Sidebar.tsx`
- `"use client"` directive
- Collapsible left sidebar for desktop
- Mobile: full-screen overlay panel
- Items: Home, Search, Compare, Rate Alerts, Notifications, Profile, Settings
- Active state via `usePathname()`
- Unread notification badge from `useNotificationStore`

### `src/components/navigation/BottomNav.tsx`
- `"use client"` directive
- Mobile-only bottom navigation bar (hidden on `md:` breakpoint and above)
- 4 items: Home, Search, Alerts, Profile
- Active icon fill vs outline based on current route

### `src/components/navigation/Breadcrumb.tsx`
- Server Component
- Accepts `items: {{ label: string; href?: string }}[]` prop
- Renders breadcrumb with JSON-LD `BreadcrumbList` structured data

### `src/components/navigation/index.ts`
Barrel export of all navigation components.

### `src/components/ui/index.ts`
Empty barrel stub (populated by later codegen stages).

## Code Requirements
- All components: strict TypeScript, no `any`
- Tailwind CSS 4 only (no custom CSS modules except globals.css)
- React 19 compatible (no deprecated lifecycle imports)
- `next/link` for all internal links
- `next/image` for all images with explicit `width`, `height`, and `alt`
- Zustand selectors use shallow equality: `useStore((s) => s.field)`
- No hardcoded colours — use Tailwind design tokens

## Output Format
For each file, output:

### FILE: src/app/layout.tsx
```typescript
<complete file content>
```

Use `### FILE: path/to/file.tsx` as the header, followed immediately by a
```typescript ... ``` code fence. Output ALL files listed above.
Do not output placeholder comments like `// TODO: implement` — write real code.
"""

    def _prompt_codegen_providers(
        self,
        architecture_output: str,
        plan_state_output: str,
        codegen_layout_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Generate React Providers, Zustand Stores, and QueryClient Setup

## Role
You are a senior React/Next.js engineer generating the complete provider tree,
all Zustand 5 store files, and TanStack Query 5 client configuration for the
Send2 Next.js 15 application.

## Architecture Decisions
{architecture_output[:4000]}

## State Plan (plan.state)
{plan_state_output[:5000]}

## Layout Output (codegen.layout)
{codegen_layout_output[:2000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Files to Generate

### `src/components/providers/Providers.tsx`
- `"use client"` directive
- Wraps children with:
  1. `QueryClientProvider` (TanStack Query 5) with configured `QueryClient`
  2. `ReactQueryDevtools` (development only)
  3. Toast notification provider
- Exports `Providers` as default

### `src/lib/queryClient.ts`
- Creates and exports a singleton `QueryClient` with:
  - `defaultOptions.queries`: `staleTime: 60_000`, `gcTime: 300_000`,
    `retry: 2`, `refetchOnWindowFocus: false`
  - `defaultOptions.mutations`: `onError` global error handler that pushes
    a toast notification

### `src/stores/authStore.ts`
Full Zustand 5 store for authentication:
- State: `user: User | null`, `token: string | null`, `isLoading: boolean`,
  `error: string | null`
- Actions: `login`, `logout`, `setUser`, `setToken`, `clearError`, `setLoading`
- `persist` middleware: persist `token` and `user` to `localStorage` under
  key `send2-auth`
- `devtools` middleware in development
- Export typed selectors: `selectUser`, `selectIsAuthenticated`, `selectAuthError`

### `src/stores/searchStore.ts`
Full Zustand 5 store for search state:
- State: `filters: SearchFilters`, `results: ProviderResult[]`,
  `pagination: Pagination`, `isSearching: boolean`, `lastQuery: string | null`
- `SearchFilters` shape: `{{ sendAmount: number, sendCurrency: string,
  receiveCurrency: string, receiveCountry: string, corridor: string }}`
- Actions: `setFilters`, `updateFilter`, `clearFilters`, `setResults`,
  `appendResults`, `setPage`, `setSearching`, `resetSearch`
- No persistence (search results are transient)

### `src/stores/compareStore.ts`
Full Zustand 5 store for the provider compare basket:
- State: `basket: string[]` (provider IDs, max 3),
  `isCompareDrawerOpen: boolean`
- Actions: `addToBasket(id)`, `removeFromBasket(id)`, `clearBasket()`,
  `toggleDrawer()`, `openDrawer()`, `closeDrawer()`
- Guard in `addToBasket`: warn and return early if `basket.length >= 3`
- Computed selector: `selectIsInBasket(id: string) => boolean`

### `src/stores/rateAlertStore.ts`
Full Zustand 5 store for rate alerts:
- State: `alerts: RateAlert[]`, `isLoading: boolean`, `error: string | null`
- Actions: `setAlerts`, `addAlert`, `removeAlert`, `updateAlert`, `setLoading`,
  `setError`, `clearError`

### `src/stores/notificationStore.ts`
Full Zustand 5 store for notifications:
- State: `notifications: AppNotification[]`, `unreadCount: number`,
  `isLoading: boolean`
- Actions: `setNotifications`, `markRead(id)`, `markAllRead()`,
  `setUnreadCount`, `addNotification`

### `src/stores/uiStore.ts`
Full Zustand 5 store for UI state:
- State: `isSidebarOpen: boolean`, `isMobileSidebarOpen: boolean`,
  `theme: 'light' | 'dark' | 'system'`, `toasts: Toast[]`,
  `activeModal: string | null`
- Actions: `openSidebar`, `closeSidebar`, `toggleSidebar`,
  `openMobileSidebar`, `closeMobileSidebar`,
  `setTheme`, `pushToast(toast)`, `dismissToast(id)`,
  `openModal(name)`, `closeModal()`
- `Toast` shape: `{{ id: string, message: string, type: 'success'|'error'|'info'|'warning', duration?: number }}`

### `src/stores/index.ts`
Barrel re-exporting all stores and their types.

### `src/components/providers/index.ts`
Barrel export.

## Code Requirements
- Zustand 5 API: `import {{ create }} from 'zustand'`
- `persist` from `'zustand/middleware'`
- `devtools` from `'zustand/middleware'`
- `immer` from `'zustand/middleware/immer'` for stores with nested state updates
- All state interfaces exported from store files
- No `any` types — use proper generics for Zustand `create<StateType>()`
- `QueryClient` must be instantiated once (module-level singleton in
  `lib/queryClient.ts`, imported by `Providers.tsx`)

## Output Format
### FILE: src/components/providers/Providers.tsx
```typescript
<complete implementation>
```

Output ALL files listed above with complete implementations.
Do not write placeholder stubs — every store must be fully implemented.
"""

    def _prompt_codegen_utils(
        self,
        architecture_output: str,
        analysis_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Generate Shared Utility Functions for Send2 Next.js App

## Role
You are generating the complete `src/lib/utils/` layer for the Send2 Next.js 15
application. These replace Angular Pipes, shared helper services, and any
utility-style methods found in Angular services.

## Architecture Decisions
{architecture_output[:3000]}

## Angular Analysis (helpers / pipes identified)
{analysis_output[:4000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Files to Generate

### `src/lib/utils/currency.ts`
- `formatCurrency(amount: number, currency: string, locale?: string): string`
  Uses `Intl.NumberFormat` with `style: 'currency'`
- `formatExchangeRate(rate: number, fromCurrency: string, toCurrency: string): string`
  e.g. "1 GBP = 1.2345 USD"
- `parseCurrencyInput(input: string): number | null`
  Strips currency symbols and parses float
- `getCurrencySymbol(currency: string, locale?: string): string`
- `roundToDecimalPlaces(value: number, places: number): number`
- Export `SUPPORTED_CURRENCIES: string[]` constant

### `src/lib/utils/date.ts`
- `formatDate(date: Date | string, format?: 'short' | 'medium' | 'long'): string`
  Uses `Intl.DateTimeFormat`
- `formatRelativeTime(date: Date | string): string`
  "2 hours ago", "just now", etc. using `Intl.RelativeTimeFormat`
- `parseISODate(isoString: string): Date`
- `isExpired(date: Date | string): boolean`
- `addDays(date: Date, days: number): Date`
- `startOfDay(date: Date): Date`
- `formatTimeRange(start: Date, end: Date): string`

### `src/lib/utils/string.ts`
- `capitalize(s: string): string`
- `truncate(s: string, maxLength: number, ellipsis?: string): string`
- `slugify(s: string): string`
- `toTitleCase(s: string): string`
- `stripHtml(html: string): string`
- `highlightMatch(text: string, query: string): string`
  Returns HTML string with `<mark>` tags around matches
- `pluralize(count: number, singular: string, plural?: string): string`

### `src/lib/utils/validation.ts`
- `isValidEmail(email: string): boolean`
- `isValidPhoneNumber(phone: string, countryCode?: string): boolean`
  (basic E.164 format check)
- `isValidAmount(amount: unknown): amount is number`
  Positive finite number check
- `isValidCurrencyCode(code: string): boolean`
  3-letter ISO 4217 check against SUPPORTED_CURRENCIES
- `isValidCountryCode(code: string): boolean`
  2-letter ISO 3166-1 alpha-2 check
- `sanitizeInput(input: string): string`
  Trim + strip dangerous HTML characters

### `src/lib/utils/url.ts`
- `buildSearchUrl(filters: Partial<SearchFilters>): string`
  Builds `/search?sendAmount=100&...` query string
- `parseSearchParams(searchParams: URLSearchParams): Partial<SearchFilters>`
- `buildProviderUrl(providerId: string, slug?: string): string`
- `getAbsoluteUrl(path: string): string`
  Prepends `NEXT_PUBLIC_SITE_URL` env var
- `isExternalUrl(url: string): boolean`

### `src/lib/utils/array.ts`
- `groupBy<T>(arr: T[], key: keyof T): Record<string, T[]>`
- `sortBy<T>(arr: T[], key: keyof T, direction?: 'asc' | 'desc'): T[]`
- `uniqueBy<T>(arr: T[], key: keyof T): T[]`
- `chunk<T>(arr: T[], size: number): T[][]`
- `flatten<T>(arr: T[][]): T[]`

### `src/lib/utils/object.ts`
- `omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>`
- `pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
- `deepMerge<T>(target: T, source: Partial<T>): T`
- `isEmptyObject(obj: object): boolean`
- `removeUndefined<T extends object>(obj: T): Partial<T>`

### `src/lib/utils/cn.ts`
- `cn(...inputs: ClassValue[]): string`
  Re-export of `clsx` + `tailwind-merge` combination (standard shadcn pattern)

### `src/lib/utils/index.ts`
Barrel re-export of all utility files.

### `src/lib/env.ts`
Environment variable validation using Zod:
```typescript
import {{ z }} from 'zod'
const envSchema = z.object({{
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  // ... other env vars
}})
export const env = envSchema.parse(process.env)
```

## Code Requirements
- All utilities are pure functions with no side effects
- Every function has explicit TypeScript parameter and return types
- Every function has a JSDoc comment (one sentence, max 2 lines)
- No Angular imports or Observable types
- No default exports — named exports only

## Output Format
### FILE: src/lib/utils/currency.ts
```typescript
<complete implementation>
```

Output ALL files listed above.
"""

    def _prompt_codegen_types(
        self,
        analysis_output: str,
        decomposition_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Generate TypeScript Type Definitions for Send2 Next.js App

## Role
You are generating the complete `src/types/` layer for the Send2 Next.js 15
application. These types replace Angular model classes, DTO interfaces, and
NgRx state shapes.

## Angular Analysis (interfaces / models identified)
{analysis_output[:5000]}

## Decomposition (feature domains)
{decomposition_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Files to Generate

### `src/types/api.ts`
Global API response envelope types including: `ApiResponse<T>`, `ApiError`
(with `code`, `field`, `message`), `PaginationMeta` (total, page, perPage,
lastPage, hasMore), and `ApiResult<T>` discriminated union.

### `src/types/auth.ts`
Auth-domain types: `User` (id, email, name, avatarUrl, roles, isVerified,
createdAt, updatedAt), `UserRole` union type, `AuthSession`, `LoginCredentials`,
`RegisterPayload`, `ForgotPasswordPayload`, `ResetPasswordPayload`.

### `src/types/provider.ts`
Provider-domain types: `Provider` (id, name, slug, logoUrl, rating,
reviewCount, isVerified, isFeatured, description, website,
supportedCorridors, transferMethods, fees, speedEstimates, tags),
`ProviderResult` (extends Provider with exchangeRate, recipientAmount,
totalCost, transferSpeed, promoCode, promoLabel), `Corridor`, `ProviderFee`,
`FeeTier`, `TransferMethod` union type, `SpeedEstimate`.

### `src/types/search.ts`
Search-domain types: `SearchFilters` (sendAmount, sendCurrency,
receiveCurrency, receiveCountry, corridor, transferMethod, maxFee, minRating),
`SearchResults` (results, meta, corridor, lastUpdated), `SearchSuggestion`,
`SortField` union, `SortDirection` union, `SearchSort`.

### `src/types/rate-alert.ts`
`RateAlert` (id, userId, fromCurrency, toCurrency, targetRate, currentRate,
isActive, notifyVia, triggeredAt, createdAt), `NotificationChannel` union,
`CreateRateAlertPayload`.

### `src/types/notification.ts`
`AppNotification` (id, userId, type, title, body, isRead, actionUrl,
createdAt), `NotificationType` union.

### `src/types/content.ts`
`Article` (id, slug, title, excerpt, body, author, category, tags,
featuredImageUrl, publishedAt, updatedAt, isSponsored), `Author`,
`ArticleCategory` union, `Promotion` (id, providerId, title, description,
promoCode, discountType, discountValue, validFrom, validUntil, corridors).

### `src/types/profile.ts`
`UserProfile` (extends User with phoneNumber, address, preferredCurrency,
preferredCountry, marketingOptIn, twoFactorEnabled), `Address`,
`UpdateProfilePayload`.

### `src/types/navigation.ts`
`NavItem` (label, href, icon, badge, requiresAuth, roles, isExternal).

### `src/types/ui.ts`
`Toast` (id, type, title, message, duration, action), `ModalConfig`,
`Theme` union, `Breadcrumb`.

### `src/types/index.ts`
Barrel export of all type files.

## Code Requirements
- No class-based types — interfaces and type aliases only
- No `any` — use `unknown` where the type is genuinely unknown
- All date fields as ISO string (`string`) — convert to `Date` at display time
- All money amounts as `number` documented in JSDoc
- Export every type as a named export
- File-level JSDoc comment explaining the domain

## Output Format
### FILE: src/types/api.ts
```typescript
<complete file content>
```

Output ALL files listed above. Do not write partial types.
"""

    def _prompt_codegen_services(
        self,
        service_ctx: str,
        analysis_output: str,
        codegen_types_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Generate TanStack Query Hooks Replacing Angular HTTP Services

## Role
You are a senior React engineer replacing Angular 17 `@Injectable` HTTP services
with TanStack Query 5 hooks (`useQuery`, `useMutation`, `useInfiniteQuery`) and
a typed API client for the Send2 Next.js 15 application.

## Angular Service Source
{service_ctx[:6000]}

## Angular Analysis
{analysis_output[:3000]}

## Generated Types (codegen.types)
{codegen_types_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Files to Generate

### `src/lib/api/client.ts`
Base API client wrapping `fetch`:
- `apiClient` singleton with `baseURL` from `env.NEXT_PUBLIC_API_URL`
- Methods: `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`
- Each method: adds `Authorization: Bearer <token>` header from auth store
  (call `useAuthStore.getState().token` — outside React, use `getState()`)
- Error handling: if response is not OK, parse JSON error body and throw
  `ApiError` with `code`, `message`, `status`
- `RequestConfig` type with optional `signal` for abort controller

### `src/lib/api/endpoints.ts`
Typed endpoint definitions as a nested const object covering: auth
(login, register, logout, refreshToken, forgotPassword, resetPassword),
providers (list, detail, search, compare, reviews), rateAlerts (list,
create, update, delete), notifications (list, markRead, markAllRead),
profile (get, update), content (articles, promotions), search (query,
suggest, rates/live).

### Auth Hooks (`src/hooks/auth/`)
- `useLoginMutation.ts` — POST /auth/login, sets auth store on success
- `useRegisterMutation.ts` — POST /auth/register
- `useLogoutMutation.ts` — POST /auth/logout, clears store + queryClient
- `useForgotPasswordMutation.ts` — POST /auth/forgot-password
- `useResetPasswordMutation.ts` — POST /auth/reset-password
- `index.ts` — barrel export

### Provider Hooks (`src/hooks/providers/`)
- `useProvidersQuery.ts` — GET /providers/search with SearchFilters
- `useProviderDetailQuery.ts` — GET /providers/:id, enabled when id is truthy
- `useProviderReviewsQuery.ts` — useInfiniteQuery for paginated reviews
- `useCompareProvidersQuery.ts` — fetch multiple providers by IDs array
- `index.ts` — barrel export

### Search Hooks (`src/hooks/search/`)
- `useSearchQuery.ts` — main search, staleTime: 0, keepPreviousData
- `useSearchSuggestionsQuery.ts` — debounced typeahead (200ms via useEffect)
- `useLiveRatesQuery.ts` — polling with refetchInterval: 60_000
- `index.ts` — barrel export

### Rate Alert Hooks (`src/hooks/rateAlerts/`)
- `useRateAlertsQuery.ts` — GET /rate-alerts
- `useCreateRateAlertMutation.ts` — POST with onSuccess invalidation
- `useDeleteRateAlertMutation.ts` — DELETE with optimistic update
- `index.ts` — barrel export

### Notification Hooks (`src/hooks/notifications/`)
- `useNotificationsQuery.ts` — refetchInterval: 30_000
- `useMarkReadMutation.ts` — PATCH with onMutate optimistic update
- `useMarkAllReadMutation.ts`
- `index.ts` — barrel export

### Profile Hooks (`src/hooks/profile/`)
- `useProfileQuery.ts` — GET /profile
- `useUpdateProfileMutation.ts` — PATCH with optimistic update + rollback
- `index.ts` — barrel export

### Content Hooks (`src/hooks/content/`)
- `useArticlesQuery.ts` — useInfiniteQuery for paginated articles
- `useArticleDetailQuery.ts` — single article by slug
- `usePromotionsQuery.ts`
- `index.ts` — barrel export

### `src/hooks/index.ts`
Root barrel re-exporting all hook sub-packages.

## Code Requirements
- Query key factory pattern per domain:
  `export const providerQueryKeys = {{ all: ['providers'] as const, ... }}`
- All hooks for use in Client Components only
- Explicit generic types: `useQuery<ReturnType, ErrorType>`
- No `any`
- TanStack Query 5: `import {{ useQuery, useMutation, useQueryClient }} from '@tanstack/react-query'`

## Output Format
### FILE: src/lib/api/client.ts
```typescript
<complete implementation>
```

Output ALL files listed above with complete implementations.
"""

    def _prompt_codegen_mocks(
        self,
        codegen_types_output: str,
        codegen_services_output: str,
        mkb_ctx: str,
    ) -> str:
        mock_modules_table = "\n".join(
            f"  - {feat}: mock `{hook}`"
            for feat, hook in self.MOCK_CODEGEN_MODULES
        )
        return f"""# Task: Generate MSW Mock Handlers and Fixture Data

## Role
You are generating the complete MSW (Mock Service Worker) v2 mock layer for the
Send2 Next.js 15 application. These mocks replace Angular test doubles and
enable offline development, Storybook, and Vitest unit testing.

## Feature → Hook Mapping (MOCK_CODEGEN_MODULES)
Each feature has a primary hook that tests should mock via MSW or vi.mock():
{mock_modules_table}

## Generated Types (codegen.types)
{codegen_types_output[:4000]}

## Generated Services/Hooks (codegen.services)
{codegen_services_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Files to Generate

### Fixture Files (`src/__mocks__/fixtures/`)
- `users.ts` — `mockUser`, `mockAdmin`, `mockUnverifiedUser`, `mockUsers[]`
- `providers.ts` — `mockProvider`, `mockProviderResult`, `mockProviders[]`
  (5 providers: Wise, Remitly, WorldRemit, Western Union, MoneyGram),
  `mockProviderResults[]` with varying rates/fees
- `search.ts` — `mockSearchFilters` (GBP->USD £500), `mockSearchResults`,
  `mockSearchSuggestions[]`
- `rateAlerts.ts` — `mockRateAlert`, `mockRateAlerts[]` (3 entries)
- `notifications.ts` — `mockNotification`, `mockNotifications[]` (5 entries)
- `content.ts` — `mockArticle`, `mockArticles[]` (3), `mockPromotion`,
  `mockPromotions[]` (2)
- `index.ts` — barrel export

### MSW Handler Files (`src/__mocks__/handlers/`)

#### `auth.ts`
MSW v2 handlers using `import {{ http, HttpResponse }} from 'msw'`:
- POST /auth/login — returns mockUser + token; /auth/login?fail=true returns 401
- POST /auth/register — returns mockUser + token
- POST /auth/logout — returns 204
- POST /auth/forgot-password — returns 200
- POST /auth/reset-password — returns 200
- POST /auth/refresh — returns new token

#### `providers.ts`
- GET /providers — returns mockProviders
- GET /providers/:id — single provider by param
- GET /providers/search — returns mockSearchResults (200ms simulated delay)
- GET /providers/compare — subset of mockProviders
- GET /providers/:id/reviews — paginated mock reviews

#### `rateAlerts.ts`
- GET /rate-alerts, POST /rate-alerts, PATCH /rate-alerts/:id, DELETE /rate-alerts/:id

#### `notifications.ts`
- GET /notifications, PATCH /notifications/:id/read, POST /notifications/read-all

#### `profile.ts`
- GET /profile, PATCH /profile

#### `search.ts`
- GET /search (400ms delay), GET /search/suggest, GET /rates/live

#### `content.ts`
- GET /content/articles (paginated), GET /content/articles/:slug,
  GET /content/promotions

#### `index.ts`
Combines all handler arrays: `export const handlers = [...authHandlers, ...]`

### Setup Files
- `src/__mocks__/browser.ts` — MSW v2 browser: `setupWorker(...handlers)`
- `src/__mocks__/server.ts` — MSW v2 Node: `setupServer(...handlers)`
- `src/test-utils/setup.ts` — Vitest global: beforeAll/afterEach/afterAll
  with server.listen/resetHandlers/close
- `src/test-utils/render.tsx` — `renderWithProviders` wrapping RTL render
  with QueryClientProvider and Zustand store reset
- `src/test-utils/index.ts` — barrel export

## Code Requirements
- MSW v2 syntax: `http.get`, `http.post` etc.
- `HttpResponse.json()` and `HttpResponse.error()` — NOT `res(ctx.json(...))`
- Fixtures use realistic data (real-sounding names, valid currency codes)
- All handlers typed — request/response bodies use generated types
- Simulated delays using `await delay(ms)` from `'msw'` where noted

## Output Format
### FILE: src/__mocks__/fixtures/users.ts
```typescript
<complete implementation>
```

Output ALL files listed above.
"""

    @staticmethod
    def _prompt_codegen_navigation(
        architecture_output: str,
        plan_routes_output: str,
        codegen_layout_output: str,
        integration_migration_output: str,
        routing_ctx: str,
        mkb_ctx: str,
    ) -> str:
        return f"""
You are the Navigation Codegen Agent for the Send2 Angular→Next.js migration.

Generate ALL Next.js App Router routing infrastructure files:

## FILES TO GENERATE

### middleware.ts (root)
- Protect auth-required routes: redirect to /login if no auth_token cookie
- Public routes: /, /search, /provider/*, /blog/*, /news/*, /about-us, /contact-us
- Auth routes: /authentication/* (redirect to / if already logged in)
- Profile routes: /profile/* (redirect to /profile/setup if incomplete)

### Route Group Layouts
For each route group in plan.routes:
- `src/app/(auth)/layout.tsx` — auth pages shell (no header/footer)
- `src/app/(public)/layout.tsx` — public pages shell (with header/footer)
- `src/app/(protected)/layout.tsx` — protected pages shell (with header/footer + auth check)

### Loading & Error Boundaries
For each major route group:
- `loading.tsx` — skeleton/spinner
- `error.tsx` — error boundary with retry

### Navigation Utilities
- `src/lib/navigation.ts` — typed route constants, navigation helpers
- `src/lib/auth-utils.ts` — cookie helpers (getAuthToken, clearAuthToken)

STRICT RULES:
- middleware.ts MUST use Next.js middleware pattern (export function middleware + export const config)
- Auth check MUST read httpOnly cookie 'auth_token' only — never localStorage
- All route paths must match plan.routes exactly

ARCHITECTURE OUTPUT:
{architecture_output[:2000]}

PLAN ROUTES OUTPUT:
{plan_routes_output[:3000]}

INTEGRATION MIGRATION OUTPUT:
{integration_migration_output[:2000]}

ANGULAR ROUTING SOURCE:
{routing_ctx}

{mkb_ctx}
""".strip()

    def _prompt_codegen_feature(
        self,
        feature: str,
        feature_ctx: str,
        component_ctx: str,
        architecture_output: str,
        plan_routes_output: str,
        plan_state_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_layout_output: str,
        mkb_ctx: str,
    ) -> str:
        feature_display = feature.replace("_", "-").title()
        return f"""# Task: Generate Next.js 15 Feature — `{feature_display}`

## Role
You are a senior React/Next.js engineer migrating the `{feature_display}` feature
from the Angular 17 Send2 application to Next.js 15 with the App Router.

Stack: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, Zustand 5,
TanStack Query 5, react-hook-form + zod for forms, Vitest + Testing Library.

## Angular Source for Feature `{feature}`
{feature_ctx[:5000]}

## Angular Component Templates for Feature `{feature}`
{component_ctx[:3000]}

## Architecture Decisions
{architecture_output[:2000]}

## Route Plan
{plan_routes_output[:2000]}

## State Plan
{plan_state_output[:1500]}

## Generated Types (available for import from `@/types`)
{codegen_types_output[:1500]}

## Generated Hooks (available for import from `@/hooks`)
{codegen_services_output[:1500]}

## Layout Reference (for navigation/layout imports)
{codegen_layout_output[:1000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Generate for Feature `{feature_display}`

### Route Group Files
Generate the route group directory `src/app/({feature})/`:
- `layout.tsx` — feature-level layout (auth check, feature-specific shell)
- Every page file as specified in the route plan for this feature
- `loading.tsx` for each page with skeleton UI
- `error.tsx` if the feature has complex error states

### Page Components
For every page in this feature:
- Server Component pages where data can be server-fetched
- `"use client"` directive ONLY where needed (event handlers, hooks, Zustand)
- `generateMetadata()` export with page-specific title and description
- Structured data (JSON-LD) where SEO-relevant
- Suspense boundaries wrapping async data sections

### Feature Components
In `src/features/{feature}/components/`:
- Break down the Angular templates into focused React components
- Container components (data-fetching) vs presentational components (pure UI)
- Each component in its own file

### Feature-Specific Hooks
In `src/features/{feature}/hooks/`:
- Any feature-specific business logic not suitable for the global hooks layer
- Form submission hooks using react-hook-form + zod

### Forms (if applicable)
For any form in this feature:
- Use `react-hook-form` with `zodResolver`
- Define the zod schema in the same file as the form component
- Handle loading, error, and success states
- Accessible labels and error messages

### UI Requirements
Reproduce the Angular template's visual structure in Tailwind CSS 4:
- Responsive: mobile-first, `sm:`, `md:`, `lg:` breakpoints
- Match the existing Angular component's field order and layout
- Use Tailwind `group`, `peer`, and `data-*` variants for interactive states
- Loading skeletons that match the content layout

## Code Requirements
- Strict TypeScript — no `any`, every prop typed with interface
- `"use client"` ONLY where React hooks or event handlers are needed
- Server Components use `async function Page()` and `await`
- Client Components start with `"use client"` as the very first line
- All images: `next/image` with explicit dimensions
- All links: `next/link` with `prefetch` (default)
- Forms: react-hook-form + zod — no uncontrolled raw DOM manipulation
- Error states: surface user-friendly messages, not raw API errors
- Accessibility: ARIA labels, keyboard navigation, focus management

## Output Format
### FILE: src/app/({feature})/layout.tsx
```typescript
<complete implementation>
```

Output EVERY file needed for the complete `{feature_display}` feature.
Do not write placeholder `// TODO` comments — implement everything.
"""

    def _prompt_codegen_tests(
        self,
        architecture_output: str,
        codegen_types_output: str,
        codegen_services_output: str,
        codegen_mocks_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Generate Vitest + Testing Library Unit Tests

## Role
You are a senior test engineer writing the complete unit and integration test
suite for the Send2 Next.js 15 application using Vitest 1, React Testing
Library 15, and MSW 2 mocks.

## Architecture
{architecture_output[:3000]}

## Generated Types
{codegen_types_output[:2000]}

## Generated Hooks (codegen.services)
{codegen_services_output[:2000]}

## Generated Mocks (codegen.mocks)
{codegen_mocks_output[:2000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Test Files to Generate

### Utility Tests
- `src/__tests__/lib/utils/currency.test.ts` — formatCurrency, formatExchangeRate,
  parseCurrencyInput, roundToDecimalPlaces (min 8 test cases using it.each)
- `src/__tests__/lib/utils/date.test.ts` — formatDate, formatRelativeTime,
  isExpired (min 6 test cases)
- `src/__tests__/lib/utils/string.test.ts` — slugify, truncate, capitalize,
  toTitleCase, pluralize (min 8 test cases)
- `src/__tests__/lib/utils/validation.test.ts` — isValidEmail, isValidAmount,
  isValidCurrencyCode (min 10 test cases)

### Hook Tests (MSW integration)
- `src/__tests__/hooks/auth/useLoginMutation.test.ts`
  Tests: successful login sets auth store, failed login (401) sets error,
  network error handled gracefully
- `src/__tests__/hooks/providers/useProvidersQuery.test.ts`
  Tests: returns results for valid filters, disabled when sendAmount is 0,
  loading state, error on 500
- `src/__tests__/hooks/search/useSearchQuery.test.ts`
  Tests: correct query params, keepPreviousData during page change, staleTime 0

### Store Tests (pure Zustand, no React)
- `src/__tests__/stores/authStore.test.ts`
  Reset store in beforeEach; test login/logout actions; test selectIsAuthenticated
- `src/__tests__/stores/searchStore.test.ts`
  Tests: setFilters, clearFilters resets to defaults, setPage
- `src/__tests__/stores/compareStore.test.ts`
  Tests: addToBasket, reject 4th item (max 3), removeFromBasket, selectIsInBasket
- `src/__tests__/stores/uiStore.test.ts`
  Tests: toggleSidebar, pushToast unique ID, dismissToast by ID

### Component Tests
- `src/__tests__/components/navigation/Navbar.test.tsx`
  Tests: renders logo, shows Sign In when not authed, shows avatar when authed,
  active link highlighted
- `src/__tests__/components/navigation/Sidebar.test.tsx`
  Tests: renders all nav items, shows notification badge when unreadCount > 0,
  calls closeMobileSidebar on nav item click

### API Client Tests
- `src/__tests__/lib/api/client.test.ts`
  Tests: GET includes Authorization header, throws ApiError on non-OK, signal passed through

### `vitest.config.ts`
Complete Vitest config with:
- environment: 'jsdom'
- setupFiles: './src/test-utils/setup.ts'
- globals: true
- coverage provider: 'v8' with thresholds (lines 80, branches 70, functions 80)
- resolve alias: `@` -> `./src`

## Code Requirements
- Vitest 1 API: `import {{ describe, it, expect, vi, beforeEach }} from 'vitest'`
- React Testing Library: `@testing-library/react`, `@testing-library/user-event`
- All async tests use `await`
- Use `vi.fn()` for mocks, `vi.spyOn()` for partial mocks
- Each test file has a `describe` block matching the module name
- Tests co-located in `src/__tests__/` mirroring `src/` structure

## Output Format
### FILE: vitest.config.ts
```typescript
<complete implementation>
```

Output ALL test files listed above.
"""

    @staticmethod
    def _prompt_code_review(
        architecture_output: str,
        generated_ctx: str,
        mkb_ctx: str,
    ) -> str:
        return f"""
You are the Code Review Agent for the Send2 Angular→Next.js migration.

Review ALL generated TypeScript/React files for:

## 1. SECURITY ISSUES
- JWT/tokens in localStorage (must be httpOnly cookies)
- API keys hardcoded (must be env vars)
- Missing input validation
- XSS vulnerabilities (dangerouslySetInnerHTML without sanitization)

## 2. EQUIVALENCE ISSUES
- Logic added that doesn't exist in Angular source (INVENTED_LOGIC)
- Features present in Angular but missing in generated (MISSING_FEATURE)

## 3. QUALITY ISSUES
- TypeScript `any` usage (must use typed interfaces)
- Missing error boundaries
- Missing loading states for async operations
- Unused imports

## 4. ARCHITECTURAL COMPLIANCE
- Server vs Client components incorrectly marked
- TanStack Query not used for API calls (raw fetch/axios in components)
- Zustand store used for server state (must use TanStack Query)

## OUTPUT FORMAT
For each issue:
- File: `src/app/.../file.tsx`
- Line: approximate
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Issue: description
- Fix: exact change needed

ARCHITECTURE:
{architecture_output[:2000]}

GENERATED CODE:
{generated_ctx}

{mkb_ctx}
""".strip()

    def _prompt_assemble(
        self,
        architecture_output: str,
        plan_routes_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Assemble and Verify the Generated Next.js 15 Project

## Role
You are a build engineer performing final assembly of the generated Next.js 15
Send2 application: writing missing barrel index files, correcting import paths,
generating `tsconfig.json` path aliases, and producing a `package.json` with
all dependencies.

## Architecture Decisions
{architecture_output[:4000]}

## Route Plan
{plan_routes_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Generate

### `package.json`
Complete package.json with name "send2-web", version "0.1.0", scripts (dev,
build, start, lint, test, test:coverage, type-check), and all dependencies:
- next 15.x, react 19.x, react-dom 19.x, typescript 5.4.x
- @tanstack/react-query 5.40.x, zustand 5.x, tailwindcss 4.x
- react-hook-form 7.x, zod 3.x, msw 2.x
- clsx 2.x, tailwind-merge 2.x, date-fns 3.x
- devDependencies: vitest 1.x, @testing-library/react 16.x,
  @testing-library/user-event 14.x, @vitejs/plugin-react 4.x,
  @types/react 19.x, @types/node, eslint, prettier,
  @tanstack/react-query-devtools 5.x

### `tsconfig.json`
Complete TypeScript config with:
- target: "ES2022", strict: true, noUncheckedIndexedAccess: true
- moduleResolution: "bundler", jsx: "preserve"
- Path aliases: `@/*` -> `./src/*`, `@components/*`, `@hooks/*`, `@stores/*`,
  `@types/*`, `@lib/*`, `@features/*`

### `next.config.ts`
Complete Next.js config with reactStrictMode, image domains for api.send2.com
and cdn.send2.com, experimental PPR, all redirects from plan.routes, and
security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
Permissions-Policy, Content-Security-Policy).

### `tailwind.config.ts`
Tailwind CSS 4 config covering all src/**/*.tsx content paths, with theme
extension for brand colors, spacing, and font families.

### `.env.example`
All required env vars: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL,
NEXTAUTH_SECRET, NEXTAUTH_URL.

### `src/middleware.ts`
Complete Next.js middleware for route protection: read session cookie, redirect
unauthenticated users to /login, redirect authenticated users away from /login
and /register. Full `config.matcher` array.

### Missing Barrel Files
`src/components/ui/index.ts`, `src/components/forms/index.ts`,
`src/components/feedback/index.ts`, and `src/features/*/index.ts` (11 features).

### `src/app/(auth)/layout.tsx`
Auth group layout: centred, no sidebar, no nav bar.

### `src/app/(main)/layout.tsx`
Main authenticated group layout: full sidebar + navbar shell.

### Assembly Verification Report
After all files, output a Markdown section:
- Route coverage checklist (all 30+ routes: PRESENT/MISSING)
- Import path validation (aliases resolve correctly)
- Missing files list (referenced but not generated)
- Build gate status (pnpm build expectations)

## Output Format
### FILE: package.json
```json
<complete file>
```

### FILE: tsconfig.json
```json
<complete file>
```

Output ALL files listed above. End with the Assembly Verification Report.
"""

    # ── Phase 4 — Validation ─────────────────────────────────────────────────

    def _prompt_ui_spec(
        self,
        component_ctx: str,
        analysis_output: str,
        architecture_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Write UI Specification Mapping Angular Templates to Next.js Pages

## Role
You are a UI/UX migration specialist documenting the Send2 Angular 17 UI in
enough detail that a React developer can reproduce it pixel-accurately in
Next.js 15 with Tailwind CSS 4.

## Angular Component Templates
{component_ctx[:8000]}

## Angular Analysis
{analysis_output[:3000]}

## Architecture Decisions
{architecture_output[:2000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Design Token Inventory
Extract from Angular CSS/SCSS all brand colours (hex codes, usage context),
font families/weights/sizes, spacing scale values, border radii, shadow
definitions, and transition durations. Present as a Tailwind config `extend` block.

### 2. Component-by-Component Mapping
For each Angular component found in the templates, produce a spec card:

```
## Component: <ComponentName> (file: path/to/component)

### Purpose
One sentence describing what this component does.

### Angular Template Summary
- Layout structure: [describe grid/flex]
- Key elements: [list of UI elements]
- Responsive breakpoints: [describe]
- CSS classes of note: [list]
- Dynamic data bindings: [list property bindings]
- Event bindings: [list (click), (submit), etc.]
- Directives used: [*ngFor, *ngIf, ng-template, etc.]

### React/Next.js Equivalent
- Component type: Server | Client | Shared
- Target file: src/features/<feature>/components/<Name>.tsx
- Props interface: [define props]
- Hooks needed: [list]
- Tailwind class translation: [key Angular classes -> Tailwind equivalents]

### UI Fidelity Notes
Pixel-accuracy requirements, brand-specific decisions, animations to preserve.
```

Cover every component found in the Angular source.

### 3. Form Specifications
For every Angular form: field list (name, type, validation rules, placeholder,
error messages), submit behaviour (API endpoint, loading state, success action),
and the equivalent react-hook-form zod schema.

### 4. Navigation Spec
Header (logo, nav items, auth state variations, mobile collapse), Sidebar
(items, icons, active/collapsed state, mobile overlay), Bottom nav (items,
active state), Breadcrumb (which pages, depth).

### 5. Loading State Specifications
For each page/section: which content areas use `animate-pulse`, skeleton
height/width/shape for each placeholder.

### 6. Error State Specifications
Inline form errors (position, colour, icon), page-level errors (error boundary
content), toast notifications (position, types, auto-dismiss duration).

### 7. Animation and Transition Inventory
List all Angular CSS transitions/animations (page transitions, modal open/close,
sidebar expand/collapse, loading spinners, hover/focus states) and their
Tailwind/CSS equivalents.

## Output Format
Return a single Markdown document with all 7 sections. Be as specific as
possible — include actual class names, hex colours, and pixel measurements
wherever found in the Angular source.
"""

    def _prompt_dualrun_plan(
        self,
        analysis_output: str,
        architecture_output: str,
        ui_spec_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Plan Dual-Run Equivalence Test Strategy

## Role
You are a QA architect designing a dual-run equivalence test plan that verifies
the Next.js 15 Send2 application produces functionally identical outputs to the
Angular 17 original for the same inputs.

## Angular Analysis
{analysis_output[:4000]}

## Architecture Decisions
{architecture_output[:3000]}

## UI Specification
{ui_spec_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Dual-Run Test Philosophy
Explain the dual-run strategy: run Angular and Next.js side-by-side with
identical mock data, compare rendered HTML structure, visible text, and numeric
outputs, flag pixel-level and functional regressions.

### 2. Critical Equivalence Points
Table of at least 15 user flows that MUST produce identical results:
| Flow | Angular Entry | Next.js Entry | Comparison Method |
(include: search GBP->USD, login, register, rate alert CRUD, provider detail,
compare basket, notifications, profile update, article view, promotions, settings)

### 3. Playwright E2E Test Plan
For at least 8 critical flows, write Playwright test spec skeletons using
`import {{ test, expect }} from '@playwright/test'`. Each test should include
page navigation, interaction, and assertion on visible content.

### 4. Visual Regression Test Plan
Tool: Playwright `expect(page).toHaveScreenshot()`. Pages to snapshot: home,
search results, provider detail, login, profile. Breakpoints: 375px, 768px,
1280px. Strategy for dynamic content (frozen/mocked data).

### 5. API Output Equivalence
For each endpoint: Angular expected response shape vs Next.js expected response
shape, differences (if any) and whether intentional.

### 6. Performance Equivalence Targets
| Metric | Angular Baseline | Next.js Target | Test Method |
(LCP, INP, CLS, bundle size, search TTI — include targets and measurement tools)

### 7. Cutover Checklist
Ordered checklist of at least 10 tasks before cutting over production traffic,
including: E2E suite passing, visual regression approved, Lighthouse scores,
feature flags, rollback plan, DNS/CDN config, error monitoring, analytics
verification, SEO redirects, sitemap/robots.txt.

### 8. `playwright.config.ts`
Complete Playwright configuration with testDir, baseURL, webServer config.

## Output Format
Return a single Markdown document with all 8 sections. Be specific — name
actual routes, data-testid attributes, and assertion patterns.
"""

    def _prompt_validation_structure(
        self,
        architecture_output: str,
        plan_routes_output: str,
        assemble_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Validate Generated Next.js 15 Directory Structure

## Role
You are a code-review engineer validating that the generated Next.js 15 Send2
application directory structure matches the planned architecture and that no
required files are missing.

## Architecture Plan
{architecture_output[:5000]}

## Route Plan
{plan_routes_output[:4000]}

## Assemble Output (generated file manifest)
{assemble_output[:4000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Required File Checklist
For every file that MUST exist in a correct Next.js 15 App Router project,
check whether it was generated. Format:
`- [ ] src/app/layout.tsx  —  MISSING / PRESENT`

Cover: Core infrastructure (layout, globals.css, loading, error, not-found,
middleware, Providers, next.config.ts, tsconfig.json, package.json,
tailwind.config.ts, vitest.config.ts), all route group files (30+ pages),
all 6 stores, all hooks files, all type files, all utility files, all mock files.

### 2. Critical Missing Files
For each MISSING file that causes build failure or runtime error:
- File path, why critical, which stage should have generated it, suggested fix.

### 3. Naming Convention Audit
Check for violations of: PascalCase for React components, camelCase for hooks,
camelCase for utility files, camelCase for store files, kebab-case for App
Router directories. List all violations.

### 4. Import Path Consistency
Check that `@/` aliases are used consistently (no relative `../../` paths
that cross domain boundaries), types not redefined locally, hooks not bypassed.

### 5. Barrel Export Coverage
List every directory with multiple exported modules that is missing an
`index.ts` barrel file.

### 6. Server / Client Component Boundary Audit
Identify: Server Components importing "use client" code directly, Client
Components with large server-only module imports, missing "use client"
directives on hook-using components.

### 7. Overall Completeness Score
```
Total required files:    XX
Generated/present:       XX
Missing (critical):      XX
Missing (non-critical):  XX
Completeness:            XX%
```

### 8. Recommended Next Steps
Ordered list of actions to reach 100% completeness.

## Output Format
Return a single Markdown document with all 8 sections. For each MISSING file,
specify what it should contain and which codegen stage is responsible.
"""

    def _prompt_validation_types(
        self,
        codegen_types_output: str,
        assemble_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Validate TypeScript Type Coverage for Send2 Next.js App

## Role
You are a TypeScript type-safety auditor reviewing the generated type definitions
for the Send2 Next.js 15 application to identify gaps, `any` escapes, missing
interfaces, and incorrect type assignments.

## Generated Types (codegen.types)
{codegen_types_output[:6000]}

## Assemble Output
{assemble_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Type Coverage Audit Table
For each domain entity that should have a type definition:
| Entity | File | Status | Issues |
Cover at minimum: User, AuthSession, Provider, ProviderResult, Corridor,
SearchFilters, SearchResults, RateAlert, AppNotification, Article, Promotion,
UserProfile, Address, Toast, NavItem, ApiResponse, ApiError, PaginationMeta.

### 2. Forbidden `any` Report
List every instance of `any` in the generated type files: file path, context,
what it should be typed as, suggested fix.

### 3. Missing Generic Constraints
Check: `useQuery` calls without explicit type parameters, `create<StateType>()`
without the state type, `React.FC` usage (prefer explicit return types).

### 4. Optional vs Required Field Audit
Review interfaces for fields that should be optional vs required: API response
fields that may be null (should use `| null` or `?`), context-dependent fields.

### 5. Discriminated Union Opportunities
Identify places where a discriminated union eliminates type guards. Show the
before/after pattern.

### 6. Cross-File Consistency Check
Verify: same entity not defined differently in multiple files, `PaginationMeta`
used consistently, date fields consistently `string` (ISO) not `Date`.

### 7. Store Type Consistency
For each Zustand store: state type interface exported, `create<StateType>()`
generic matches interface, selector functions have explicit return types.

### 8. API Contract Types
For each API endpoint: response typed in `useQuery<ResponseType, Error>`,
no `unknown` or `any` responses.

### 9. Type Completeness Score
Total entities requiring types / fully typed / partially typed / missing.
Calculate percentage.

### 10. Remediation Plan
For each issue: one-line fix with severity (HIGH/MEDIUM/LOW).

## Output Format
Return a single Markdown document with all 10 sections. Quote problematic
type definitions and show the corrected version.
"""

    def _prompt_validation_routes(
        self,
        routing_ctx: str,
        plan_routes_output: str,
        assemble_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Validate Route Coverage — All Angular Routes Implemented in Next.js

## Role
You are a routing validation engineer verifying that every Angular route in
the Send2 application has been implemented as a Next.js 15 App Router page,
and that routing behaviour (guards, redirects, params) is correctly migrated.

## Angular Routing Source
{routing_ctx[:6000]}

## Route Plan (plan.routes)
{plan_routes_output[:5000]}

## Assemble Output (generated file manifest)
{assemble_output[:3000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Route Coverage Matrix
Complete matrix: every Angular route vs its Next.js implementation.
| Angular Route | Angular Component | Guard | Next.js File | Status | Issues |
List ALL Angular routes including lazy-loaded children, wildcards, redirects.

### 2. Missing Route Report
For each MISSING route: Angular source details, Next.js target path and
component, impact level, recommended action (re-run which stage).

### 3. Auth Guard Migration Audit
For every route with an Angular auth guard:
| Angular Guard | Route(s) | Next.js Middleware Matcher | Status |

### 4. Dynamic Route Parameter Audit
| Angular Param Route | Param Name | Next.js File | generateStaticParams? | Validation? |

### 5. Redirect Completeness
Compare planned redirects from `plan.routes` vs `next.config.ts`. List
missing redirects and incorrect redirect chains.

### 6. Navigation Link Audit
Routes with NO inbound navigation links (potential dead pages):
| Route | File | Inbound Links | Action |

### 7. Route Group Layout Audit
For each route group: layout.tsx present? Correct auth state? Correct shell?

### 8. 404 and Error Boundary Coverage
Is not-found.tsx implemented? Does every route group have error.tsx?
Routes that could throw unhandled errors without a boundary?

### 9. Route Coverage Score
Total Angular routes / Implemented / Missing (critical vs non-critical) /
Guards migrated / Redirects implemented. Calculate percentage.

### 10. Remediation Priority List
Ordered by severity: CRITICAL (blocking core flows), HIGH (auth guards),
MEDIUM (SEO redirects), LOW (dead pages).

## Output Format
Return a single Markdown document with all 10 sections. Use tables for matrices.
"""

    def _prompt_validation_5layer(
        self,
        legacy_ctx: str,
        analysis_output: str,
        architecture_output: str,
        assemble_output: str,
        validation_structure_output: str,
        validation_types_output: str,
        validation_routes_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: 5-Layer Migration Validation for Send2 Angular to Next.js

## Role
You are a principal engineer performing a comprehensive 5-layer validation of
the Send2 Angular 17 to Next.js 15 migration, consolidating all prior
validation stages.

## Angular Source Context
{legacy_ctx[:3000]}

## Angular Analysis
{analysis_output[:3000]}

## Architecture Decisions
{architecture_output[:2000]}

## Assemble Output
{assemble_output[:2000]}

## Structure Validation
{validation_structure_output[:2000]}

## Types Validation
{validation_types_output[:2000]}

## Routes Validation
{validation_routes_output[:2000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

---

### Layer 1 — Unit Test Coverage Validation

Review generated Vitest tests against each module:
| Module | Tested? | Key Assertions Present? | Coverage Estimate | Gaps |

For each gap: write a test case specification with priority.

---

### Layer 2 — Integration Test Coverage Validation

Check all critical user-facing flows have integration tests using MSW:
| Flow | Test File | MSW Handlers Used | Status | Missing Scenarios |

For each MISSING integration test: test file path, scenarios needed, priority.

---

### Layer 3 — Business Logic Equivalence Validation

For each critical Angular business rule, verify it was migrated correctly:
| Business Rule | Angular Location | Next.js Location | Verified? | Discrepancies |

List at minimum 15 business rules. Explain any PARTIAL or NO entries.

---

### Layer 4 — Non-Functional Requirements (NFR) Validation

#### Performance
| NFR | Target | Estimated Actual | Method | Status |
(LCP, INP, initial JS bundle, search API response)

#### Security
| NFR | Control | Status | Notes |
(auth tokens in httpOnly cookies, CSRF, XSS, sensitive data in localStorage)

#### Accessibility (WCAG 2.1 AA)
| Criterion | Component | Status | Notes |
(colour contrast, keyboard navigation, ARIA labels, focus management)

#### SEO
| Page | generateMetadata present? | Structured data? | Sitemap? |
(home, provider detail, article, search results)

---

### Layer 5 — UAT Acceptance Criteria

For each user story / acceptance criterion:
| ID | User Story | Acceptance Criteria | Status | Evidence |

List all identifiable user stories (minimum 15).

---

### Consolidated Migration Readiness Score

```
Layer 1 — Unit Tests:        XX / 100
Layer 2 — Integration Tests: XX / 100
Layer 3 — Business Logic:    XX / 100
Layer 4 — NFR:               XX / 100
Layer 5 — UAT:               XX / 100

OVERALL MIGRATION READINESS: XX / 100
```

### Blocking Issues (must fix before go-live)
Numbered list of issues blocking production deployment.

### Non-Blocking Issues (fix in next sprint)
Numbered list of known gaps that do not block go-live.

## Output Format
Return a single Markdown document with all 5 layers and the consolidated
readiness score. Cite file names and code paths for each finding.
"""

    # ── Phase 5 — Rollout ─────────────────────────────────────────────────────

    @staticmethod
    def _prompt_documentation(
        analysis_output: str,
        architecture_output: str,
        assemble_output: str,
        validation_5layer_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""
You are the Documentation Agent for the Send2 Angular→Next.js migration.

Generate comprehensive migration documentation covering:

## 1. MIGRATION OVERVIEW
- Source: Angular 17 (Send2 web app)
- Target: Next.js 15 with App Router, TypeScript, Tailwind CSS, TanStack Query, Zustand
- Migration approach and key decisions made

## 2. ARCHITECTURE DECISIONS
- Why each major architectural choice was made
- Angular → Next.js concept mapping (NgModule → layout, Service → TanStack Query hook, etc.)
- State management: NgRx → Zustand migration rationale

## 3. FILE STRUCTURE
- Generated project directory structure
- Key files and their purpose
- Where to find each feature

## 4. ENVIRONMENT SETUP
- Required environment variables (.env.local)
- How to run: pnpm install, pnpm dev, pnpm build
- API endpoints and Strapi CMS configuration

## 5. KNOWN LIMITATIONS
- Anything not migrated and why
- Manual steps required post-migration
- Areas that need further testing

## 6. RUNBOOK
Step-by-step operational guide for deploying and maintaining the Next.js app.

ANALYSIS OUTPUT:
{analysis_output[:4000]}

ARCHITECTURE OUTPUT:
{architecture_output[:4000]}

ASSEMBLE OUTPUT:
{assemble_output[:2000]}

VALIDATION OUTPUT:
{validation_5layer_output[:3000]}

{mkb_ctx}
""".strip()

    def _prompt_feedback_loop(
        self,
        legacy_ctx: str,
        analysis_output: str,
        architecture_output: str,
        assemble_output: str,
        validation_5layer_output: str,
        dualrun_plan_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Feedback Loop — Surface Systematic Gaps and Upgrade MKB Guidance

## Role
You are a migration system architect performing a self-improvement pass on the
completed Send2 Angular 17 to Next.js 15 migration run. Your output will be
written to the Machine Knowledge Base (MKB) to improve future migration runs.

CRITICAL: This stage MUST NOT auto-approve any HITL (Human-in-the-Loop) gates
or take any production action. It only produces documents for human review
and MKB ingestion.

## Angular Source Context
{legacy_ctx[:3000]}

## Analysis (extract.analysis)
{analysis_output[:2000]}

## Architecture (plan.architecture)
{architecture_output[:2000]}

## Assemble Output
{assemble_output[:2000]}

## 5-Layer Validation
{validation_5layer_output[:3000]}

## Dual-Run Plan
{dualrun_plan_output[:2000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### Document 1: `mkb/angular-nextjs-patterns.md`
An upgraded patterns guide for future Angular to Next.js migrations, covering:
- Confirmed working patterns (NgRx to Zustand, HttpClient Observable to
  TanStack Query, Angular Route Guard to Next.js Middleware, @Pipe to lib/utils,
  template-driven form to react-hook-form + zod) — each with a code example
- Anti-patterns to avoid (duplicate server state in Zustand, useEffect for
  data fetching, unnecessary "use client")
- Edge cases discovered during this migration run

### Document 2: `mkb/angular-nextjs-risks.md`
Updated risk register with:
- Risks confirmed by this run (which materialised, how resolved)
- New risks discovered (not anticipated)
- Mitigations that worked / failed

### Document 3: `mkb/stage-prompt-improvements.md`
For each stage that produced incomplete or incorrect output, document:
```
Stage: <stage-name>
Issue: <description>
Root Cause: <technical root cause>
Prompt Improvement: <specific change to the prompt method>
Priority: HIGH/MEDIUM/LOW
```
List at minimum 5 prompt improvement suggestions.

### Document 4: `mkb/architecture-decisions-log.md`
Finalised ADR log with at least 15 decisions:
| Decision ID | Decision | Context | Rationale | Date |

### Document 5: `mkb/completeness-gap-report.md`
Summary of what was NOT generated and why:
- Files Not Generated table (file, reason, responsible stage, priority)
- Features Partially Migrated table (feature, % complete, missing, action)
- Angular Constructs With No Next.js Equivalent table
- Recommended Re-Run Targets (ordered list)

### HITL Gate: Human Review Required
```
WARNING: HUMAN REVIEW REQUIRED — DO NOT AUTO-APPROVE

The following documents have been prepared for MKB ingestion. A human must
review and approve each before the MKB is updated:

1. mkb/angular-nextjs-patterns.md    — New/updated patterns guide
2. mkb/angular-nextjs-risks.md       — Updated risk register
3. mkb/stage-prompt-improvements.md  — Prompt improvement proposals
4. mkb/architecture-decisions-log.md — ADR log
5. mkb/completeness-gap-report.md    — Gap report

The orchestrator will NOT write these to the MKB automatically.
A HITL approval gate is required per project policy (feedback_no_extra_cost.md).
```

## Output Format
Return a single Markdown document containing all 5 documents as sections
delimited by `---` separators, followed by the HITL gate notice.
Be specific and actionable in all recommendations.
"""

    def _prompt_equivalence_fix_group(
        self,
        group_label: str,
        description: str,
        existing_code: str,
        assemble_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: Equivalence Fix — {group_label}

## Role
You are a senior Next.js 15 engineer performing a targeted equivalence correction
pass on the Send2 migration.  Your goal is to fix a specific category of Angular
→ Next.js translation issues in the already-generated code.

## Fix Group: {group_label}
{description}

## Existing Generated Code
{existing_code[:10000]}

## Assemble Stage Summary
{assemble_output[:2000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Requirements
1. Apply ONLY the fixes described in the fix-group description above.
2. Do NOT refactor unrelated code — minimal diff principle.
3. Preserve all TypeScript types, prop names, and import paths unless they are
   the direct cause of the equivalence issue being fixed.
4. Every modified file MUST be emitted as a complete ### FILE: block.
5. If a file does not need changes, do NOT include it in the output.

## Output Format
Return ONLY ### FILE: blocks.  No explanatory prose outside file blocks.
Each block format:
### FILE: src/path/to/file.tsx
<full file content>
"""

    @staticmethod
    def _prompt_equivalence_audit(
        legacy_ctx: str,
        generated_ctx: str,
        assemble_output: str,
        mkb_ctx: str,
    ) -> str:
        return f"""
You are the Equivalence Audit Agent for the Send2 Angular→Next.js migration.
Golden Rule: find every functional mismatch between the Angular source and the generated Next.js app.

TASK:
Produce a Functional Equivalence Audit Report with these 5 sections:

## 1. LEGACY FEATURE INVENTORY
For each page/component in Angular list:
- Component name | Route | API calls | Key conditional logic | Navigation flows

## 2. GENERATED FEATURE INVENTORY
Same structure for the generated Next.js pages and components.

## 3. MISMATCH TABLE
| Feature | Angular Behavior | Generated Behavior | Mismatch Type | Severity |

Mismatch Types:
- INVENTED_LOGIC: present in generated but NOT in Angular (added logic that does not exist)
- MISSING_FEATURE: present in Angular but NOT in generated (feature dropped)
- BEHAVIOR_DRIFT: present in both but behaves differently (wrong condition, wrong API param, wrong route)
- UI_MISMATCH: layout or visual difference only

Severity levels:
- CRITICAL: core user flow broken or data corrupted
- HIGH: feature unusable or major flow incorrect
- MEDIUM: degraded UX but workaround exists
- LOW: cosmetic or minor difference

## 4. ACTION ITEMS
For each CRITICAL or HIGH mismatch:
- File to fix
- Exact change needed (add/remove/replace what)
- Angular source reference (component and method)

## 5. SUMMARY
- Total pages in Angular vs total pages in generated
- Mismatch counts by type and severity
- Overall equivalence score (0-100%)
- Go / No-Go recommendation with rationale

STRICT ANALYSIS RULES:
- INVENTED_LOGIC is always CRITICAL or HIGH — generated app must NEVER add logic absent from Angular.
- Flag every navigation decision, API call trigger, conditional branch, state check that differs.
- Do NOT give benefit of the doubt. Flag anything that differs, even if it seems reasonable.
- "It seems reasonable to add" is NOT a valid reason. Only Angular source evidence matters.

ASSEMBLE STAGE OUTPUT (directory structure):
{assemble_output[:3000]}

ANGULAR SOURCE CONTEXT:
{legacy_ctx}

GENERATED NEXT.JS SOURCE:
{generated_ctx}

{mkb_ctx}
""".strip()

    def _prompt_ui_layout_match_group(
        self,
        group_label: str,
        description: str,
        angular_templates: str,
        existing_nextjs: str,
        mkb_ctx: str,
    ) -> str:
        return f"""# Task: UI Layout Match — {group_label}

## Role
You are a senior Next.js 15 / Tailwind CSS engineer performing a visual layout
alignment pass on the Send2 migration.  The Angular 17 HTML templates are the
source of truth for visual structure.  You must make the generated Next.js
components match the Angular originals as closely as possible.

## Layout Group: {group_label}
{description}

## Angular HTML Templates (source of truth)
{angular_templates[:8000]}

## Current Generated Next.js Components
{existing_nextjs[:8000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## Requirements
1. Translate Angular template structure (flex/grid layout, element hierarchy,
   CSS classes) into equivalent Tailwind CSS + JSX in the Next.js component.
2. Replace Angular-specific directives (*ngIf, *ngFor, [(ngModel)]) with React
   equivalents (conditional rendering, Array.map, controlled inputs).
3. Preserve all existing TypeScript types, hook calls, and import paths.
4. Do NOT change business logic — only layout/visual structure.
5. Output ONLY ### FILE: blocks for files that changed.

## Output Format
Return ONLY ### FILE: blocks.  No prose outside file blocks.
### FILE: src/app/(group)/component.tsx
<full updated component>
"""

    def _prompt_report(self, outputs: dict, mkb_ctx: str) -> str:
        stage_summary = "\n".join(
            f"- **{k}**: {str(v)[:180]}..." if len(str(v)) > 180 else f"- **{k}**: {v}"
            for k, v in outputs.items()
        )
        run_date = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
        return f"""# Task: Generate Final Migration Run Report

## Role
You are a technical program manager summarising the complete Send2 Angular 17
to Next.js 15 migration pipeline run for stakeholder review.

## Stage Outputs Summary
{stage_summary[:6000]}

## Prior Knowledge (MKB)
{mkb_ctx}

## What to Produce

### 1. Executive Summary (1 page)
Non-technical summary covering: what was migrated (Send2 Angular 17 to Next.js 15
App Router), stages run successfully, files generated, overall migration
readiness score (from validation.5layer), key remaining risks, recommended
next steps.

### 2. Stage-by-Stage Results Table
| Stage | Status | Key Output | Files Generated | Issues Found |
(Cover all 33 stages: extract.inventory through report. Fill in actual numbers
from stage outputs. Use COMPLETE/PARTIAL/FAILED status.)

### 3. Files Generated Summary
Total TypeScript/TSX files / test files / configuration files / mock files.
Grand total.

### 4. Migration Readiness Assessment
Overall score (from validation.5layer), blocking issues count, non-blocking
issues count, estimated effort to resolve blocking issues, and a
Go/No-Go/Conditional Go recommendation.

### 5. Quality Metrics
| Metric | Target | Achieved | Status |
(TypeScript strict coverage 100%, test file count >=15, `any` usage 0,
route coverage 100%, missing critical files 0)

### 6. Recommended Next Steps
1. Immediately (before PR merge): fix all blocking validation issues
2. Before staging: `pnpm build` with 0 TypeScript errors
3. Before production cutover: Playwright E2E suite from dualrun.plan
4. After first deployment: Lighthouse CI monitoring
5. Next sprint: non-blocking validation issues
6. Future runs: apply MKB feedback loop proposals after HITL approval

### 7. Artefact Locations
Stage outputs in `<run_dir>/<stage-name>.md`, file manifests in
`<run_dir>/<stage-name>.files.json`, summary in `<run_dir>/summary.json`,
generated app in `generated/`.

### 8. Sign-Off
```
Migration Pipeline Run Report
Date: {run_date}
Pipeline Version: orchestrator_web.py (Next.js 15 / Angular 17)
Stages Completed: XX / 33
Overall Status: [COMPLETE / PARTIAL / FAILED]

This report was generated automatically by the migration orchestrator.
Human review required before MKB updates are applied (see feedback.loop stage).
```

## Output Format
Return a single Markdown document with all 8 sections. Fill in actual numbers
from stage outputs wherever available; use "TBD" only where information is
genuinely unavailable from the provided context.
"""


# ---------------------------------------------------------------------------
# SECTION 14 — AUP Extraction (phase1_extract)
# ---------------------------------------------------------------------------

# Angular-specific ArtifactSpec definitions for Phase 1/2.
# Parity: orchestrator 1.py PHASE12_REQUIRED_ARTIFACTS (adapted for Angular/TypeScript)

@dataclass
class ArtifactSpec:
    """Describes one class of artifact to look for in the Angular source tree."""
    artifact_id: str
    artifact: str
    category: str
    purpose: str
    usage: str
    agents: list[str]
    path_patterns: list[re.Pattern]
    content_patterns: list[re.Pattern]


PHASE12_REQUIRED_ARTIFACTS: list[ArtifactSpec] = [
    ArtifactSpec(
        artifact_id="source.application_code",
        artifact="Application source code (TypeScript/HTML/SCSS)",
        category="source",
        purpose="Primary carrier of business logic",
        usage="Parse/understand logic and generate equivalent Next.js target code",
        agents=["Discovery", "Comprehension", "Code Generation"],
        path_patterns=[re.compile(r"\.(ts|tsx|js|jsx|html|scss|css)$", re.IGNORECASE)],
        content_patterns=[],
    ),
    ArtifactSpec(
        artifact_id="source.angular_modules",
        artifact="Angular NgModule definitions",
        category="source",
        purpose="Dependency injection boundaries and lazy-load entry points",
        usage="Map NgModules to Next.js App Router route groups",
        agents=["Discovery", "Architecture"],
        path_patterns=[re.compile(r"\.module\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"@NgModule\s*\(", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.angular_components",
        artifact="Angular component definitions",
        category="source",
        purpose="UI building blocks with lifecycle hooks and template bindings",
        usage="Convert to React Server/Client Components",
        agents=["Discovery", "Comprehension", "Code Generation"],
        path_patterns=[re.compile(r"\.component\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"@Component\s*\(", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.angular_services",
        artifact="Angular injectable services",
        category="source",
        purpose="Business logic, HTTP calls, state management",
        usage="Convert to TanStack Query hooks and Zustand stores",
        agents=["Discovery", "Comprehension", "Architecture"],
        path_patterns=[re.compile(r"\.service\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"@Injectable\s*\(", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.routing",
        artifact="Angular routing configuration",
        category="source",
        purpose="Application navigation graph and lazy-load boundaries",
        usage="Map to Next.js App Router file-system routing",
        agents=["Discovery", "Architecture"],
        path_patterns=[re.compile(r"(routing|routes?)\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(Routes|RouterModule|loadChildren|loadComponent)", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.state_management",
        artifact="State management (NgRx/NGXS/BehaviorSubject)",
        category="source",
        purpose="Application-level shared state patterns",
        usage="Convert to Zustand stores",
        agents=["Discovery", "Architecture"],
        path_patterns=[re.compile(r"\.(store|reducer|effect|action|selector)\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(createReducer|createAction|createEffect|BehaviorSubject|@State)", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.http_interceptors",
        artifact="HTTP interceptors and API clients",
        category="source",
        purpose="Auth headers, error handling, request/response transforms",
        usage="Replace with Next.js API route middleware and fetch wrappers",
        agents=["Discovery", "Architecture"],
        path_patterns=[re.compile(r"(interceptor|api[-_]?client|http[-_]?client)\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(HttpInterceptor|intercept\(req|HttpClient)", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.guards",
        artifact="Route guards and canActivate logic",
        category="source",
        purpose="Auth and feature-flag enforcement on navigation",
        usage="Convert to Next.js middleware.ts and layout-level auth checks",
        agents=["Discovery", "Architecture"],
        path_patterns=[re.compile(r"\.(guard|auth[-_]?guard)\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(CanActivate|canActivate|CanDeactivate|inject\()", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.pipes_directives",
        artifact="Angular pipes and structural directives",
        category="source",
        purpose="Template transformation and DOM manipulation helpers",
        usage="Convert to React utility functions and custom hooks",
        agents=["Discovery", "Comprehension"],
        path_patterns=[re.compile(r"\.(pipe|directive)\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(@Pipe|@Directive)\s*\(", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.config",
        artifact="Configuration and environment files",
        category="source",
        purpose="Environment-specific API URLs, feature flags, tokens",
        usage="Map to .env.local and next.config.js",
        agents=["Discovery", "Architecture"],
        path_patterns=[
            re.compile(r"(environment|\.env|app\.config|tsconfig|angular\.json).*\.(ts|json|js)$", re.IGNORECASE)
        ],
        content_patterns=[],
    ),
    ArtifactSpec(
        artifact_id="source.build_manifests",
        artifact="Build scripts and dependency manifests",
        category="source",
        purpose="Dependencies, versions, build topology",
        usage="Map/upgrade Angular dependencies to Next.js equivalents",
        agents=["Discovery", "Architecture"],
        path_patterns=[
            re.compile(r"(package\.json|angular\.json|tsconfig.*\.json|\.eslintrc|jest\.config)$", re.IGNORECASE)
        ],
        content_patterns=[],
    ),
    ArtifactSpec(
        artifact_id="source.templates",
        artifact="Angular HTML templates",
        category="source",
        purpose="UI structure, data bindings, Angular directives",
        usage="Convert to JSX/TSX React components",
        agents=["Comprehension", "Code Generation"],
        path_patterns=[re.compile(r"\.html$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(\*ngIf|\*ngFor|\[(ngModel|formControl)\]|\(click\)|ng-container)", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.styles",
        artifact="SCSS/CSS stylesheets",
        category="source",
        purpose="Visual design tokens, component styles, global resets",
        usage="Convert variables to Tailwind CSS config; adapt component styles",
        agents=["Comprehension", "Code Generation"],
        path_patterns=[re.compile(r"\.(scss|css|less)$", re.IGNORECASE)],
        content_patterns=[],
    ),
    ArtifactSpec(
        artifact_id="source.models_interfaces",
        artifact="TypeScript models, interfaces, and DTOs",
        category="source",
        purpose="Data contracts between layers",
        usage="Port directly to shared TypeScript types in Next.js project",
        agents=["Comprehension", "Code Generation"],
        path_patterns=[re.compile(r"\.(model|interface|dto|type)\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(export\s+(interface|type|class)\s)", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="source.tests",
        artifact="Unit and integration tests",
        category="source",
        purpose="Behavior specification and regression baseline",
        usage="Port to Vitest; use as equivalence oracle",
        agents=["Validation"],
        path_patterns=[re.compile(r"\.spec\.ts$", re.IGNORECASE)],
        content_patterns=[],
    ),
    ArtifactSpec(
        artifact_id="runtime.api_calls",
        artifact="HTTP API call sites",
        category="runtime",
        purpose="All outbound REST/GraphQL calls and their URL patterns",
        usage="Map to Next.js server actions and TanStack Query hooks",
        agents=["Discovery", "Architecture"],
        path_patterns=[re.compile(r"\.service\.ts$", re.IGNORECASE)],
        content_patterns=[re.compile(r"this\.http\.(get|post|put|delete|patch)\s*\(", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="data.schemas",
        artifact="API response schemas and data models",
        category="data",
        purpose="Data structure contracts from backend",
        usage="Generate TypeScript interfaces and Zod validation schemas",
        agents=["Data Migration", "Comprehension"],
        path_patterns=[re.compile(r"\.(schema|swagger|openapi)\.(json|yaml|yml|ts)$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(\$schema|openapi|swagger|components)", re.IGNORECASE)],
    ),
    ArtifactSpec(
        artifact_id="docs.requirements",
        artifact="Requirements and specification docs",
        category="docs",
        purpose="Functional requirements and acceptance criteria",
        usage="Validate migration completeness",
        agents=["Comprehension"],
        path_patterns=[re.compile(r"\.(md|txt|docx?)$", re.IGNORECASE)],
        content_patterns=[re.compile(r"(requirement|acceptance|shall|must|feature|user story)", re.IGNORECASE)],
    ),
]


def _matches_spec(path: Path, rel: str, spec: "ArtifactSpec", text_cache: dict) -> bool:
    """Return True if *path* satisfies the path_patterns (and content_patterns if any).

    Parity: orchestrator 1.py ``_matches_spec()``.
    """
    rel_lower = rel.lower()
    if any(pattern.search(rel_lower) for pattern in spec.path_patterns):
        if not spec.content_patterns:
            return True
        try:
            text = text_cache.setdefault(rel, path.read_text(encoding="utf-8", errors="replace")[:12000])
        except Exception:
            return False
        return any(pattern.search(text) for pattern in spec.content_patterns)

    # Also check content patterns for text-based files even if path doesn't match
    if spec.content_patterns and path.suffix.lower() in {".ts", ".html", ".json", ".yaml", ".yml", ".md", ".txt"}:
        try:
            text = text_cache.setdefault(rel, path.read_text(encoding="utf-8", errors="replace")[:12000])
        except Exception:
            return False
        return any(pattern.search(text) for pattern in spec.content_patterns)
    return False


def _infer_migration_pattern(source_file_count: int, runtime_found: int) -> str:
    """Recommend a migration strategy based on project scale.

    Parity: orchestrator 1.py ``_infer_migration_pattern()``.
    """
    if source_file_count > 1500 or runtime_found > 0:
        return "strangler_fig"
    if source_file_count > 500:
        return "branch_by_abstraction"
    return "rewrite_modular_monolith"


def _effort_band(score: int) -> str:
    """Map a numeric risk score to a T-shirt size effort band.

    Parity: orchestrator 1.py ``_effort_band()``.
    """
    if score >= 18:
        return "XL"
    if score >= 12:
        return "L"
    if score >= 7:
        return "M"
    return "S"


def render_aup_markdown(aup: dict) -> str:
    """Render an AUP dict as a human-readable Markdown document.

    Parity: orchestrator 1.py ``render_aup_markdown()``.
    """
    lines = [
        "# Application Understanding Package (AUP)",
        "",
        f"- Generated at: {aup['generated_at']}",
        f"- Source root: `{aup['source_root']}`",
        f"- Scanned files: {aup['scanned_files']} (limit {aup['scan_file_limit']})",
        f"- Coverage: {aup['coverage_percent']}%",
        "",
        "## Artifact Inventory",
        "",
        "| Artifact ID | Artifact | Category | Count | Status | Agents |",
        "|---|---|---|---:|---|---|",
    ]
    for item in aup["artifact_inventory"]:
        cov = aup["coverage"][item["artifact_id"]]["status"]
        agents = ", ".join(item["agents_involved"])
        lines.append(
            f"| {item['artifact_id']} | {item['artifact']} | {item['category']}"
            f" | {item['count']} | {cov} | {agents} |"
        )

    lines.extend(["", "## Missing Artifact Classes", ""])
    if aup["missing_artifact_classes"]:
        for item in aup["missing_artifact_classes"]:
            lines.append(f"- `{item}`")
    else:
        lines.append("- None")

    lines.extend(
        [
            "",
            "## Risk and Complexity",
            "",
            f"- Risk score: {aup['risk_and_complexity_assessment']['risk_score']}",
            f"- Effort band: {aup['risk_and_complexity_assessment']['effort_band']}",
            f"- Recommended pattern: `{aup['recommended_migration_pattern']}`",
            "",
            "## Technology Snapshot",
            "",
            "```json",
            json.dumps(aup["dependency_and_integration_map_seed"], indent=2),
            "```",
        ]
    )
    return "\n".join(lines)


def validate_aup(aup: dict) -> dict:
    """Validate AUP completeness. Returns a dict with validation flags.

    Parity: orchestrator 1.py ``validate_aup()``.
    """
    required_ids = {spec.artifact_id for spec in PHASE12_REQUIRED_ARTIFACTS}
    got_ids = {item["artifact_id"] for item in aup.get("artifact_inventory", [])}
    missing_defs = sorted(required_ids - got_ids)
    missing_covered = sorted(
        item["artifact_id"]
        for item in aup.get("artifact_inventory", [])
        if item.get("count", 0) <= 0
    )
    return {
        "has_all_required_definitions": len(missing_defs) == 0,
        "missing_definition_ids": missing_defs,
        "missing_coverage_ids": missing_covered,
        "is_actionable_for_phase2": len(missing_defs) == 0,
    }


async def phase1_extract_aup(args: argparse.Namespace) -> None:
    """Extract Angular Universal Profile from source codebase.

    Scans *args.source_root*, builds a structured artifact inventory across all
    PHASE12_REQUIRED_ARTIFACTS categories, computes coverage and risk metrics,
    then writes:
      - <artifacts_dir>/phase1-discovery/aup.json  -- machine-readable AUP
      - <artifacts_dir>/phase1-discovery/aup.md    -- human-readable summary
    Also writes the AUP to the MKB for downstream stage retrieval.

    Parity: orchestrator 1.py ``phase1_extract_aup()`` + ``_main()`` phase1 dispatch.
    """
    if not args.source_root:
        raise ValueError("--source-root is required for --phase phase1_extract")

    source_root = Path(args.source_root)
    if not source_root.exists() or not source_root.is_dir():
        raise FileNotFoundError(f"Source root not found or not a directory: {source_root}")

    artifacts_dir = Path(args.artifacts_dir)
    phase1_dir = artifacts_dir / "phase1-discovery"
    phase1_dir.mkdir(parents=True, exist_ok=True)

    exclude_dirs: set = {
        d.strip()
        for d in getattr(
            args, "exclude_dirs",
            "node_modules,.angular,dist,.next,coverage,.git"
        ).split(",")
        if d.strip()
    }
    max_files: int = getattr(args, "phase1_max_files", 5000)

    print(f"[phase1_extract] Scanning {source_root} (max {max_files} files) ...", flush=True)
    scan_files = _discover_all_files(source_root, exclude_dirs=exclude_dirs, max_files=max_files)

    text_cache: dict = {}
    by_spec: dict = {spec.artifact_id: [] for spec in PHASE12_REQUIRED_ARTIFACTS}

    for path in scan_files:
        rel = str(path.relative_to(source_root))
        for spec in PHASE12_REQUIRED_ARTIFACTS:
            if _matches_spec(path, rel, spec, text_cache):
                by_spec[spec.artifact_id].append(rel)

    # Component/language breakdown from application source files
    source_code_spec = next(
        spec for spec in PHASE12_REQUIRED_ARTIFACTS if spec.artifact_id == "source.application_code"
    )
    source_code_files = by_spec[source_code_spec.artifact_id]
    component_counts: Counter = Counter()
    language_counts: Counter = Counter()
    for rel in source_code_files:
        parts = rel.replace("\\", "/").split("/")
        component = "/".join(parts[:2]) if len(parts) >= 2 else parts[0]
        component_counts[component] += 1
        language_counts[Path(rel).suffix.lower()] += 1

    inventory: list = []
    coverage: dict = {}
    missing: list = []

    for spec in PHASE12_REQUIRED_ARTIFACTS:
        examples = sorted(set(by_spec[spec.artifact_id]))[:20]
        count = len(by_spec[spec.artifact_id])
        status = "covered" if count > 0 else "missing"
        if status == "missing":
            missing.append(spec.artifact_id)
        coverage[spec.artifact_id] = {"status": status, "count": count}
        inventory.append(
            {
                "artifact_id": spec.artifact_id,
                "artifact": spec.artifact,
                "category": spec.category,
                "purpose": spec.purpose,
                "what_we_do_with_it": spec.usage,
                "agents_involved": spec.agents,
                "count": count,
                "examples": examples,
            }
        )

    coverage_pct = round(
        ((len(PHASE12_REQUIRED_ARTIFACTS) - len(missing)) / len(PHASE12_REQUIRED_ARTIFACTS)) * 100.0, 2
    )
    risk_score = (
        len(missing)
        + (2 if len(source_code_files) > 1000 else 0)
        + (2 if len(component_counts) > 20 else 0)
    )
    runtime_count = sum(coverage[k]["count"] for k in coverage if k.startswith("runtime."))

    aup: dict = {
        "phase": "phase1_extract",
        "generated_at": datetime.now(UTC).isoformat(),
        "source_root": str(source_root),
        "scan_file_limit": max_files,
        "scanned_files": len(scan_files),
        "artifact_inventory": inventory,
        "coverage": coverage,
        "coverage_percent": coverage_pct,
        "missing_artifact_classes": missing,
        "business_rule_catalog_seed": [
            "Seed generated from discovery/comprehension outputs and static code analysis.",
            "Human SME validation required before downstream architecture and code generation.",
        ],
        "dependency_and_integration_map_seed": {
            "source_file_count": len(source_code_files),
            "component_counts": dict(component_counts.most_common(50)),
            "language_counts": dict(language_counts),
        },
        "technology_stack_analysis": {
            "languages_detected": dict(language_counts),
            "build_manifest_count": coverage["source.build_manifests"]["count"],
            "configuration_count": coverage["source.config"]["count"],
            "angular_modules": coverage["source.angular_modules"]["count"],
            "angular_components": coverage["source.angular_components"]["count"],
            "angular_services": coverage["source.angular_services"]["count"],
            "routing_files": coverage["source.routing"]["count"],
        },
        "risk_and_complexity_assessment": {
            "risk_score": risk_score,
            "effort_band": _effort_band(risk_score),
            "drivers": [
                f"missing_artifact_classes={len(missing)}",
                f"source_components={len(component_counts)}",
                f"source_files={len(source_code_files)}",
            ],
        },
        "recommended_migration_pattern": _infer_migration_pattern(len(source_code_files), runtime_count),
        "initial_effort_estimate": {
            "mwu_hint": max(3, min(40, len(component_counts) + max(1, len(source_code_files) // 120))),
            "notes": "Refine after Phase 2 decomposition and SME confirmation.",
        },
    }

    # Write JSON artifact
    aup_json_path = phase1_dir / "aup.json"
    aup_json_path.write_text(json.dumps(aup, indent=2), encoding="utf-8")

    # Write Markdown summary
    aup_md_path = phase1_dir / "aup.md"
    aup_md_path.write_text(render_aup_markdown(aup), encoding="utf-8")

    # Write to MKB for downstream stage retrieval
    mkb = MigrationKnowledgeBase(Path(args.mkb_dir))
    mkb.write_document(
        doc_type="aup",
        stage="phase1_extract",
        content=render_aup_markdown(aup),
        metadata={
            "coverage_percent": coverage_pct,
            "scanned_files": len(scan_files),
            "effort_band": aup["risk_and_complexity_assessment"]["effort_band"],
        },
    )

    validation = validate_aup(aup)
    print(
        json.dumps(
            {
                "status": "ok",
                "phase": "phase1_extract",
                "aup_json_path": str(aup_json_path),
                "aup_md_path": str(aup_md_path),
                "coverage_percent": coverage_pct,
                "missing_artifact_classes": missing,
                "validation": validation,
            },
            indent=2,
        )
    )


# ---------------------------------------------------------------------------
# SECTION 15 -- MEP Planning (phase2_plan)
# ---------------------------------------------------------------------------

def render_mep_markdown(mep: dict) -> str:
    """Render a MEP dict as a human-readable Markdown document.

    Parity: orchestrator 1.py ``render_mep_markdown()``.
    """
    lines = [
        "# Migration Execution Plan (MEP)",
        "",
        f"- Generated at: {mep['generated_at']}",
        f"- Target platform: `{mep['target_state_definition']['target_platform']}`",
        f"- Total MWUs: {mep['resource_and_timeline_projection']['total_mwus']}",
        f"- Effort band: {mep['resource_and_timeline_projection']['effort_band']}",
        "",
        "## MWU Backlog",
        "",
        "| MWU | Component | File Estimate | Tier | Sequence | HITL |",
        "|---|---|---:|---|---:|---|",
    ]
    for mwu in mep["mwu_backlog"]:
        lines.append(
            f"| {mwu['mwu_id']} | {mwu['component']} | {mwu['scope_file_estimate']}"
            f" | {mwu['complexity_tier']} | {mwu['sequence']} | {mwu['hitl_required']} |"
        )

    lines.extend(["", "## HITL Checkpoints", ""])
    for item in mep["hitl_checkpoint_schedule"]:
        lines.append(f"- {item}")

    lines.extend(["", "## Risk Mitigation", ""])
    for item in mep.get("risk_mitigation_plan", []):
        lines.append(f"- {item}")

    return "\n".join(lines)


async def phase2_plan_mep(args: argparse.Namespace) -> None:
    """Generate Migration Execution Plan from AUP.

    Reads the AUP from <artifacts_dir>/phase1-discovery/aup.json (or generates
    one on the fly when --source-root is provided and the file is absent), then
    produces a detailed MEP with MWU backlog, sequencing, HITL checkpoints, and
    risk mitigation notes.

    Writes:
      - <artifacts_dir>/phase2-planning/mep.json  -- machine-readable MEP
      - <artifacts_dir>/phase2-planning/mep.md    -- human-readable summary

    Parity: orchestrator 1.py ``phase2_build_mep()`` + ``_main()`` phase2 dispatch.
    """
    artifacts_dir = Path(args.artifacts_dir)
    aup_json_path = artifacts_dir / "phase1-discovery" / "aup.json"

    # Load or generate AUP
    if aup_json_path.exists():
        aup: dict = json.loads(aup_json_path.read_text(encoding="utf-8"))
        print(f"[phase2_plan] Loaded AUP from {aup_json_path}", flush=True)
    elif args.source_root:
        print("[phase2_plan] AUP not found -- running phase1_extract first ...", flush=True)
        await phase1_extract_aup(args)
        aup = json.loads(aup_json_path.read_text(encoding="utf-8"))
    else:
        raise FileNotFoundError(
            f"AUP not found at {aup_json_path}. "
            "Provide --source-root to generate it automatically, or run phase1_extract first."
        )

    component_counts: dict = (
        aup.get("dependency_and_integration_map_seed", {}).get("component_counts", {})
    )
    if not component_counts:
        component_counts = {".": aup.get("dependency_and_integration_map_seed", {}).get("source_file_count", 0)}

    tier_map: dict = {
        "low":    {"llm_tier": "fast",     "hitl_depth": "standard"},
        "medium": {"llm_tier": "balanced", "hitl_depth": "enhanced"},
        "high":   {"llm_tier": "deep",     "hitl_depth": "mandatory_architect_review"},
    }

    mwus: list = []
    for idx, (component, count) in enumerate(
        sorted(component_counts.items(), key=lambda x: x[1], reverse=True), start=1
    ):
        complexity = "high" if count >= 120 else "medium" if count >= 40 else "low"
        mwus.append(
            {
                "mwu_id": f"MWU-{idx:03d}",
                "component": component,
                "scope_file_estimate": count,
                "complexity_tier": complexity,
                "sequence": idx,
                "agents": [
                    "Discovery",
                    "Comprehension",
                    "Architecture",
                    "Decomposition",
                    "Code Generation",
                    "Validation",
                ],
                "hitl_required": True,
                "acceptance_criteria": [
                    "Functional equivalence tests pass",
                    "No enhancement/refactor beyond approved scope",
                    "Traceability matrix entries complete",
                ],
            }
        )

    missing = aup.get("missing_artifact_classes", [])

    mep: dict = {
        "phase": "phase2_plan",
        "generated_at": datetime.now(UTC).isoformat(),
        "source_root": aup.get("source_root"),
        "target_state_definition": {
            "target_platform": "nextjs15_react19_typescript",
            "architecture_patterns": ["strangler_fig", "branch_by_abstraction", "modular_monolith"],
            "nfr_focus": ["performance", "scalability", "security", "observability", "reliability"],
            "coding_standards": [
                "equivalence_before_enhancement",
                "traceable_rule_to_test_mapping",
                "small_mwu_merge_units",
            ],
        },
        "comprehension_input_preparation": {
            "chunking_strategy": {
                "max_files": getattr(args, "max_files", 200),
                "chunk_chars": getattr(args, "chunk_chars", 4000),
            },
            "cross_reference_enrichment": [
                "attach Angular template + service pairs to each component MWU chunk",
                "attach incident history for high-risk components",
            ],
            "ambiguity_flagging_protocol": (
                "Agents must emit explicit UNKNOWN sections; humans resolve before downstream consumption."
            ),
        },
        "codegen_pattern_library": {
            "target_code_exemplars": "Provide approved Next.js 15 App Router examples by layer (page, component, hook, service).",
            "transformation_rule_templates": "Store Angular->React transformation rules per component type in versioned templates.",
            "anti_pattern_blacklist": [
                "silent behavior changes",
                "unapproved framework swaps",
                "hidden feature additions",
            ],
            "framework_boilerplate": "Generate from reviewed Next.js 15 starter templates only.",
        },
        "test_oracle_preparation": {
            "golden_dataset_required": True,
            "expected_behavior_docs_required": True,
            "performance_baseline_required": True,
        },
        "mwu_backlog": mwus,
        "dependency_sequencing_rule": (
            "Migrate foundational/shared components before leaf feature components. "
            "Core services and types before feature modules."
        ),
        "parallel_execution_plan": {
            "independent_mwus": [m["mwu_id"] for m in mwus if m["complexity_tier"] == "low"][:8],
            "serialized_mwus": [m["mwu_id"] for m in mwus if m["complexity_tier"] == "high"][:8],
        },
        "agent_configuration_by_tier": tier_map,
        "hitl_checkpoint_schedule": [
            "Checkpoint A: AUP completeness and artifact gaps signed-off",
            "Checkpoint B: Rulebook approval before architecture/codegen",
            "Checkpoint C: Each MWU PR approval before merge",
            "Checkpoint D: Phase validation sign-off before rollout",
        ],
        "risk_mitigation_plan": [
            "For each missing artifact class, create explicit acquisition task before related MWUs.",
            "Route high-complexity MWUs to deeper model tier + mandatory architect review.",
            "Enforce dual-run and traceability for business-critical flows.",
            "Run pnpm build gate after every codegen stage; auto-repair TypeScript errors via build gate loop.",
        ],
        "resource_and_timeline_projection": {
            "total_mwus": len(mwus),
            "effort_band": aup.get("risk_and_complexity_assessment", {}).get("effort_band", "M"),
            "blocking_gaps": missing,
        },
    }

    # Write outputs
    phase2_dir = artifacts_dir / "phase2-planning"
    phase2_dir.mkdir(parents=True, exist_ok=True)

    mep_json_path = phase2_dir / "mep.json"
    mep_json_path.write_text(json.dumps(mep, indent=2), encoding="utf-8")

    mep_md_path = phase2_dir / "mep.md"
    mep_md_path.write_text(render_mep_markdown(mep), encoding="utf-8")

    print(
        json.dumps(
            {
                "status": "ok",
                "phase": "phase2_plan",
                "aup_json_path": str(aup_json_path),
                "mep_json_path": str(mep_json_path),
                "mep_md_path": str(mep_md_path),
                "total_mwus": len(mwus),
                "effort_band": mep["resource_and_timeline_projection"]["effort_band"],
                "blocking_gaps": missing,
            },
            indent=2,
        )
    )


# ---------------------------------------------------------------------------
# SECTION 16 -- Phase Gate Check
# ---------------------------------------------------------------------------

def _read_json_if_exists(path: Path) -> "dict | None":
    """Read and parse a JSON file, returning None if missing or malformed."""
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _read_text_if_exists(path: Path) -> str:
    """Read a text file, returning empty string if missing."""
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _is_nontrivial_content(text: str, min_chars: int = 120) -> bool:
    """Return True if *text* looks like a real agent output (not an error stub)."""
    stripped = (text or "").strip()
    if len(stripped) < min_chars:
        return False
    lowered = stripped.lower()
    bad_markers = [
        "reached max turns",
        "prompt is too long",
        "invocation failed",
        "would you like me to write this to",
        "file write was blocked by permissions",
    ]
    return not any(marker in lowered for marker in bad_markers)


def phase_gate_check(args: argparse.Namespace) -> None:
    """Check pipeline phase completion status and output a pass/fail report.

    Reads artifact directories under <artifacts_dir> and AUP/MEP JSON files,
    then evaluates five phase gates:
      - Phase 1: AUP coverage + discovery artifacts
      - Phase 2: MEP MWU backlog + architecture/decomposition artifacts
      - Phase 3: codegen + feature artifacts
      - Phase 4: validation + dualrun equivalence
      - Phase 5: orchestrator report with rollback section

    Writes the gate report to <artifacts_dir>/logs/phase_gate.json and prints
    a JSON summary to stdout.  Exits with code 2 if --gate-strict is set and
    any gate is blocked.

    Parity: orchestrator 1.py ``evaluate_phase_gates()`` + ``run_phase_gate_check()``.
    """
    artifacts_dir = Path(args.artifacts_dir)

    aup = _read_json_if_exists(artifacts_dir / "phase1-discovery" / "aup.json")
    mep = _read_json_if_exists(artifacts_dir / "phase2-planning" / "mep.json")

    gate_min_aup_coverage: float = float(getattr(args, "gate_min_aup_coverage", 70.0))
    gate_require_dual_run: bool = bool(getattr(args, "gate_require_dual_run", False))
    gate_require_data_validation: bool = bool(getattr(args, "gate_require_data_validation", False))
    gate_strict: bool = bool(getattr(args, "gate_strict", False))

    dual_run_report_path = artifacts_dir / "phase4-validation" / "dualrun.compare.json"
    data_validate_report_path = artifacts_dir / "phase4-validation" / "data.validation.json"

    def exists_nontrivial(subdir: str, filename: str, min_chars: int = 120):
        p = artifacts_dir / subdir / filename
        text = _read_text_if_exists(p)
        return _is_nontrivial_content(text, min_chars=min_chars), str(p)

    gates: list = []

    # -- Phase 1 gate ----------------------------------------------------------
    p1_reasons: list = []
    p1_ok = True
    if not aup:
        p1_ok = False
        p1_reasons.append(f"Missing AUP JSON: {artifacts_dir / 'phase1-discovery' / 'aup.json'}")
    else:
        cov = float(aup.get("coverage_percent", 0))
        if cov < gate_min_aup_coverage:
            p1_ok = False
            p1_reasons.append(f"AUP coverage_percent {cov} < required {gate_min_aup_coverage}")
        if not aup.get("artifact_inventory"):
            p1_ok = False
            p1_reasons.append("AUP artifact_inventory is empty")
    for req_file in ["extract.inventory.md", "extract.analysis.md"]:
        ok, p = exists_nontrivial("phase1-discovery", req_file)
        if not ok:
            p1_ok = False
            p1_reasons.append(f"Missing/weak artifact: {p}")
    gates.append(
        {
            "phase": "phase1_discovery_extraction",
            "passed": p1_ok,
            "reasons": p1_reasons,
            "human_actions": [
                "Review and approve AUP artifact coverage",
                "Validate discovery/comprehension outputs with SME",
            ],
        }
    )

    # -- Phase 2 gate ----------------------------------------------------------
    p2_reasons: list = []
    p2_ok = True
    if not mep:
        p2_ok = False
        p2_reasons.append(f"Missing MEP JSON: {artifacts_dir / 'phase2-planning' / 'mep.json'}")
    else:
        if not mep.get("mwu_backlog"):
            p2_ok = False
            p2_reasons.append("MEP mwu_backlog is empty")
        if not mep.get("hitl_checkpoint_schedule"):
            p2_ok = False
            p2_reasons.append("MEP hitl_checkpoint_schedule is empty")
    for req_file in ["plan.architecture.md"]:
        ok, p = exists_nontrivial("phase2-planning", req_file)
        if not ok:
            p2_ok = False
            p2_reasons.append(f"Missing/weak artifact: {p}")
    for req_file in ["extract.decomposition.md"]:
        ok, p = exists_nontrivial("phase1-discovery", req_file)
        if not ok:
            p2_ok = False
            p2_reasons.append(f"Missing/weak artifact: {p}")
    gates.append(
        {
            "phase": "phase2_planning",
            "passed": p2_ok,
            "reasons": p2_reasons,
            "human_actions": [
                "Approve MWU decomposition and sequencing",
                "Approve target-state architecture and constraints",
            ],
        }
    )

    # -- Phase 3 gate ----------------------------------------------------------
    p3_reasons: list = []
    p3_ok = True
    for req_file in ["codegen.tests.md"]:
        ok, p = exists_nontrivial("phase3-codegen", req_file)
        if not ok:
            p3_ok = False
            p3_reasons.append(f"Missing/weak artifact: {p}")
    phase3_dir = artifacts_dir / "phase3-codegen"
    feature_files = list(phase3_dir.glob("codegen.features.*.md")) if phase3_dir.exists() else []
    if len(feature_files) < 3:
        p3_ok = False
        p3_reasons.append(
            f"Too few feature codegen artifacts: found {len(feature_files)}, expected >=3"
        )
    gates.append(
        {
            "phase": "phase3_execution",
            "passed": p3_ok,
            "reasons": p3_reasons,
            "human_actions": [
                "Review generated implementation and code review findings",
                "Confirm per-MWU acceptance criteria before merge",
            ],
        }
    )

    # -- Phase 4 gate ----------------------------------------------------------
    p4_reasons: list = []
    p4_ok = True
    for req_file in ["validation.5layer.md", "dualrun.plan.md"]:
        ok, p = exists_nontrivial("phase4-validation", req_file)
        if not ok:
            p4_ok = False
            p4_reasons.append(f"Missing/weak artifact: {p}")

    if gate_require_dual_run and not dual_run_report_path.exists():
        p4_ok = False
        p4_reasons.append(f"Missing required dual-run report: {dual_run_report_path}")
    if gate_require_data_validation and not data_validate_report_path.exists():
        p4_ok = False
        p4_reasons.append(f"Missing required data validation report: {data_validate_report_path}")

    dualrun = _read_json_if_exists(dual_run_report_path)
    if gate_require_dual_run and dualrun and dualrun.get("equivalent") is False:
        p4_ok = False
        p4_reasons.append("Dual-run report shows non-equivalent outputs")
    data_val = _read_json_if_exists(data_validate_report_path)
    if gate_require_data_validation and data_val and data_val.get("validation_passed") is False:
        p4_ok = False
        p4_reasons.append("Data validation report failed")

    gates.append(
        {
            "phase": "phase4_validation_equivalence",
            "passed": p4_ok,
            "reasons": p4_reasons,
            "human_actions": [
                "Approve equivalence evidence and unresolved gaps",
                "Sign off traceability and UAT readiness",
            ],
        }
    )

    # -- Phase 5 gate ----------------------------------------------------------
    p5_reasons: list = []
    p5_ok = True
    rep_text = _read_text_if_exists(artifacts_dir / "phase5-rollout" / "report.md")
    if not _is_nontrivial_content(rep_text):
        p5_ok = False
        p5_reasons.append(str(artifacts_dir / "phase5-rollout" / "report.md") + " is missing or too short")
    if "rollback" not in rep_text.lower():
        p5_ok = False
        p5_reasons.append("report.md missing explicit rollback guidance")
    gates.append(
        {
            "phase": "phase5_rollout_handover",
            "passed": p5_ok,
            "reasons": p5_reasons,
            "human_actions": [
                "Approve rollout pattern and rollback thresholds",
                "Approve hypercare plan and operational handover",
            ],
        }
    )

    overall_passed = all(g["passed"] for g in gates)
    blocked = [g["phase"] for g in gates if not g["passed"]]

    report: dict = {
        "generated_at": datetime.now(UTC).isoformat(),
        "overall_passed": overall_passed,
        "blocked_phases": blocked,
        "gates": gates,
    }

    # Write gate report to logs/
    logs_dir = artifacts_dir / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    gate_report_path = logs_dir / "phase_gate.json"
    gate_report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(
        json.dumps(
            {
                "status": "ok" if overall_passed else "blocked",
                "phase": "phase_gate_check",
                "gate_report_path": str(gate_report_path),
                "overall_passed": overall_passed,
                "blocked_phases": blocked,
            },
            indent=2,
        )
    )

    if gate_strict and not overall_passed:
        raise SystemExit(2)


# ---------------------------------------------------------------------------
# DualRunComparator — compare Angular vs Next.js outputs for equivalence
# ---------------------------------------------------------------------------

class DualRunComparator:
    """Compares Angular 17 (legacy) and Next.js 15 (modern) outputs for equivalence.

    Supports two comparison modes:
      1. **File-based** — compares pre-captured JSON/text output files
         (same as Android parity pattern).
      2. **HTTP live** — starts both dev servers, hits a list of routes,
         and compares response bodies side-by-side (web-specific extension).

    Parity: Android ``DualRunComparator``.
    """

    @staticmethod
    def _load_json(path: Path) -> "tuple[bool, object]":
        try:
            return True, json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return False, None

    @staticmethod
    def _as_text(value: object) -> str:
        if isinstance(value, (dict, list)):
            return json.dumps(value, indent=2, sort_keys=True)
        return str(value)

    def compare_files(self, legacy_path: Path, modern_path: Path) -> dict:
        """Compare two output files (JSON or plain text).

        Parity: Android DualRunComparator.compare_files().
        """
        if not legacy_path.exists():
            raise FileNotFoundError(f"Legacy output file not found: {legacy_path}")
        if not modern_path.exists():
            raise FileNotFoundError(f"Modern output file not found: {modern_path}")

        legacy_json_ok, legacy_json = self._load_json(legacy_path)
        modern_json_ok, modern_json = self._load_json(modern_path)

        if legacy_json_ok and modern_json_ok:
            legacy_repr = self._as_text(legacy_json)
            modern_repr = self._as_text(modern_json)
            mode = "json"
        else:
            legacy_repr = legacy_path.read_text(encoding="utf-8", errors="replace")
            modern_repr = modern_path.read_text(encoding="utf-8", errors="replace")
            mode = "text"

        equivalent = legacy_repr == modern_repr
        diff = ""
        if not equivalent:
            from difflib import unified_diff
            diff = "".join(
                unified_diff(
                    legacy_repr.splitlines(keepends=True),
                    modern_repr.splitlines(keepends=True),
                    fromfile=f"legacy:{legacy_path.name}",
                    tofile=f"modern:{modern_path.name}",
                    n=3,
                )
            )

        return {
            "mode": mode,
            "legacy_path": str(legacy_path),
            "modern_path": str(modern_path),
            "equivalent": equivalent,
            "timestamp": datetime.now(UTC).isoformat(),
            "diff": diff,
        }

    def compare_routes(
        self,
        angular_base_url: str,
        nextjs_base_url: str,
        routes: list[str],
        timeout: int = 10,
    ) -> dict:
        """Hit the same routes on both live dev servers and compare responses.

        Angular app should be running at *angular_base_url* (e.g. http://localhost:4200).
        Next.js app should be running at *nextjs_base_url* (e.g. http://localhost:3000).

        Returns a per-route comparison dict and an overall ``equivalent`` flag.

        Web-specific extension — no Android parity.
        """
        import urllib.request
        import urllib.error

        def fetch(base: str, route: str) -> "tuple[int, str]":
            url = base.rstrip("/") + "/" + route.lstrip("/")
            try:
                with urllib.request.urlopen(url, timeout=timeout) as resp:
                    return resp.status, resp.read().decode("utf-8", errors="replace")
            except urllib.error.HTTPError as exc:
                return exc.code, ""
            except Exception as exc:
                return -1, str(exc)

        route_results: list[dict] = []
        all_equivalent = True

        for route in routes:
            legacy_status, legacy_body = fetch(angular_base_url, route)
            modern_status, modern_body = fetch(nextjs_base_url, route)
            status_match = legacy_status == modern_status
            body_match = legacy_body.strip() == modern_body.strip()
            equivalent = status_match and body_match

            diff = ""
            if not body_match:
                from difflib import unified_diff
                diff = "".join(
                    unified_diff(
                        legacy_body.splitlines(keepends=True),
                        modern_body.splitlines(keepends=True),
                        fromfile=f"angular:{route}",
                        tofile=f"nextjs:{route}",
                        n=2,
                    )
                )

            if not equivalent:
                all_equivalent = False

            route_results.append({
                "route": route,
                "legacy_status": legacy_status,
                "modern_status": modern_status,
                "status_match": status_match,
                "body_match": body_match,
                "equivalent": equivalent,
                "diff_preview": diff[:500] if diff else "",
            })

        return {
            "mode": "http",
            "angular_base_url": angular_base_url,
            "nextjs_base_url": nextjs_base_url,
            "routes_checked": len(routes),
            "equivalent": all_equivalent,
            "route_results": route_results,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    def write_report(self, report: dict, output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# DataValidationRunner — compare Angular vs Next.js API data outputs
# ---------------------------------------------------------------------------

class DataValidationRunner:
    """Validates that migrated data output matches the legacy Angular output.

    Compares exported data files (JSON or CSV) using row count and order-
    independent checksum — the same approach as Android.  For web a second
    method ``validate_api_responses`` supports live HTTP API comparison.

    Parity: Android ``DataValidationRunner``.
    """

    @staticmethod
    def _read_lines(path: Path) -> list[str]:
        return path.read_text(encoding="utf-8", errors="replace").splitlines()

    @staticmethod
    def _normalized_checksum(lines: list[str]) -> int:
        """Order-independent rolling checksum for quick equivalence checks."""
        values = [hash(line.strip()) for line in lines if line.strip()]
        return sum(sorted(values))

    def validate(self, legacy_path: Path, target_path: Path) -> dict:
        """Compare two exported data files line-by-line.

        Parity: Android DataValidationRunner.validate().
        """
        if not legacy_path.exists():
            raise FileNotFoundError(f"Legacy data file not found: {legacy_path}")
        if not target_path.exists():
            raise FileNotFoundError(f"Target data file not found: {target_path}")

        legacy_lines = self._read_lines(legacy_path)
        target_lines = self._read_lines(target_path)

        legacy_rows = len(legacy_lines)
        target_rows = len(target_lines)
        row_count_match = legacy_rows == target_rows

        legacy_checksum = self._normalized_checksum(legacy_lines)
        target_checksum = self._normalized_checksum(target_lines)
        checksum_match = legacy_checksum == target_checksum

        return {
            "legacy_path": str(legacy_path),
            "target_path": str(target_path),
            "legacy_rows": legacy_rows,
            "target_rows": target_rows,
            "row_count_match": row_count_match,
            "legacy_checksum": legacy_checksum,
            "target_checksum": target_checksum,
            "checksum_match": checksum_match,
            "validation_passed": row_count_match and checksum_match,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    def validate_api_responses(
        self,
        angular_base_url: str,
        nextjs_base_url: str,
        api_paths: list[str],
        timeout: int = 10,
    ) -> dict:
        """Hit the same API endpoints on both servers and compare JSON responses.

        Parses both responses as JSON and compares normalized representations.
        Falls back to text comparison if either response is not valid JSON.

        Web-specific extension — no Android parity.
        """
        import urllib.request
        import urllib.error

        def fetch_json(base: str, path: str) -> "tuple[int, object]":
            url = base.rstrip("/") + "/" + path.lstrip("/")
            try:
                with urllib.request.urlopen(url, timeout=timeout) as resp:
                    raw = resp.read().decode("utf-8", errors="replace")
                    try:
                        return resp.status, json.loads(raw)
                    except json.JSONDecodeError:
                        return resp.status, raw
            except urllib.error.HTTPError as exc:
                return exc.code, None
            except Exception as exc:
                return -1, str(exc)

        endpoint_results: list[dict] = []
        all_passed = True

        for api_path in api_paths:
            legacy_status, legacy_data = fetch_json(angular_base_url, api_path)
            modern_status, modern_data = fetch_json(nextjs_base_url, api_path)

            def _norm(v: object) -> str:
                if isinstance(v, (dict, list)):
                    return json.dumps(v, sort_keys=True)
                return str(v) if v is not None else ""

            data_match = _norm(legacy_data) == _norm(modern_data)
            status_match = legacy_status == modern_status
            passed = status_match and data_match

            if not passed:
                all_passed = False

            endpoint_results.append({
                "api_path": api_path,
                "legacy_status": legacy_status,
                "modern_status": modern_status,
                "status_match": status_match,
                "data_match": data_match,
                "validation_passed": passed,
            })

        return {
            "mode": "api_http",
            "angular_base_url": angular_base_url,
            "nextjs_base_url": nextjs_base_url,
            "endpoints_checked": len(api_paths),
            "validation_passed": all_passed,
            "endpoint_results": endpoint_results,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    @staticmethod
    def write_report(report: dict, output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# maybe_run_dualrun_compare / maybe_run_data_validation
# ---------------------------------------------------------------------------

def maybe_run_dualrun_compare(args: argparse.Namespace) -> "dict | None":
    """Run dual-run file comparison if --dual-run-* flags are provided.

    Requires both --dual-run-legacy-output and --dual-run-modern-output.
    Writes report to --dual-run-report-path.

    If --dual-run-angular-url and --dual-run-nextjs-url are provided instead,
    performs live HTTP route comparison using DualRunComparator.compare_routes().

    Parity: Android maybe_run_dualrun_compare().
    """
    comparator = DualRunComparator()

    # Live HTTP mode (web-specific)
    angular_url = getattr(args, "dual_run_angular_url", None)
    nextjs_url = getattr(args, "dual_run_nextjs_url", None)
    if angular_url and nextjs_url:
        routes_raw = getattr(args, "dual_run_routes", "") or ""
        routes = [r.strip() for r in routes_raw.split(",") if r.strip()] or ["/"]
        report = comparator.compare_routes(
            angular_base_url=angular_url,
            nextjs_base_url=nextjs_url,
            routes=routes,
        )
        comparator.write_report(report, Path(args.dual_run_report_path))
        return report

    # File comparison mode (Android parity)
    legacy_out = getattr(args, "dual_run_legacy_output", None)
    modern_out = getattr(args, "dual_run_modern_output", None)
    if not legacy_out and not modern_out:
        return None
    if not legacy_out or not modern_out:
        raise ValueError(
            "Provide both --dual-run-legacy-output and --dual-run-modern-output "
            "for dual-run file comparison."
        )
    report = comparator.compare_files(
        legacy_path=Path(legacy_out),
        modern_path=Path(modern_out),
    )
    comparator.write_report(report, Path(args.dual_run_report_path))
    return report


def maybe_run_data_validation(args: argparse.Namespace) -> "dict | None":
    """Run data validation if --data-validate-* flags are provided.

    Requires both --data-validate-legacy and --data-validate-target for file
    comparison, OR --data-validate-angular-url + --data-validate-nextjs-url for
    live API comparison.  Writes report to --data-validate-report-path.

    Parity: Android maybe_run_data_validation().
    """
    runner = DataValidationRunner()

    # Live API mode (web-specific)
    angular_url = getattr(args, "data_validate_angular_url", None)
    nextjs_url = getattr(args, "data_validate_nextjs_url", None)
    if angular_url and nextjs_url:
        apis_raw = getattr(args, "data_validate_api_paths", "") or ""
        api_paths = [p.strip() for p in apis_raw.split(",") if p.strip()] or ["/api/health"]
        report = runner.validate_api_responses(
            angular_base_url=angular_url,
            nextjs_base_url=nextjs_url,
            api_paths=api_paths,
        )
        runner.write_report(report, Path(args.data_validate_report_path))
        return report

    # File comparison mode (Android parity)
    legacy = getattr(args, "data_validate_legacy", None)
    target = getattr(args, "data_validate_target", None)
    if not legacy and not target:
        return None
    if not legacy or not target:
        raise ValueError(
            "Provide both --data-validate-legacy and --data-validate-target "
            "for data file validation."
        )
    report = runner.validate(
        legacy_path=Path(legacy),
        target_path=Path(target),
    )
    runner.write_report(report, Path(args.data_validate_report_path))
    return report


# ---------------------------------------------------------------------------
# run_pipeline_batches — batch orchestration over large Angular source trees
# ---------------------------------------------------------------------------

async def run_pipeline_batches(
    source_root: Path,
    generated_dir: Path,
    artifacts_dir: Path,
    mkb_dir: Path,
    max_files_per_batch: int = 60,
    exclude_dirs: set[str] | None = None,
    orchestrator_kwargs: dict | None = None,
) -> dict:
    """Run the full migration pipeline over *source_root* in batches.

    For very large Angular codebases the context window of a single pipeline
    run may be insufficient to process all source files at once.
    ``run_pipeline_batches`` splits the Angular source tree into batches of at
    most *max_files_per_batch* TypeScript / HTML files, runs the full pipeline
    per batch (writing each batch's generated files into a sub-directory of
    *generated_dir*), and concatenates stage outputs at the end.

    A ``batch_summary.json`` is written to *artifacts_dir* summarising each
    batch's results.

    Parity: Android ``run_pipeline_batches()``.

    Args:
        source_root:          Root of the Angular 17 source tree.
        generated_dir:        Where generated Next.js files are written
                              (sub-directories ``batch_0/``, ``batch_1/`` …
                              are created under this root).
        artifacts_dir:        Orchestrator artifacts root.
        mkb_dir:              Migration Knowledge Base directory (shared across
                              all batches so each batch benefits from prior
                              knowledge).
        max_files_per_batch:  Maximum number of source files per batch.
        exclude_dirs:         Directory names to skip during source discovery.
        orchestrator_kwargs:  Extra keyword args forwarded to
                              :class:`MigrationOrchestrator` for every batch.

    Returns:
        A dict mapping batch indices to their ``outputs`` dict, plus a
        ``"_summary"`` key containing the batch summary metadata.
    """
    if exclude_dirs is None:
        exclude_dirs = DEFAULT_EXCLUDE_DIRS
    if orchestrator_kwargs is None:
        orchestrator_kwargs = {}

    # Discover all relevant source files
    all_files: list[Path] = []
    for ext in ("*.ts", "*.tsx", "*.html", "*.scss", "*.css"):
        for p in source_root.rglob(ext):
            if any(part in exclude_dirs for part in p.parts):
                continue
            all_files.append(p)
    all_files.sort()

    if not all_files:
        raise ValueError(f"No source files found under {source_root}")

    # Split into batches
    batches: list[list[Path]] = []
    for i in range(0, len(all_files), max_files_per_batch):
        batches.append(all_files[i : i + max_files_per_batch])

    print(
        f"[batch] {len(all_files)} source files -> "
        f"{len(batches)} batches x <={max_files_per_batch} files"
    )

    artifacts_dir.mkdir(parents=True, exist_ok=True)
    mkb_dir.mkdir(parents=True, exist_ok=True)

    all_outputs: dict[str, dict] = {}
    batch_meta: list[dict] = []

    for batch_idx, batch_files in enumerate(batches):
        batch_label = f"batch_{batch_idx:03d}"
        batch_generated = generated_dir / batch_label
        batch_artifacts = artifacts_dir / batch_label
        batch_generated.mkdir(parents=True, exist_ok=True)
        batch_artifacts.mkdir(parents=True, exist_ok=True)

        # Write a synthetic source root for this batch: create a temp directory
        # containing symlinks (or copies on Windows) to the batch files.
        import tempfile, shutil
        batch_src = Path(tempfile.mkdtemp(prefix=f"send2_batch_{batch_idx}_"))
        try:
            for fpath in batch_files:
                rel = fpath.relative_to(source_root)
                dest = batch_src / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                try:
                    dest.symlink_to(fpath)
                except (OSError, NotImplementedError):
                    shutil.copy2(fpath, dest)

            print(f"[batch] Running batch {batch_idx + 1}/{len(batches)}: {batch_label} ({len(batch_files)} files)")

            orchestrator = MigrationOrchestrator(
                source_root=batch_src,
                generated_dir=batch_generated,
                artifacts_dir=batch_artifacts,
                mkb_dir=mkb_dir,  # shared MKB
                **orchestrator_kwargs,
            )
            outputs = await orchestrator.run()
            all_outputs[batch_label] = outputs

            batch_meta.append({
                "batch_index": batch_idx,
                "batch_label": batch_label,
                "file_count": len(batch_files),
                "stages_completed": list(outputs.keys()),
                "generated_dir": str(batch_generated),
                "artifacts_dir": str(batch_artifacts),
                "status": "ok",
            })
            print(f"[batch] Batch {batch_idx + 1}/{len(batches)} complete — {len(outputs)} stages")

        except Exception as exc:
            batch_meta.append({
                "batch_index": batch_idx,
                "batch_label": batch_label,
                "file_count": len(batch_files),
                "status": "error",
                "error": str(exc),
            })
            print(f"[batch] Batch {batch_idx + 1}/{len(batches)} FAILED: {exc}")
        finally:
            shutil.rmtree(batch_src, ignore_errors=True)

    summary = {
        "total_batches": len(batches),
        "total_files": len(all_files),
        "max_files_per_batch": max_files_per_batch,
        "batches": batch_meta,
    }
    summary_path = artifacts_dir / "batch_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"[batch] Batch summary written to {summary_path}")

    all_outputs["_summary"] = summary
    return all_outputs


# ---------------------------------------------------------------------------
# SECTION 17 -- CLI + main()
# ---------------------------------------------------------------------------

def main() -> None:
    """Entry point for the Send2 Web Migration Orchestrator CLI.

    Dispatches to:
      - phase1_extract    -> phase1_extract_aup()  (AUP extraction)
      - phase2_plan       -> phase2_plan_mep()      (MEP planning)
      - phase_gate_check  -> phase_gate_check()     (gate status report)
      - (default)         -> MigrationOrchestrator.run() (full 33-stage pipeline)

    Parity: orchestrator 1.py ``parse_args()`` + ``_main()``.
    """
    load_dotenv()

    parser = argparse.ArgumentParser(
        description="Send2 Web Migration Orchestrator -- Angular 17 -> Next.js 15",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    # -- Phase dispatch --------------------------------------------------------
    parser.add_argument(
        "--phase",
        choices=["phase1_extract", "phase2_plan", "phase_gate_check"],
        default=None,
        help=(
            "Run a specific phase only. "
            "Omit to run the full 33-stage migration pipeline."
        ),
    )

    # -- Source and output roots -----------------------------------------------
    parser.add_argument(
        "--source-root",
        required=False,
        default=None,
        help="Path to Angular 17 source root (required for phase1_extract and full pipeline).",
    )
    parser.add_argument(
        "--generated-dir",
        default="./generated",
        help="Output directory for the generated Next.js 15 project.",
    )
    parser.add_argument(
        "--artifacts-dir",
        default="./.artifacts",
        help="Directory for all pipeline stage artifacts and reports.",
    )
    parser.add_argument(
        "--mkb-dir",
        default="./.mkb",
        help="Migration Knowledge Base root directory.",
    )

    # -- Pipeline control ------------------------------------------------------
    _stage_choices = MigrationOrchestrator.STAGE_SEQUENCE
    parser.add_argument(
        "--from-stage",
        choices=_stage_choices,
        default=None,
        help="Resume pipeline from this stage (loads earlier stages from existing artifacts).",
    )
    parser.add_argument(
        "--up-to-stage",
        choices=_stage_choices,
        default=None,
        help="Run pipeline only up to and including this stage.",
    )
    parser.add_argument(
        "--skip-codegen-files",
        action="store_true",
        help="Skip actual file generation stages. Only produce markdown plans.",
    )
    parser.add_argument(
        "--no-hitl",
        action="store_true",
        help="Suppress all HITL prompt gates (non-interactive / CI mode).",
    )

    # -- Claude Code CLI settings ----------------------------------------------
    parser.add_argument(
        "--claude-cmd",
        default="claude",
        help="Path or command name for the Claude Code CLI executable.",
    )
    parser.add_argument(
        "--claude-model",
        default=None,
        help="Claude model identifier to pass to the CLI (e.g. claude-opus-4-5).",
    )
    parser.add_argument(
        "--claude-max-turns",
        type=int,
        default=25,
        help="Maximum agentic turns per Claude Code CLI invocation.",
    )
    parser.add_argument(
        "--claude-permission-mode",
        choices=["acceptEdits", "bypassPermissions", "default", "dontAsk", "plan"],
        default="bypassPermissions",
        help="Claude Code CLI permission mode for non-interactive orchestrator runs.",
    )
    parser.add_argument(
        "--prompt-on-permission",
        action="store_true",
        help="If Claude returns a permission-blocked response, prompt y/n in terminal before retrying.",
    )

    # -- Build gate (web equivalent of Android compile gate) -------------------
    parser.add_argument(
        "--build-gate",
        action="store_true",
        help="Enable pnpm build gate after codegen stages (auto-repairs TypeScript errors).",
    )
    parser.add_argument(
        "--build-gate-max-retries",
        type=int,
        default=3,
        help="Maximum LLM repair attempts per build gate invocation.",
    )
    parser.add_argument(
        "--build-gate-timeout",
        type=int,
        default=300,
        help="pnpm build timeout in seconds per gate.",
    )
    parser.add_argument(
        "--build-gate-on-failure",
        choices=["warn", "block"],
        default="warn",
        help="Action when build gate fails after all retries: warn (continue) or block (raise error).",
    )
    parser.add_argument(
        "--pnpm-cmd",
        default="pnpm",
        help="Path or command name for the pnpm executable.",
    )

    # -- Screenshots -----------------------------------------------------------
    parser.add_argument(
        "--screenshots-dir",
        default=None,
        help="Directory containing legacy Angular app screenshots for visual reference during codegen.",
    )

    # -- Phase 1/2 options -----------------------------------------------------
    parser.add_argument(
        "--phase1-max-files",
        type=int,
        default=5000,
        help="Max files to scan for artifact inventory in phase1_extract.",
    )
    parser.add_argument(
        "--max-files",
        type=int,
        default=200,
        help="Max source files to ingest per pipeline stage context build.",
    )
    parser.add_argument(
        "--chunk-chars",
        type=int,
        default=4000,
        help="Max characters per source context chunk.",
    )
    parser.add_argument(
        "--exclude-dirs",
        default=",".join(sorted(DEFAULT_EXCLUDE_DIRS)),
        help="Comma-separated directory names to exclude from source scans.",
    )

    # -- Phase gate options ----------------------------------------------------
    parser.add_argument(
        "--gate-min-aup-coverage",
        type=float,
        default=70.0,
        help="Minimum AUP coverage percent required to pass the Phase 1 gate.",
    )
    parser.add_argument(
        "--gate-require-dual-run",
        action="store_true",
        help="Require dual-run report and equivalence pass for the Phase 4 gate.",
    )
    parser.add_argument(
        "--gate-require-data-validation",
        action="store_true",
        help="Require data validation report and pass for the Phase 4 gate.",
    )
    parser.add_argument(
        "--gate-strict",
        action="store_true",
        help="Exit with code 2 when any phase gate is blocked.",
    )

    # -- Batch mode -----------------------------------------------------------
    parser.add_argument(
        "--batch",
        action="store_true",
        help=(
            "Run the pipeline in batch mode: split source files into batches "
            "of --batch-max-files and run each batch independently."
        ),
    )
    parser.add_argument(
        "--batch-max-files",
        type=int,
        default=60,
        help="Maximum Angular source files per batch when --batch is set.",
    )

    # -- Dual-run comparison (file mode — Android parity) ----------------------
    parser.add_argument(
        "--dual-run-legacy-output",
        default=None,
        help="Legacy (Angular) output file path for dual-run file comparison.",
    )
    parser.add_argument(
        "--dual-run-modern-output",
        default=None,
        help="Modern (Next.js) output file path for dual-run file comparison.",
    )
    parser.add_argument(
        "--dual-run-report-path",
        default=".artifacts/dualrun.compare.json",
        help="Output path for the dual-run comparison report.",
    )
    # -- Dual-run comparison (live HTTP mode — web-specific) -------------------
    parser.add_argument(
        "--dual-run-angular-url",
        default=None,
        help="Base URL of the running Angular dev server (e.g. http://localhost:4200).",
    )
    parser.add_argument(
        "--dual-run-nextjs-url",
        default=None,
        help="Base URL of the running Next.js dev server (e.g. http://localhost:3000).",
    )
    parser.add_argument(
        "--dual-run-routes",
        default="/",
        help="Comma-separated list of routes to compare when using live HTTP dual-run.",
    )

    # -- Data validation (file mode — Android parity) -------------------------
    parser.add_argument(
        "--data-validate-legacy",
        default=None,
        help="Legacy migrated-data export file path for data validation.",
    )
    parser.add_argument(
        "--data-validate-target",
        default=None,
        help="Target (Next.js) migrated-data export file path for data validation.",
    )
    parser.add_argument(
        "--data-validate-report-path",
        default=".artifacts/data.validation.json",
        help="Output path for the data validation report.",
    )
    # -- Data validation (live API mode — web-specific) -----------------------
    parser.add_argument(
        "--data-validate-angular-url",
        default=None,
        help="Base URL of the running Angular API server for live data validation.",
    )
    parser.add_argument(
        "--data-validate-nextjs-url",
        default=None,
        help="Base URL of the running Next.js API server for live data validation.",
    )
    parser.add_argument(
        "--data-validate-api-paths",
        default="/api/health",
        help="Comma-separated API paths to compare when using live HTTP data validation.",
    )

    args = parser.parse_args()

    # -- Phase dispatch --------------------------------------------------------
    if args.phase == "phase1_extract":
        if not args.source_root:
            parser.error("--source-root is required for --phase phase1_extract")
        asyncio.run(phase1_extract_aup(args))
        return

    if args.phase == "phase2_plan":
        asyncio.run(phase2_plan_mep(args))
        return

    if args.phase == "phase_gate_check":
        phase_gate_check(args)
        return

    # -- Batch pipeline --------------------------------------------------------
    if args.batch:
        if not args.source_root:
            parser.error("--source-root is required for --batch mode")
        orch_kwargs = dict(
            claude_cmd=args.claude_cmd,
            claude_model=args.claude_model,
            claude_max_turns=args.claude_max_turns,
            claude_permission_mode=args.claude_permission_mode,
            prompt_on_permission=args.prompt_on_permission,
            skip_codegen_files=args.skip_codegen_files,
            no_hitl=args.no_hitl,
            screenshots_dir=Path(args.screenshots_dir) if args.screenshots_dir else None,
            build_gate_enabled=args.build_gate,
            build_gate_max_retries=args.build_gate_max_retries,
            build_gate_timeout=args.build_gate_timeout,
            build_gate_on_failure=args.build_gate_on_failure,
            pnpm_cmd=args.pnpm_cmd,
        )
        batch_outputs = asyncio.run(
            run_pipeline_batches(
                source_root=Path(args.source_root),
                generated_dir=Path(args.generated_dir),
                artifacts_dir=Path(args.artifacts_dir),
                mkb_dir=Path(args.mkb_dir),
                max_files_per_batch=args.batch_max_files,
                orchestrator_kwargs=orch_kwargs,
            )
        )
        summary = batch_outputs.get("_summary", {})
        print(
            json.dumps(
                {
                    "status": "ok",
                    "mode": "batch",
                    "total_batches": summary.get("total_batches"),
                    "total_files": summary.get("total_files"),
                    "generated_dir": str(args.generated_dir),
                    "artifacts_dir": str(args.artifacts_dir),
                },
                indent=2,
            )
        )
        return

    # -- Full pipeline ---------------------------------------------------------
    if not args.source_root:
        parser.error("--source-root is required to run the full migration pipeline")

    orchestrator = MigrationOrchestrator(
        source_root=Path(args.source_root),
        generated_dir=Path(args.generated_dir),
        artifacts_dir=Path(args.artifacts_dir),
        mkb_dir=Path(args.mkb_dir),
        claude_cmd=args.claude_cmd,
        claude_model=args.claude_model,
        claude_max_turns=args.claude_max_turns,
        claude_permission_mode=args.claude_permission_mode,
        prompt_on_permission=args.prompt_on_permission,
        from_stage=args.from_stage,
        up_to_stage=args.up_to_stage,
        skip_codegen_files=args.skip_codegen_files,
        no_hitl=args.no_hitl,
        screenshots_dir=Path(args.screenshots_dir) if args.screenshots_dir else None,
        build_gate_enabled=args.build_gate,
        build_gate_max_retries=args.build_gate_max_retries,
        build_gate_timeout=args.build_gate_timeout,
        build_gate_on_failure=args.build_gate_on_failure,
        pnpm_cmd=args.pnpm_cmd,
    )

    outputs = asyncio.run(orchestrator.run())

    # -- Post-pipeline: dual-run comparison and data validation ---------------
    dual_run_result = maybe_run_dualrun_compare(args)
    data_validation_result = maybe_run_data_validation(args)

    print(
        json.dumps(
            {
                "status": "ok",
                "stages_completed": list(outputs.keys()),
                "generated_dir": str(args.generated_dir),
                "artifacts_dir": str(args.artifacts_dir),
                "dual_run_equivalent": (
                    None if dual_run_result is None else dual_run_result.get("equivalent")
                ),
                "dual_run_report_path": (
                    args.dual_run_report_path if dual_run_result is not None else None
                ),
                "data_validation_passed": (
                    None if data_validation_result is None
                    else data_validation_result.get("validation_passed")
                ),
                "data_validation_report_path": (
                    args.data_validate_report_path
                    if data_validation_result is not None else None
                ),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
