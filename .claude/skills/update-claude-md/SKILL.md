---
name: update-claude-md
description: Update this project's CLAUDE.md while preserving its Layer 1/2/3 structure and decision log. Use whenever a design decision, invariant, roadmap item, or file/status change needs to be recorded — not for casual code edits.
---

# Updating CLAUDE.md

This file follows a 3-layer structure (declared in its own header comment).
Before editing, re-read the current file in full — do not append blind.

**Layer 1 (Index)** — What/Status/Stack/Files/Owner intent. Only touch this
when the one-sentence project description, deployment status, file list, or
owner-intent framing actually changes. Keep it short; it's read every time.

**Layer 2 (Working Knowledge)** — Invariants, data model, generator rules,
content style rules, UI conventions. Edit this when a rule itself changes —
not when you merely act consistently with an existing rule. If you're about
to violate something written here (e.g. a "never/always" statement), stop
and ask whether the rule or the change is wrong.

**Layer 3 (Reference & Decision Log)** — History, rationale, roadmap, known
limitations. Fetched on demand, not read by default.

## Rules

1. **Never delete a decision-log entry.** If a decision is reversed, add a
   new entry and note `(supersedes: <old decision tag>)`. The log is a
   history, not a snapshot.
2. **Every decision-log entry needs a *why*, not just a *what*.** One line:
   `[tag] what — why.`
3. **Verify before writing.** If the update references a filename, function,
   or invariant, confirm it actually exists in the repo right now (`ls`,
   `grep`) before citing it in Layer 1/2. Stale references are worse than no
   reference.
4. **Roadmap and known-limitations are living lists** — reorder/strike
   through/annotate as priorities shift, but don't silently delete an item
   that was explicitly deprioritized; note why it dropped.
5. **After any edit, sanity-check cross-references**: does the Layer 1 file
   list match what's actually in the repo? Does a Layer 2 invariant
   contradict a Layer 3 decision log entry? Fix drift before finishing.
6. Keep the header HTML comment's meta-instructions intact — it's what tells
   any agent (including you, next time) how to read this file.

## Workflow

1. Read `CLAUDE.md` in full.
2. Identify which layer the new information belongs to.
3. Verify any concrete claims (files, function names, invariants) against
   the actual codebase.
4. Make the smallest edit that keeps the layer accurate — prefer editing an
   existing bullet/entry over adding a new one that duplicates it.
5. If the change is a decision or reversal, add a decision-log entry per
   Rule 2 rather than editing Layer 1/2 prose alone.
6. Re-read the diff and check Rule 5 (cross-reference drift) before done.
