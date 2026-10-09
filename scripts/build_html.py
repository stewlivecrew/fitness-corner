#!/usr/bin/env python3
"""Build the deployable, installable, offline-capable app from
fitness-corner-generator.jsx. Stdlib-only Python that shells out to esbuild
(a dev-time npm dependency, like ESLint -- nothing here ships to users except
the generated files).

Outputs (all generated -- never hand-edit):
  index.html            HTML shell: iOS/PWA meta, manifest + icons, inline
                        @font-face, localStorage storage shim, SW registration
  assets/app.js         JSX precompiled + React 18 bundled + minified (no
                        in-browser Babel, no CDN)
  assets/fonts/*.woff2  self-hosted Barlow / Barlow Condensed (OFL, from @fontsource)
  manifest.webmanifest  PWA manifest (name, icons, standalone display)
  sw.js                 service worker: versioned precache, cache-first

Usage: python3 scripts/build_html.py   (run `npm ci` once first)
"""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSX = ROOT / "fitness-corner-generator.jsx"
BUILD = ROOT / "build"            # scratch (gitignored)
ASSETS = ROOT / "assets"
FONTS = ASSETS / "fonts"
OUT = ROOT / "index.html"
ESBUILD = ROOT / "node_modules" / ".bin" / "esbuild"

FONT_FILES = [
    ("Barlow", 400, "barlow", "barlow-latin-400-normal.woff2"),
    ("Barlow", 500, "barlow", "barlow-latin-500-normal.woff2"),
    ("Barlow", 600, "barlow", "barlow-latin-600-normal.woff2"),
    ("Barlow Condensed", 600, "barlow-condensed", "barlow-condensed-latin-600-normal.woff2"),
    ("Barlow Condensed", 700, "barlow-condensed", "barlow-condensed-latin-700-normal.woff2"),
    ("Barlow Condensed", 800, "barlow-condensed", "barlow-condensed-latin-800-normal.woff2"),
]
ICONS = ["icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
         "icons/apple-touch-icon.png", "icons/favicon-32.png"]

GREEN, PAPER = "#1E4D2B", "#F2F4EF"

STORAGE_SHIM = """// localStorage-backed shim matching the Claude artifact storage API,
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
};"""

SW_REGISTER = """// Offline support: register the service worker; when a new version takes
// over, offer a reload (in-progress sessions are persisted, so it's safe).
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW registration failed", e));
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || document.getElementById("fc-update")) return;
    const b = document.createElement("button");
    b.id = "fc-update";
    b.textContent = "New version ready — tap to reload";
    b.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));z-index:9999;background:#F5B700;color:#143620;border:none;border-radius:999px;padding:12px 18px;font:700 15px 'Barlow Condensed',system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;box-shadow:0 4px 14px rgba(0,0,0,.25)";
    b.onclick = () => location.reload();
    document.body.appendChild(b);
  });
}"""


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]


def bundle():
    if not ESBUILD.exists():
        sys.exit("esbuild not found -- run `npm ci` first (dev-time dependency).")
    jsx = JSX.read_text()
    # Fonts are self-hosted in the build; drop the artifact's Google Fonts import.
    lines = [l for l in jsx.split("\n") if "fonts.googleapis.com" not in l]
    BUILD.mkdir(exist_ok=True)
    entry = BUILD / "entry.jsx"
    entry.write_text(
        'import { createRoot } from "react-dom/client";\n'
        + "\n".join(lines)
        + '\n\ncreateRoot(document.getElementById("root")).render(<FitnessCornerGenerator />);\n'
    )
    ASSETS.mkdir(exist_ok=True)
    out = ASSETS / "app.js"
    subprocess.run([
        str(ESBUILD), str(entry), "--bundle", "--minify", "--format=iife",
        "--jsx=automatic", "--target=es2019,safari14", "--legal-comments=none",
        "--define:process.env.NODE_ENV=\"production\"", f"--outfile={out}", "--log-level=warning",
    ], check=True, cwd=ROOT)
    return out


def copy_fonts():
    FONTS.mkdir(parents=True, exist_ok=True)
    faces = []
    for family, weight, pkg, fname in FONT_FILES:
        src = ROOT / "node_modules" / "@fontsource" / pkg / "files" / fname
        if not src.exists():
            sys.exit(f"missing font {src} -- run `npm ci`.")
        shutil.copyfile(src, FONTS / fname)
        faces.append(
            f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};"
            f"font-display:swap;src:url(assets/fonts/{fname}) format('woff2');}}"
        )
    return "\n".join(faces)


def write_manifest():
    manifest = {
        "name": "Fitness Corner Workout Generator",
        "short_name": "Fitness Corner",
        "description": "Tap what's at your Singapore fitness corner, get a workout.",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "orientation": "portrait",
        "background_color": PAPER,
        "theme_color": GREEN,
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    p = ROOT / "manifest.webmanifest"
    p.write_text(json.dumps(manifest, indent=2) + "\n")
    return p


def main():
    app = bundle()
    app_v = sha(app.read_bytes())
    font_css = copy_fonts()
    write_manifest()
    for icon in ICONS:
        if not (ROOT / icon).exists():
            sys.exit(f"missing {icon} (downscale it from icons/icon-source.png)")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>Fitness Corner Workout Generator</title>
<meta name="description" content="Generate a workout from whatever's at your Singapore fitness corner." />
<meta name="theme-color" content="{GREEN}" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Fitness Corner" />
<link rel="manifest" href="manifest.webmanifest" />
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png" />
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />
<link rel="preload" href="assets/fonts/barlow-condensed-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin />
<style>
{font_css}
html,body,#root{{margin:0;padding:0;}} body{{background:{PAPER};-webkit-tap-highlight-color:transparent;}}
</style>
</head>
<body>
<div id="root"></div>
<noscript>This app needs JavaScript.</noscript>
<script>
{STORAGE_SHIM}
</script>
<script src="assets/app.js?v={app_v}"></script>
<script>
{SW_REGISTER}
</script>
</body>
</html>
"""
    OUT.write_text(html)

    # Service worker: precache everything, version = hash of all of it, so any
    # change to the app, fonts, icons or shell installs a fresh cache.
    precache = ["./", "index.html", f"assets/app.js?v={app_v}", "manifest.webmanifest"] + \
               [f"assets/fonts/{f[3]}" for f in FONT_FILES] + ICONS
    h = hashlib.sha256()
    for rel in ["index.html", "assets/app.js", "manifest.webmanifest"] + [f"assets/fonts/{f[3]}" for f in FONT_FILES] + ICONS:
        h.update((ROOT / rel).read_bytes())
    version = h.hexdigest()[:12]
    sw = f"""// GENERATED by scripts/build_html.py -- do not edit.
// Cache-first service worker so the app opens instantly and works with no
// signal at the park. VERSION changes whenever any precached file changes.
const VERSION = "{version}";
const CACHE = "fc-" + VERSION;
const PRECACHE = {json.dumps(precache, indent=2)};

self.addEventListener("install", (event) => {{
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, {{ cache: "reload" }}))))
      .then(() => self.skipWaiting())
  );
}});

self.addEventListener("activate", (event) => {{
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fc-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});

self.addEventListener("fetch", (event) => {{
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const path = new URL(req.url).pathname;
  if (req.mode === "navigate") {{
    // App shell (./ or index.html): always the cached index.html, offline-first.
    // Any other page (e.g. sandbox.html on a local dev server) goes to the network.
    if (path.endsWith("/") || path.endsWith("/index.html")) event.respondWith(caches.match("index.html").then((r) => r || fetch(req)));
    return;
  }}
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {{
      if (res.ok && res.type === "basic") {{
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }}
      return res;
    }}))
  );
}});
"""
    (ROOT / "sw.js").write_text(sw)
    print(f"Wrote index.html, assets/app.js ({app.stat().st_size // 1024} KB), sw.js (v {version}), manifest.webmanifest")


if __name__ == "__main__":
    main()
