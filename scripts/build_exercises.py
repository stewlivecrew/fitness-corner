#!/usr/bin/env python3
"""Regenerate the EXERCISES array in sandbox.html and fitness-corner-generator.jsx
from exercises.md. Stdlib only -- no dependencies.

index.html is generated from fitness-corner-generator.jsx (see build_html.py) --
not a target here. Run this after editing exercises.md, then port any other
sandbox.html changes into the .jsx and run build_html.py before committing.

Usage: python3 scripts/build_exercises.py
Run from the repo root (or anywhere; paths below are repo-root-relative).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOC = ROOT / "exercises.md"
TARGETS = [ROOT / "sandbox.html", ROOT / "fitness-corner-generator.jsx"]

FIELD_ORDER = ["athletic", "level", "requires", "reps", "muscles", "how", "cue"]
JS_KEY = {"athletic": "ath", "level": "lvl", "requires": "req", "reps": "reps",
          "muscles": "mus", "how": "how", "cue": "cue"}


def js_string(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


def parse_doc(text):
    entries = []
    pattern = None
    name = None
    fields = {}

    def flush():
        if name is not None:
            fields["p"] = pattern
            fields["name"] = name
            entries.append(dict(fields))

    for raw in text.split("\n"):
        line = raw.rstrip()
        if line.startswith("## "):
            flush()
            name = None
            fields = {}
            label = line[3:].strip()
            pattern = {
                "Vertical Push": "verticalPush", "Vertical Pull": "verticalPull",
                "Horizontal Push": "horizontalPush", "Horizontal Pull": "horizontalPull",
                "Knee Dominant": "kneeDominant", "Hip Dominant": "hipDominant",
                "Core": "core", "Grip / Athletic": "gripAthletic",
            }[label]
        elif line.startswith("### "):
            flush()
            name = line[4:].strip()
            fields = {}
        elif line.startswith("- "):
            m = re.match(r'^- (\w+):\s*(.*)$', line)
            if not m:
                continue
            key, val = m.group(1), m.group(2).strip()
            fields[key] = val
    flush()
    return [e for e in entries if e.get("status") == "active"]


def render_entry(e):
    parts = []
    if e.get("athletic"):
        parts.append(f'ath: {js_string(e["athletic"])}')
    parts.append(f'p: {js_string(e["p"])}')
    parts.append(f'lvl: {int(e["level"])}')
    parts.append(f'name: {js_string(e["name"])}')
    req = e.get("requires", "(none)")
    req_list = [] if req == "(none)" else [x.strip() for x in req.split(",")]
    parts.append('req: [' + ", ".join(js_string(x) for x in req_list) + ']')
    parts.append(f'reps: {js_string(e["reps"])}')
    mus_list = [x.strip() for x in e["muscles"].split(",")]
    parts.append('mus: [' + ", ".join(js_string(x) for x in mus_list) + ']')
    parts.append(f'how: {js_string(e["how"])}')
    parts.append(f'cue: {js_string(e["cue"])}')
    return "  { " + ", ".join(parts) + " },"


PATTERN_ORDER = ["verticalPush", "verticalPull", "horizontalPush", "horizontalPull",
                 "kneeDominant", "hipDominant", "core", "gripAthletic"]
COMMENT_LABEL = {
    "verticalPush": "Vertical push", "verticalPull": "Vertical pull",
    "horizontalPush": "Horizontal push", "horizontalPull": "Horizontal pull",
    "kneeDominant": "Knee-dominant", "hipDominant": "Hip-dominant",
    "core": "Core", "gripAthletic": "Grip / athletic",
}


def render_array(entries):
    by_pattern = {p: [] for p in PATTERN_ORDER}
    for e in entries:
        by_pattern[e["p"]].append(e)
    lines = ["const EXERCISES = ["]
    for p in PATTERN_ORDER:
        if not by_pattern[p]:
            continue
        lines.append(f"  // ---- {COMMENT_LABEL[p]} ----")
        for e in by_pattern[p]:
            lines.append(render_entry(e))
        lines.append("")
    while lines and lines[-1] == "":
        lines.pop()
    lines.append("];")
    return "\n".join(lines)


def main():
    entries = parse_doc(DOC.read_text())
    new_block = render_array(entries)
    pattern = re.compile(r'const EXERCISES = \[.*?\n\];', re.S)
    for target in TARGETS:
        text = target.read_text()
        if not pattern.search(text):
            print(f"WARNING: no EXERCISES array found in {target}", file=sys.stderr)
            continue
        target.write_text(pattern.sub(lambda _: new_block, text, count=1))
        print(f"Wrote {len(entries)} exercises into {target.name}")


if __name__ == "__main__":
    main()
