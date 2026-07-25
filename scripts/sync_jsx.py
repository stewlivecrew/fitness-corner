#!/usr/bin/env python3
"""Sync fitness-corner-generator.jsx from sandbox.html. Stdlib only.

Extracts the component body from sandbox.html's <script type="text/babel">
block (between the `const { ... } = React;` destructure and the
ReactDOM.createRoot bootstrap) and writes it into fitness-corner-generator.jsx
with an ES-module import in place of the destructure line.

Run this after a sandbox.html session settles, before linting/build_html.py.

Usage: python3 scripts/sync_jsx.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SANDBOX = ROOT / "sandbox.html"
JSX = ROOT / "fitness-corner-generator.jsx"

DESTRUCTURE_LINE = "const { useState, useMemo, useEffect, useRef } = React;"
BOOTSTRAP_LINE = 'const root = ReactDOM.createRoot(document.getElementById("root"));'
IMPORT_LINE = 'import { useState, useMemo, useEffect, useRef } from "react";'


def main():
    lines = SANDBOX.read_text().split("\n")
    start = end = None
    for i, l in enumerate(lines):
        if l.strip() == DESTRUCTURE_LINE:
            start = i + 1
        if l.strip() == BOOTSTRAP_LINE:
            end = i
            break
    if start is None or end is None:
        raise SystemExit(f"Could not find expected markers in {SANDBOX.name} -- "
                          f"has its wrapper structure changed?")

    body = lines[start:end]
    while body and body[0].strip() == "":
        body.pop(0)
    while body and body[-1].strip() == "":
        body.pop()

    JSX.write_text(IMPORT_LINE + "\n\n" + "\n".join(body) + "\n")
    print(f"Wrote {JSX.name} from {SANDBOX.name} ({len(body)} lines)")


if __name__ == "__main__":
    main()
