#!/usr/bin/env python3
"""Regenerate index.html by wrapping fitness-corner-generator.jsx in the
deployable HTML shell (CDN scripts + localStorage storage shim). Stdlib
only -- no dependencies.

index.html is generated output -- never hand-edit it. Edit sandbox.html
during a session, port finalized changes into fitness-corner-generator.jsx,
then run this script to regenerate index.html for commit/deploy.

Usage: python3 scripts/build_html.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSX = ROOT / "fitness-corner-generator.jsx"
OUT = ROOT / "index.html"

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>Fitness Corner Workout Generator</title>
<meta name="description" content="Generate a workout from whatever's at your Singapore fitness corner." />
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
<style>html,body,#root{margin:0;padding:0;} body{background:#F2F4EF;}</style>
</head>
<body>
<div id="root"></div>
<script>
// localStorage-backed shim matching the Claude artifact storage API,
// so the logging/corners/auto-level features work in any browser.
window.storage = {
  async get(key) {
    const v = localStorage.getItem("fc:" + key);
    if (v === null) throw new Error("key not found: " + key);
    return { key, value: v, shared: false };
  },
  async set(key, value) {
    localStorage.setItem("fc:" + key, String(value));
    return { key, value, shared: false };
  },
  async delete(key) {
    localStorage.removeItem("fc:" + key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("fc:" + prefix)) keys.push(k.slice(3));
    }
    return { keys, prefix, shared: false };
  },
};
</script>
<script type="text/babel" data-presets="react">
const { useState, useMemo, useEffect, useRef } = React;

"""

TAIL = """

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<FitnessCornerGenerator />);
</script>
</body>
</html>
"""


def main():
    jsx = JSX.read_text()
    lines = jsx.split("\n")
    # Drop the `import { ... } from "react";` line -- the HTML shell destructures
    # from the global React UMD build instead (see HEAD template above).
    body_lines = [l for l in lines if not l.startswith("import ")]
    body = "\n".join(body_lines).strip("\n")
    OUT.write_text(HEAD + body + TAIL)
    print(f"Wrote {OUT.name} from {JSX.name} ({len(body_lines)} lines)")


if __name__ == "__main__":
    main()
