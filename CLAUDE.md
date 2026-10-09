# Fitness Corner Workout Generator — Project Context

<!--
  Structured for AI-agent consumption per claude-mem context-engineering
  principles: Layer 1 = compact index (read always), Layer 2 = working
  knowledge (read when modifying), Layer 3 = reference + decision log
  (fetch on demand). Keep this ordering. When updating: current state
  lives in Layers 1–2; history and rationale live in Layer 3. Never
  delete decision-log entries — supersede them.
-->

---

## LAYER 1 — Project Index (always read)

**What:** A mobile-first web app that generates calisthenics workouts from
whatever equipment exists at a Singapore fitness corner (HDB estates, park
connectors, NParks parks). User ticks visible equipment → sets level/focus/
sets/format → gets a session with per-exercise beginner-proofed guides,
timer, logging, and auto-progression.

**Status:** v1 beta. Single-file React app, deployed as standalone
`index.html` on GitHub Pages. Friends-and-family testing phase.
Key success metric: does anyone do a second session unprompted.

**Stack:** One React JSX file. `sandbox.html` (dev) still runs it through
Babel standalone + React 18 UMD from cdnjs for zero-setup live iteration.
The **deployed app is precompiled**: `scripts/build_html.py` bundles the
JSX + React with esbuild into `assets/app.js`, self-hosts the Barlow
fonts, and emits a PWA (manifest, icons, cache-first service worker) — no
CDN, no in-browser Babel, works offline and installs to the home screen.
Persistence via `window.storage` API (Claude artifact) shimmed to
`localStorage` in the standalone build (`fc:` key prefix). No backend, no
accounts, no external runtime requests. Node.js (ESLint + esbuild) is a
**dev-time-only** requirement — run `npm ci` once per clone.

**Files:**

- `sandbox.html` — the working/testing copy. Edit this freely during a
  session; served by the local dev server for live iteration. Not
  authoritative — see decision log `[architecture]` entry below.
- `fitness-corner-generator.jsx` — canonical source (Claude artifact form).
  Synced from `sandbox.html` via `scripts/sync_jsx.py` (part of
  `npm run release`) at commit checkpoints, not continuously.
- `index.html`, `assets/app.js`, `assets/fonts/*`, `sw.js`,
  `manifest.webmanifest` — **generated, never hand-edited.** Produced
  from `fitness-corner-generator.jsx` by `scripts/build_html.py`
  (esbuild bundle + iOS/PWA meta + inline @font-face + localStorage shim
  + SW registration; the artifact's Google Fonts `@import` line is
  stripped in the build). These are what GitHub Pages serves.
- `icons/` — `icon-source.png` (1024², opaque, full-bleed retro-sunset
  artwork: Marina Bay Sands + pull-up bar) is the source;
  the PNGs (192, 512, maskable 512 — full-bleed so it survives any mask —
  180 apple-touch, 32 favicon) are Lanczos downscales of it (Pillow),
  committed. Keep them opaque (iOS fills transparency with black).
  `build_html.py` appends a content-hash `?v=` to every icon URL (HTML,
  manifest, SW precache) so changed artwork gets a new URL — iOS caches
  touch icons per URL.
- `_config.yml` — Jekyll `exclude:` so Pages serves only the built app
  (not `sandbox.html`, sources or docs).
- `exercises.md` — source-of-truth exercise library (see Data model below);
  edit this, not the `EXERCISES` array directly.
- `scripts/build_exercises.py` — regenerates the `EXERCISES` array in both
  `sandbox.html` and `fitness-corner-generator.jsx` from `exercises.md`
  (stdlib-only Python, no dependencies; run after editing the doc).
- `scripts/build_html.py` — builds the deployable PWA from
  `fitness-corner-generator.jsx` (stdlib Python that shells out to
  `node_modules/.bin/esbuild`). SW cache name = hash of every precached
  file, so any change ships a fresh cache; the page shows a "New version
  ready — tap to reload" pill when a new SW takes over.
- `scripts/sync_jsx.py` — regenerates `fitness-corner-generator.jsx` from
  `sandbox.html` (stdlib-only Python). Automates the "port sandbox changes
  into the canonical `.jsx`" step — don't hand-copy between the two.
- `package.json` / `eslint.config.mjs` — **dev tooling only**, not shipped.
  `npm run release` chains sync → lint → build (the full pre-commit
  checkpoint). Requires Node (dev-time only, see Stack above).
- `.githooks/pre-commit` — **enforces** `npm run release`; see decision
  log `[tooling]`. Not optional — a commit touching `sandbox.html` or
  `exercises.md` cannot land unless this passes.
- `scripts/install_hooks.sh` — one-time per-clone setup
  (`git config core.hooksPath .githooks`); already run on this machine.
  A fresh clone needs this run once before the hook is active.
- `CLAUDE.md` — this file

**Owner intent:** Not a money project. Pay-once/"cover hosting costs" model
if ever monetized. Corner-data contribution must NEVER be paywalled (the
crowdsourced corner database is the only durable moat). Singapore is the
beachhead; the model generalizes to outdoor gyms globally.

---

## LAYER 2 — Working Knowledge (read before modifying code)

### The programming engine (one sentence)

**Level sets the floor, equipment sets the ceiling, Swap moves sideways,
the stepper moves vertically.** Every generation/UI decision derives from
this. Do not break it.

### Data model

**`exercises.md` is the source of truth** (178 entries as of this writing).
Authored per-exercise as a Markdown block (pattern heading → `###` name →
`- field: value` lines, including a `status: active|candidate` field so new
ideas can be staged without wiring them into the app yet). Run
`python3 scripts/build_exercises.py` after any edit — it regenerates the
`EXERCISES` array in both `sandbox.html` and `fitness-corner-generator.jsx`
from the doc (run `scripts/build_html.py` afterward to carry it into
`index.html`). Never hand-edit the `EXERCISES` array directly; the next
build will overwrite it.

Exercise entry schema (compiled `EXERCISES` array, generated — read-only):

```js
{ p: "<pattern>",          // one of 8 movement patterns
  ath: "power|skill|elastic", // optional — athletic block eligibility
  lvl: 1-4,                // Beginner..Expert tier
  name: "...",
  req: ["equipId", ...],   // ALL required; [] = ground only
  reps: "...",             // range, hold time, or distance
  mus: ["muscleKey", ...], // subset of 14 MUSCLES keys
  how: "...",              // beginner setup text (see style rules)
  cue: "..." }             // form-quality tip, assumes mid-rep context
```

- **8 patterns:** verticalPush, verticalPull, horizontalPush,
  horizontalPull, kneeDominant, hipDominant, core, gripAthletic.
  Dips live inside push patterns (bench/parallel = horizontal;
  straight-bar/Korean = vertical) — do not create a 9th "dip" pattern.
- **16 equipment IDs** modeled on real SG corner inventory, incl. the four
  multi-generational lever machines (fixed light resistance — cues must
  compensate with tempo/pauses/single-limb) and logLift. Tai chi wheels /
  air walkers / body twisters are deliberately unprogrammed (no trainable
  resistance) — an on-screen note says so.
- **14 muscle groups** (`MUSCLES`). Deliberately coarse: granularity
  matches the decisions it drives ("did I train glutes?"), not anatomy
  class. `calves` label reads "Calves & shins" (covers tibialis).
- **FOCUS** defines patterns per focus AND a muscle `scope` used by
  three-state coverage (hit / in-focus gap / off-duty-by-design).
- **Full body alternates its vertical slot** (`focusPatterns(focus,
  vslot)`): pull-up day ↔ overhead-push day, flipped per Generate from
  the last saved full-body log entry (`gen.vslot`, logged as `vslot`);
  "Switch" on the Workout tab overrides. Stays at 6 stations.

### Generator invariants (buildSession / buildAthletic)

1. Pick the hardest eligible TIER at or below effective level. Within
   that tier, order is: not done recently first (names from the last
   session at this corner + the most recent session overall, captured
   at Generate time), then a seeded shuffle. The seed is drawn fresh on
   Generate / "New mix" and kept in `gen` state, so re-renders never
   reshuffle; each station gets its own RNG (seed ^ hash(pattern:idx))
   so stepping one station never reshuffles the others. Level still sets
   the floor — variety only reorders one tier. Ordering key, highest
   priority first: uses ticked equipment (`req` non-empty) → not done
   recently → seeded shuffle. Athletic block ties also prefer equipment.
2. Effective level = global level + manual stepper adj + auto-memory adj,
   clamped 1–4.
3. Swap alternatives = peers at the SAME top tier only (easier exercises
   are reachable only via "− Easier"). Dead hangs must never appear in an
   Expert's swap rotation.
4. **Never-drop fallback:** empty pool at level → easiest exercise the
   equipment supports at ANY level. "Missing" station only when no
   equipment-compatible exercise exists at all. Every pattern has ≥1
   `req: []` floor exercise (prone Y-T-W, prone lat pulldown, etc.) —
   preserve this when editing the DB.
5. No exercise repeats across stations (shared `used` set; athletic block
   dedupes against main session picks).
6. Plate eyebrow shows the DISPLAYED exercise's tier (`ex.lvl`), never the
   requested level — display must not lie when fallback engages.
7. Athletic block = A1 skill primer → A2 max-intent power → A3
   reactive/elastic. Selection is DETERMINISTIC by design (power/skill
   improve via repetition, not rotation) — Swap exists for optional
   variety. Block sits directly after warm-up (power quality dies
   fatigued). Focus-aware via `ATH_KINDS`: upper drops A3 (hops),
   core & grip drops the max-effort power drill. Athletic stations are
   rated, logged (`pattern: "ath-<kind>"`, `athletic: true`) and
   auto-levelled with memory keys `ath-skill|ath-power|ath-elastic`.

### Session-flow invariants

- Warm-up is DYNAMIC (squat-to-stand, World's Greatest Stretch, heel/toe
  walks); cool-down is STATIC long holds. Same position can appear in
  both with different jobs (deep squat: rehearsal pre, tissue work post).
  Keep the dynamic-before/static-after split.
- Warm-up and cool-down are both **equipment-aware** (bench → couch
  stretch, bench pigeon; bar → dead hang else forward fold else cross-body
  shoulder stretch) **and focus-aware**: three booleans derived from
  `FOCUS[focus].patterns` — `needsUpperPrep` (any of verticalPush/
  verticalPull/horizontalPush/horizontalPull), `needsLowerPrep` (any of
  kneeDominant/hipDominant/gripAthletic), `needsGripPrep` (gripAthletic
  present) — gate which items render. "Full body" trips both upper and
  lower prep by construction (its pattern mix spans both), not as a
  special case. Tibialis raise (wall lean) is included in warm-up
  whenever `needsLowerPrep` is true, at a lighter prep dose than its
  full working-set version in the exercise library.
- Warm-up, athletic block and cool-down all render through `BlockCard`
  (same header: chevron · title · meta, ✓/progress on the right) with
  `BlockItem` rows; all three adapt to equipment + focus + level
  (`byLvl()` scales doses/holds; L1 gets supported variants, L2+ adds
  scap push-ups, L3+ adds easy pogo hops as elastic prep; bar hang only
  when a bar is ticked).
- Progression standard (shown on workout screen): top of rep range, every
  set, two sessions in a row → promote via "Harder +". Adapted from the
  r/bodyweightfitness RR 3×8 rule.

### Timer & logging (the "memory loop")

- **Stopwatch, not countdown.** One clock covers warm-up → cool-down.
  Checkpoints are format-aware: straight sets → per-station Done;
  circuit → per-ROUND buttons (sequential unlock), no per-station Done.
  Warm-up and cool-down always have their own ✓. Timestamps display as
  "✓ at m:ss" (session-clock time, not duration).
- **Rest countdown** (fixed bar at the bottom while running): tap
  "⏱ Rest" after a set/round; length = straight 90s (120s at L3+),
  circuit 75s; circuit round ticks auto-start it (except the last).
  +15s / Skip; beep (WebAudio, unlocked on the tap) + vibrate where
  supported; `restEnd` persists in `fc-active`. This is a rest *cue*,
  the stopwatch remains the measurement.
- **Finisher record:** dead hang seconds (bar ticked) or best broad jump
  cm; `fc-finisher` ({hang:[], jump:[]}, newest first, cap 50) shows
  "Last time · Best" and flags a new best; also saved on the log entry.
- Post-session ratings per station: easy | right | hard.
- **Auto-level memory:** "too easy" ×2 consecutive sessions → pattern +1
  (cap +3); "too hard" ×1 → −1 immediately (floor −3). Asymmetric on
  purpose: demote fast, promote cautiously. Applied ONCE per pattern per
  saved session (Core & grip's two stations per pattern aggregate: any
  hard → hard; easy only if all easy). Manual Harder+/Easier steps are
  folded into memory on save — the level you finished at becomes the
  baseline (`adjs` = delta vs level + memory; `bump()` steps from the
  displayed effective level so button state and effect always agree).
- **Lever machines only demote.** Stations whose exercise needs a lever
  machine (`LEVER_IDS`: chestPress, latPulldown, shoulderPressM,
  legPressM) are logged with `lever: true`; on save their "too easy" is
  ignored and positive Harder+ steps aren't folded into memory. "Too
  hard" and Easier still lower the pattern. Memory is per pattern, so a
  light fixed-resistance machine must not promote you onto pull-ups.
- `resolvePicks()` is the single source of what each station displays
  (swap offset applied, never duplicating an earlier station's exercise);
  render, coverage, ratings and the log all read `picks`. Equipment /
  focus / level changes call `resetTweaks()` to drop stale swaps/steps.
- Storage keys: `fc-corners` (name → equipment[]), `fc-log` (sessions,
  newest first, cap 100), `fc-levels` ({mem, streak}), `fc-finisher`
  (finisher history), `fc-test` ({history: newest first, cap 20;
  offered; barCheckDismissed; snoozeUntil}), `fc-test-active` (an
  in-progress test, resumed after reload if < 12 h old; excluded from
  backups), `fc-settings`
  (last eq/level/focus/sets/format/toggles/activeCorner — restored on
  load; powers "▶ Go — same as last time" and per-corner ▶ Go).
  `fc-active` ({phase, startTs, done, ratings, gen, swaps, adjs} —
  restores the generated workout and any in-progress session after a
  reload; excluded from backups). Backup = Log tab Export/Import: one
  JSON file `{app, format: 1, exportedAt, data: {fc-*: value}}`; import
  confirms, overwrites those keys, reloads. Destructive actions (reset,
  delete corner, overwrite/rename onto an existing corner) always confirm. Standalone shim
  prefixes with `fc:` in localStorage. All storage ops wrapped in
  try/catch; missing storage degrades gracefully with a visible banner.
- Named-corner chip deselects the moment equipment is edited — the
  highlight means "selection IS this corner", nothing looser.

### Fitness test (onboarding + retest)

Gated, capped field test that seeds every pattern's level; auto-level
then refines it. Cut-offs answer "which tier of OUR exercises can you do
cleanly" (r/bodyweightfitness RR rule: work at the hardest variation you
can do 3×5–8, move up at 3×8), sanity-checked against ACSM push-up
norms, US Army AFT (15 HRP men 17–21, plank 1:30 min), USMC pull-ups,
CDC chair stand, Freckleton single-leg bridge, heel-raise norms and
KOT's 10 pull-ups. No age/sex input, no run. Full research + sources:
see the design doc summarised in the `[fitness-test]` decision entry.

- **Flow:** intro (first open: auto-offered, "Skip — I'll pick a level")
  → PAR-Q+ 7 questions + "anything hurting?" + "unwell / too hot?" →
  setup (bar? bench?) → 2–3 min warm-up → items → results → apply.
  Any PAR-Q yes → no max tests, every pattern Beginner. Unwell/hot →
  "test another day". Pain area → skip items loading it (pattern
  Beginner). "I don't feel right" on every item → stop screen (995),
  nothing saved. Stop rules shown on safety screen + every item.
- **Items** (gate → measure → optional extra; caps stop the effort):
  push (5 knee → full push-ups cap 30: <5 L1, 5–14 L2, 15–29 L3, 30 L4;
  pike check only at L2) · legs (10 squats → split squats/weaker leg cap
  10: <10 L2, 10 L3, +5 single-leg bench stand-ups L4; no bench caps L3)
  · pull (10 s hang → pull-ups cap 10: 0 + 3 s negative L2 else L1, 1–4
  L2, 5–9 L3, 10 L4) · single-leg bridge (10 two-leg → cap 20: <10 L1,
  10–19 L2, 20 L3 — **test never gives hip L4**, Nordics) · plank (cap
  90 s: <30 L1, <90 L2, 90 L3, +5 hanging straight-leg raises L4) ·
  dead hang last (cap 90: <20 L1, <45 L2, <90 L3, 90 L4; skipped if the
  10 s hang failed). No bar: calf raise instead (cap 25: <10, <25, 25 =
  L3 max), no pull items.
- **Inferred:** verticalPush = push − 1 (pike check can lift L1→L2);
  horizontalPull = verticalPull; no bar → both pulls = min(push, 2),
  flagged `estimated`; athletic `ath-*` = min(global, 2).
- **Apply:** global level = floor(median of 8); `mem[p] = level_p −
  global`; streaks cleared. Results screen shows 8 rows (level, reason,
  flag, −/+). Retest rule: a pattern auto-level raised (current effective
  level > last applied test level, or > self-picked level) is **kept**
  if the test comes out lower, with a note — user taps − to accept.
  "Save results, keep my current levels" stores without applying.
- **Bar check** (mode `bar`: pull + hang): offered on the Equipment tab
  when the last test had no bar and a bar is ticked (not within 3 h of
  that test; "Not now" persists), and always from the Log card. Merges
  into the latest record, updates only verticalPull/horizontalPull/grip.
- The test's dead hang seeds `fc-finisher` (corner "Fitness test").
- **Access:** Equipment tab shows "Take the fitness test" until one is
  completed; Log tab card shows before/after raw numbers + levels,
  "Retest" and (if estimated) "Bar check"; 8-week (`RETEST_DAYS`)
  reminder banner on Equipment ("In a week" snoozes 7 days).
- `scoreTest()` / `medianLevel()` / `testMetrics()` are pure — test them
  outside React when changing thresholds.

### Content style rules (enforce on every DB edit)

- `how` text: body position BEFORE movement ("Lie on your back with
  knees bent…" then the action). Written for someone who has never
  trained. No unanchored relative terms — "inside arm" is banned; use
  "say right foot forward… your right arm sweeps up" (name a side, walk
  the example).
- `cue` is refinement, not instruction — assumes the reader is mid-rep.
- No external-load exercises (no weighted dips/pull-ups, bands, towels).
  Exception planned: personal "Gear" category (see roadmap).
- Honest fallbacks: if an exercise is activation-level (prone lat
  pulldown), the cue says so. The UI also shows a stand-in note on any
  pull-pattern station whose exercise is ground-only (`req: []`).
- Ground-only Beginner must be doable by someone who has never
  trained: every pattern has ≥2 L1 `req: []` options (wall/kneeling
  regressions; a wall or post is assumed available, like the existing
  tibialis wall lean).
- Safety strip in every guide: "Stop if you feel sharp pain, dizziness,
  or can no longer control the movement."

### UI conventions

- Design language: NParks station-signage vernacular. Tokens in `T`
  (signage green #1E4D2B, powder-coat yellow #F5B700, paper #F2F4EF).
  Barlow Condensed for display, Barlow for body.
- Equipment pictograms: inline SVG, figure-in-use with filled head (like
  real notice boards). NEVER embed NParks artwork (copyright) or external
  images (artifact sandbox blocks them anyway).
- Five tabs: Equipment · Session · Workout · Library · Log.
- `StationPlate` is the shared plate component (main + athletic);
  `BlockCard` is the shared shell for warm-up / athletic / cool-down. Any new
  block type should render through it to inherit Guide/Swap/steppers.
- Anatomy figure: front+back cartoon, 14 mapped regions, three uses
  (coverage card, guide pop-out, library cards).

---

## LAYER 3 — Reference & Decision Log (fetch on demand)

### Deployment

GitHub Pages: repo `fitness-corner`, `index.html` at root, Pages from
main branch (Pages requires this exact filename/location to auto-serve).
Update flow: edit `sandbox.html` during the session → commit → push.
`npm run release` (sync → lint → build) no longer has to be run by hand —
the `.githooks/pre-commit` hook runs it automatically whenever
`sandbox.html` or `exercises.md` is staged, and aborts the commit
entirely if it fails (e.g. a real lint error). Running `npm run release`
directly is still fine any time you want to check sooner than a commit.
Same URL, ~1–2 min propagation after push. Installed/offline users get
the new version on the next launch after the SW updates (pill prompts a
reload). localStorage is per-browser-per-device (no sync) — accepted
beta constraint; the Log tab's Export/Import is the backup path. Keys are
unchanged across the PWA move (same origin + `fc:` prefix), so existing
data carries over.

### Content sources & attribution

- Equipment landscape: data.gov.sg / NParks datasets (park connector
  GeoJSON, parks with fitness-corner flags), OneMap exercise-facility
  themes, parliamentary answer (~3,400 corners, mostly multi-gen).
  No public per-station equipment inventory exists — that's the
  crowdsourcing opportunity (photo the notice board = verified record).
- Program structure validated against r/bodyweightfitness Recommended
  Routine (ladders match nearly rung-for-rung; phase order matches).
- ATG / Knees Over Toes (Ben Patrick): tibialis raise, Patrick step, ATG
  split squat, elephant walk, seated good morning, backward walk, reverse
  Nordic, soleus raise, couch stretch, pigeon, heel/toe walks. Movements
  are not ownable; all descriptions written fresh in house style. If ever
  public, credit ATG influence in an about section.
- Squat University alignment: movement-first cues; future "self-screens"
  Library section (knee-to-wall test etc.) is the natural borrow.

### Roadmap (ordered by owner priority)

1. **Field-test feedback loop** (current) — beginner comprehension of
   guides, sweaty-thumb tap targets, does session #2 happen.
2. ~~**Fitness test onboarding**~~ — shipped (see Layer 2 > Fitness
   test): ~8-min gated test sets all 8 pattern levels; retest reminder
   every 8 weeks; feeds auto-progression. Next: optional age-norm
   context, optional run, per-item retest.
3. **Gear tab** (personal accessories, distinct from Equipment):
   Equipment = property of the place; Gear = property of the person
   (persists across sessions, unioned with corner equipment at
   generation). First items: mini band (unlocks glute med — the one
   remaining muscle-model hole), jump rope (canonical elastic tool),
   rings/suspension strap (biggest exercise-count-per-gram).
4. **Map layer** — plot corners from OneMap/data.gov.sg; saved corners
   pin to locations. View free for everyone; personal layer ("my
   corners", history-at-corner) is the paid surface if any.
5. **Crowdsourced corner DB** — photo the NParks notice board → equipment
   record (OCR later). Contribution always free.
6. **Weekly coverage** — aggregate per-session coverage chips across the
   log ("hamstrings dashed 3 sessions running").
7. **Time-budget generation** — "I have 20 min" sized by the user's own
   logged splits, never generic estimates.
8. Reps logging, contact-count tracking for plyo volume, rest-cue length
   derived from logged pacing — all post-beta (a fixed-length rest
   countdown shipped already).

### Decision log

Format: `[decision] what — why. (supersedes: none unless noted)`

- [scope] Workout generator, not route planner — no public per-station
  equipment data exists; routing is 80% of effort for a feature Strava
  already does. Corners are the moat, routes are not.
- [taxonomy] Legs split knee-dominant vs hip-dominant; added
  reactive/elastic as third athletic kind (skill/power/elastic) after
  A2/A3 collided drawing from one "power" pool.
- [progression] Swap restricted to same-tier peers — swapping to easier
  is a demotion, not a swap; stepper owns vertical movement.
- [progression] Auto-memory asymmetry (2 easy → up, 1 hard → down) —
  mirrors coach behavior: err toward safety.
- [fallback] Never drop a pattern the equipment can serve; added
  `req: []` floor exercises to both pull patterns (the only patterns
  that lacked them). Trigger: horizontal-pull station vanished on
  "− Easier" at a parallel-bars-only corner.
- [timer] Stopwatch + completion taps over countdown — measurement
  produces per-user benchmarks; prescription doesn't. Circuit checkpoints
  are rounds, not stations (a station is visited N times in a circuit).
- [coverage] Three chip states (hit / in-focus gap / off-duty) — striking
  through legs on a deliberate upper day was miscoaching; patch
  suggestions only target in-focus gaps.
- [muscles] 14 groups, no deeper — granularity matches decisions driven.
  Anatomy drawing gives visual detail without data debt. Sub-muscles
  only if a physio mode ever exists.
- [content] Skin the cat moved L3→L4 (too advanced for general
  population); "balancing pistol squat" rejected (beam pistol = injury
  with a countdown); weighted/towel/fingertip variants excluded
  (no-external-load rule).
- [icons] Hand-drawn SVG pictograms over icon libraries — no open-source
  set covers outdoor gym stations; figure-in-use style (per real
  signage) beats empty-machine drawings for recognition. No NParks
  artwork (copyright).
- [monetization] Free = the brain (stateless generation), paid = the
  memory (test, log, saved corners, adaptive levels). Timer stays free
  (table stakes). Contribution never paywalled. Pay-once preferred over
  subscription.
- [distribution] Standalone single-file HTML with localStorage shim for
  beta — zero backend, works for account-less testers; port to real
  hosting + DB only if session-#2 metric validates.
- [variety] Seeded random pick within the top tier + rotate away from
  recently-done exercises — the deterministic "first in the array" pick
  gave the identical session at the same corner every visit, which
  defeats a zero-thinking app used repeatedly at the same few corners.
  Athletic block stays deterministic (invariant 7). (supersedes: the
  implicit array-order pick in invariant 1)
- [equipment-wins] Ticked equipment beats ground-only peers at the same
  tier, and every lever machine + the log lift got L2–L4 variants
  (tempo, pauses, single-limb, 1¼ reps) — before this a multi-gen user
  got "Prone lat pulldown" on the floor while standing at a lat-pulldown
  machine, and machines vanished entirely above Beginner. Thin stations
  (leg-raise, push-up bars, sit-up bench, Swiss ladder, beam) got 3–4
  entries each so they actually show up.
- [two-tap] Settings + last corner persist; each saved corner has ▶ Go
  (load corner → fresh seed → Workout tab) and the Equipment tab opens
  with "▶ Go — same as last time". Open app → Go is the target flow.
- [session-safety] Persist in-progress session + confirm every
  destructive action + JSON backup — iOS routinely kills backgrounded
  tabs mid-workout, Safari can evict localStorage for unused sites, and
  "Reset all" was one unconfirmed tap from wiping everything.
- [progression] Harder+/Easier are persisted into auto-level memory on
  save (rather than rewording the UI) — the on-screen progression
  standard tells users to promote with "Harder +", so not remembering
  it silently undid their decision every session.
- [full-body] Rotate vertical pull/push instead of adding a 7th station —
  full body never trained overhead pushing; a 7th slot adds ~3–4 min to
  every session, rotation keeps length and gives both every 2 sessions.
- [ground-beginner] Audit of ground-only L1: added wall/knee push-ups,
  wall & kneeling pike, assisted squat (post), wall sit, hinge wall tap,
  kneeling plank, heel-tap dead bug, wall calf raise, reverse snow angel,
  supine elbow press; Pike push-up L1→L2 (6–10 reps is not a first-day
  move). No-bar pulls stay honest stand-ins — no towel/door hacks
  (no-external-load rule).
- [pwa] Precompile + bundle instead of in-browser Babel/CDN, plus a
  cache-first SW, manifest and iOS meta — Babel standalone was ~2.8 MB
  parsed on every load (~5.5 s on a throttled phone) and nothing worked
  without signal at the park. sandbox.html keeps the CDN/Babel setup for
  dev; SW only serves the app shell for `./` and `index.html` so local
  dev pages aren't hijacked. Screen Wake Lock held while a session runs.
  (supersedes: "no build step for the deployed app" in Stack)
- [content-authoring] Exercise data moved from hand-edited `EXERCISES`
  array to `exercises.md` + `scripts/build_exercises.py` generator — the
  raw JS array (single-line-per-entry, ~124 entries) was hard to browse
  by pattern/level and easy to let drift between `index.html` and the
  `.jsx` source. Doc format supports `status: candidate` so new exercise
  ideas can be logged without being wired into the app yet. Script is
  stdlib-only Python (no Node/PyYAML available in the dev environment,
  and no need to add a dependency) — keeps the deployed app's
  zero-build-step property intact; the build step is a maintainer-only,
  local, pre-commit action, not something the deployed page runs.
- [architecture] Split the single `index.html` editing target into
  `sandbox.html` (freely edited/tested) + `fitness-corner-generator.jsx`
  (canonical, synced at commit checkpoints) + generated `index.html`
  (via new `scripts/build_html.py`) — `.jsx` was already documented as
  "source of truth" but nothing enforced that in practice; an entire
  session's worth of UI changes (collapsible sections, toggles,
  focus-aware warm-up/cool-down) landed only in `index.html` via direct
  edits and never made it into the `.jsx`, silently diverging. Making
  `index.html` mechanically generated (verified byte-identical to the
  prior hand-maintained version via diff) removes the manual-discipline
  failure mode instead of just asking future-me to remember better.
- [tooling] Installed Node + ESLint (`eslint-plugin-react-hooks`,
  `no-use-before-define`) as dev-only tooling, wired into
  `npm run release` (sync → lint → build) — root cause was a real
  production crash: a `useEffect` referenced `athletic` before its
  `useMemo` declaration in the same component, threw
  `ReferenceError: Cannot access 'athletic' before initialization`, and
  produced a blank white page with no way to see the error (no Node, no
  browser console access, no linting existed at all). Verified the rule
  actually catches this class of bug by deliberately reintroducing the
  exact bug and confirming ESLint flagged it before reverting. Disabled
  `react-hooks/purity` and `react-hooks/set-state-in-effect` — both
  assume React Compiler, which this app doesn't use (plain React 18 UMD,
  no build step for the deployed page) — they'd only flag long-standing,
  working patterns here. This doesn't change the zero-build-step
  deployment invariant: Node/ESLint are local dev tooling only, never
  shipped, same spirit as `scripts/build_exercises.py`.
- [tooling] Added `.githooks/pre-commit` to *enforce* `npm run release`
  rather than just document it — documentation alone doesn't stop a
  future session (or a distracted me) from committing a `sandbox.html`
  change that never got synced/linted/built; a hook makes that
  structurally impossible instead of relying on memory. Verified both
  failure modes directly: (1) staged a `sandbox.html`-only change and
  committed — the hook auto-ran `release` and folded the regenerated
  `fitness-corner-generator.jsx`/`index.html` into the same commit;
  (2) staged a deliberately broken `sandbox.html` (undefined variable)
  and attempted to commit — the hook's lint step caught it and aborted
  before a commit was created (confirmed via `git log`). `core.hooksPath`
  is a per-clone git setting, not something a tracked file can force on
  its own — `scripts/install_hooks.sh` exists because of that gap.

- [fitness-test] One overall test that sets per-PATTERN levels, not a
  level per equipment — strength belongs to the movement; equipment is
  already handled by tiers + "equipment wins". Cut-offs are capability
  gates on our own tiers (RR 3×5–8 rule), not population percentiles,
  so no age/sex input. Gated (easiest first), capped, clean-rep stop,
  PAR-Q+ screen; conservative caps (hip ≤ L3; no bar/bench ≤ L3) and
  "round down when unsure". Retest every 8 weeks (was "quarterly").
  Sources: RR redditbwf.github.io/wiki/recommended_routine.html;
  PAR-Q+ eparmedx.com; ACSM push-up norms; army.mil/aft; USMC PFT
  tables; Strand 2014 plank (PMID 25031677); CDC STEADI chair stand;
  Freckleton 2014 bridge (PMID 23918443); heel-raise review
  PMC9246404; dead hang has NO validated norms (cut-offs are judgment).
- [lever-demote-only] Lever-machine stations can lower a pattern's
  memory but never raise it ("too easy" ignored, Harder+ not folded) —
  memory is per pattern, and a light fixed-resistance pulldown said
  nothing about pull-ups. (supersedes: part of [progression] for lever
  stations only)

### Known limitations (honest list)

- No video demos (artifact constraint; text + pictograms are the
  text-medium best; link YouTube per-exercise in a production build).
- No cross-device sync (localStorage).
- Ratings stand in for rep logging (friction trade-off, revisit
  post-beta).
- Elastic/plyo volume unmanaged (no contact counting yet).
- Circuit post-session rating is per-station, kept deliberately (the
  engine promotes patterns); fall back to per-session rating only if
  testers report rating fatigue.
- Anatomy figure regions are cartoon-approximate; leg-press pictogram is
  the weakest icon.
- Lower body and Core & grip focuses currently render identical warm-up/
  cool-down content — both trigger the same `needsLowerPrep`/
  `needsGripPrep` flags. Accepted for now; revisit if it starts feeling
  wrong once more testers exercise those two focus modes specifically.
