import { useState, useMemo, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/* DESIGN TOKENS — SG fitness corner vernacular:                       */
/* powder-coated steel yellow, NParks signage green, rubber-mat gray   */
/* ------------------------------------------------------------------ */
const T = {
  bg: "#F2F4EF",
  ink: "#1A241C",
  green: "#1E4D2B",
  greenDark: "#143620",
  yellow: "#F5B700",
  steel: "#5A6169",
  line: "#D7DCD2",
  card: "#FFFFFF",
  orange: "#C75B2A",
  safetyBg: "#F7E3DA",
  safetyText: "#8A3B22",
  silhouette: "#DFE4D8",
  regionOff: "#C9D0C1",
};

/* ------------------------------------------------------------------ */
/* EQUIPMENT INVENTORY (standard SG fitness corner / PCN kit)          */
/* ------------------------------------------------------------------ */
const EQUIPMENT = [
  { id: "highBar", label: "High pull-up bar", hint: "Overhead bar, feet off ground" },
  { id: "lowBar", label: "Low bar", hint: "Waist / chest height" },
  { id: "parallelBars", label: "Parallel / dip bars", hint: "Two bars, hip height" },
  { id: "monkeyBars", label: "Monkey bars", hint: "Horizontal ladder" },
  { id: "logLift", label: "Log lift", hint: "Pivoting log, overhead lift" },
  { id: "pushupBars", label: "Push-up bars", hint: "Low handles near ground" },
  { id: "situpBench", label: "Sit-up bench", hint: "Incline board with foot anchor" },
  { id: "legRaise", label: "Leg raise station", hint: "Captain's chair / forearm pads" },
  { id: "step", label: "Step / plyo platform", hint: "Knee-height box or step" },
  { id: "beam", label: "Balance beam", hint: "Low beam or log" },
  { id: "bench", label: "Bench / ledge", hint: "Park bench, wall or ledge" },
  { id: "swissLadder", label: "Swiss ladder", hint: "Vertical wall bars" },
  { id: "chestPress", label: "Chest press machine", hint: "Lever, fixed resistance" },
  { id: "latPulldown", label: "Lat pulldown machine", hint: "Lever, fixed resistance" },
  { id: "shoulderPressM", label: "Shoulder press machine", hint: "Lever, fixed resistance" },
  { id: "legPressM", label: "Leg press machine", hint: "Lever, fixed resistance" },
];

const PRESETS = [
  { id: "hdb", label: "Typical HDB corner", eq: ["highBar", "parallelBars", "situpBench", "bench"] },
  { id: "multigen", label: "Multi-gen corner", eq: ["chestPress", "latPulldown", "shoulderPressM", "legPressM", "situpBench", "beam", "bench"] },
  { id: "pcn", label: "PCN calisthenics station", eq: ["highBar", "lowBar", "parallelBars", "monkeyBars", "pushupBars", "legRaise", "step"] },
  { id: "ground", label: "Ground only", eq: [] },
];

/* ------------------------------------------------------------------ */
/* EQUIPMENT PICTOGRAMS — signage style, stroke = currentColor         */
/* ------------------------------------------------------------------ */
const ICONS = {
  // figure-in-use pictograms (like real station signage — filled head, solid figure)
  highBar: { d: "M8 8H40 M8 8V44 M40 8V44 M18 8L21 15 M30 8L27 15 M24 21V30 M24 30L20 38 M24 30L28 38", head: [24, 18] },
  lowBar: { d: "M8 22H40 M10 22V44 M38 22V44 M35 42L17 30 M18 29L21 22", head: [14, 27] },
  parallelBars: { d: "M6 22H18 M30 22H42 M8 22V44 M16 22V44 M32 22V44 M40 22V44 M24 12V26 M24 14L16 21 M24 14L32 21 M24 26L21 33 M24 26L27 33", head: [24, 9] },
  monkeyBars: { d: "M6 10H42 M12 10V15 M20 10V15 M28 10V15 M36 10V15 M20 15L23 22 M28 15L25 22 M24 28V35 M24 35L20 42 M24 35L28 41", head: [24, 25] },
  logLift: { d: "M12 16L40 28 M34 27V44 M9 12V26 M9 26L6 34 M9 26L12 34 M9 15L13 17", head: [8, 8] },
  legRaise: { d: "M10 44V8 M10 8H26 M16 16H38 M33 12V27 M33 27H26 M26 27V35", head: [33, 9] },
  chestPress: { d: "M14 44V32 M9 32H19 M19 32V16 M15 16V30 M15 19H31 M31 15V23 M15 30L22 36", head: [15, 13] },
  latPulldown: { d: "M38 44V8 M38 8H12 M8 14H24 M16 25L11 15 M16 25L21 15 M16 25V36 M10 36H24 M17 36V44", head: [16, 21] },
  shoulderPressM: { d: "M8 38H20 M14 38V44 M20 38V24 M13 19V36 M13 21L7 11 M13 21L19 11 M4 11H10 M16 11H22", head: [13, 16] },
  legPressM: { d: "M4 44H40 M6 42L14 32 M13 31L21 36 M21 36L33 27 M34 18V36", head: [11, 28] },
  // object pictograms (shape is self-explanatory)
  pushupBars: { d: "M8 34H18 M8 34V42 M18 34V42 M30 34H40 M30 34V42 M40 34V42" },
  situpBench: { d: "M6 42L36 20 M20 33V42 M6 42H14 M36 16a4 4 0 1 0 8 0a4 4 0 1 0-8 0" },
  step: { d: "M6 44H44 M8 44V36H20 M20 36V28H32 M32 28V20H44" },
  beam: { d: "M6 34H42 M12 34V44 M36 34V44" },
  bench: { d: "M8 30H40 M12 30V44 M36 30V44 M10 30V14" },
  swissLadder: { d: "M14 6V44 M34 6V44 M14 13H34 M14 21H34 M14 29H34 M14 37H34" },
};

function EquipIcon({ id }) {
  const ic = ICONS[id];
  if (!ic) return null;
  return (
    <svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={ic.d} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {ic.head && <circle cx={ic.head[0]} cy={ic.head[1]} r="3.4" fill="currentColor" />}
    </svg>
  );
}

const MUSCLES = {
  shoulders: "Shoulders", chest: "Chest", triceps: "Triceps", biceps: "Biceps",
  lats: "Lats", upperBack: "Upper back", lowerBack: "Lower back",
  abs: "Abs", obliques: "Obliques", glutes: "Glutes", quads: "Quads",
  hamstrings: "Hamstrings", calves: "Calves & shins", forearms: "Grip / forearms",
};

/* ------------------------------------------------------------------ */
/* ANATOMY FIGURE — cartoon front/back body, regions light up when hit */
/* ------------------------------------------------------------------ */
const REGIONS_FRONT = {
  shoulders: [{ t: "c", cx: 11.5, cy: 27, r: 4 }, { t: "c", cx: 48.5, cy: 27, r: 4 }],
  chest: [{ t: "r", x: 20, y: 26, w: 20, h: 12, rx: 3 }],
  biceps: [{ t: "r", x: 8.5, y: 34, w: 6, h: 13, rx: 3 }, { t: "r", x: 45.5, y: 34, w: 6, h: 13, rx: 3 }],
  forearms: [{ t: "r", x: 8.5, y: 51, w: 6, h: 17, rx: 3 }, { t: "r", x: 45.5, y: 51, w: 6, h: 17, rx: 3 }],
  abs: [{ t: "r", x: 24, y: 40, w: 12, h: 24, rx: 2 }],
  obliques: [{ t: "r", x: 19, y: 42, w: 4, h: 18, rx: 2 }, { t: "r", x: 37, y: 42, w: 4, h: 18, rx: 2 }],
  quads: [{ t: "r", x: 20.5, y: 74, w: 8, h: 28, rx: 4 }, { t: "r", x: 31.5, y: 74, w: 8, h: 28, rx: 4 }],
};
const REGIONS_BACK = {
  shoulders: [{ t: "c", cx: 11.5, cy: 27, r: 4 }, { t: "c", cx: 48.5, cy: 27, r: 4 }],
  upperBack: [{ t: "r", x: 20, y: 25, w: 20, h: 11, rx: 3 }],
  lats: [{ t: "r", x: 18.5, y: 37, w: 7, h: 17, rx: 3 }, { t: "r", x: 34.5, y: 37, w: 7, h: 17, rx: 3 }],
  lowerBack: [{ t: "r", x: 25, y: 52, w: 10, h: 13, rx: 2 }],
  triceps: [{ t: "r", x: 8.5, y: 34, w: 6, h: 13, rx: 3 }, { t: "r", x: 45.5, y: 34, w: 6, h: 13, rx: 3 }],
  forearms: [{ t: "r", x: 8.5, y: 51, w: 6, h: 17, rx: 3 }, { t: "r", x: 45.5, y: 51, w: 6, h: 17, rx: 3 }],
  glutes: [{ t: "c", cx: 25, cy: 73, r: 5.5 }, { t: "c", cx: 35, cy: 73, r: 5.5 }],
  hamstrings: [{ t: "r", x: 20.5, y: 81, w: 8, h: 24, rx: 4 }, { t: "r", x: 31.5, y: 81, w: 8, h: 24, rx: 4 }],
  calves: [{ t: "r", x: 20.5, y: 109, w: 8, h: 20, rx: 4 }, { t: "r", x: 31.5, y: 109, w: 8, h: 20, rx: 4 }],
};

function BodyFig({ regions, hit, h, label }) {
  const shape = (s, key, on) => {
    const fill = on ? T.green : T.regionOff;
    return s.t === "c"
      ? <circle key={key} cx={s.cx} cy={s.cy} r={s.r} fill={fill} />
      : <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={fill} />;
  };
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 60 146" height={h} aria-hidden="true">
        {/* silhouette */}
        <circle cx="30" cy="10" r="7" fill={T.silhouette} />
        <rect x="27" y="15" width="6" height="6" fill={T.silhouette} />
        <rect x="16" y="20" width="28" height="50" rx="8" fill={T.silhouette} />
        <rect x="7" y="23" width="9" height="48" rx="4" fill={T.silhouette} />
        <rect x="44" y="23" width="9" height="48" rx="4" fill={T.silhouette} />
        <rect x="19" y="68" width="11" height="66" rx="5" fill={T.silhouette} />
        <rect x="30" y="68" width="11" height="66" rx="5" fill={T.silhouette} />
        {/* regions */}
        {Object.entries(regions).map(([m, shapes]) =>
          shapes.map((s, i) => shape(s, m + i, hit.has(m)))
        )}
      </svg>
      <div className="disp" style={{ fontSize: 10.5, fontWeight: 700, color: T.steel, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function AnatomyFig({ hit, h = 120 }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      <BodyFig regions={REGIONS_FRONT} hit={hit} h={h} label="Front" />
      <BodyFig regions={REGIONS_BACK} hit={hit} h={h} label="Back" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MOVEMENT PATTERNS                                                   */
/* ------------------------------------------------------------------ */
const PATTERNS = {
  verticalPush: "Vertical push",
  verticalPull: "Vertical pull",
  horizontalPush: "Horizontal push",
  horizontalPull: "Horizontal pull",
  kneeDominant: "Legs · knee-dominant",
  hipDominant: "Legs · hip-dominant",
  core: "Core",
  gripAthletic: "Grip / athletic",
};

/* ------------------------------------------------------------------ */
/* EXERCISE DATABASE                                                   */
/* level: 1 Beginner · 2 Intermediate · 3 Advanced · 4 Expert          */
/* req: ALL listed equipment needed ([] = ground only)                 */
/* ------------------------------------------------------------------ */
const EXERCISES = [
  // ---- Vertical push ----
  { p: "verticalPush", lvl: 1, name: "Incline pike push-up", req: ["bench"], reps: "8–12", mus: ["shoulders", "triceps"], how: "Put both hands on the bench, walk your feet back and push your hips up so your body makes an upside-down V. Bend your elbows to lower your head toward the bench, then push back up.", cue: "The gentlest entry to overhead pressing — keep hips high the whole time." },
  { p: "verticalPush", lvl: 2, name: "Pike push-up", req: [], reps: "6–10", mus: ["shoulders", "triceps"], how: "Start in a push-up position, then walk your feet toward your hands so your hips point at the sky — your body forms an upside-down V. Bend your elbows to lower the top of your head toward the ground, then press back up.", cue: "Head travels toward your hands, elbows track back, hips stay high." },
  { p: "verticalPush", lvl: 1, name: "Lever shoulder press", req: ["shoulderPressM"], reps: "12–15", mus: ["shoulders", "triceps"], how: "Sit in the machine, grip the handles beside your shoulders, and push them up until your arms are straight. Lower slowly back to the start.", cue: "Resistance is fixed and light — take 3 seconds to lower, pause at the bottom." },
  { p: "verticalPush", lvl: 1, name: "Log lift", req: ["logLift"], reps: "10–12", mus: ["shoulders", "triceps"], how: "Stand facing the log's free end, grip it with both hands at chest height, and press it up until your arms are straight overhead. Lower it back down with control.", cue: "Stand tall, don't lean back — the original corner shoulder press." },
  { p: "verticalPush", lvl: 2, name: "Feet-elevated pike push-up", req: ["bench"], reps: "6–10", mus: ["shoulders", "triceps", "abs"], how: "Put your feet up on the bench and your hands on the ground, then walk your hands back until your hips are stacked above your shoulders. Lower your head to the ground and press back up.", cue: "The more vertical your torso, the closer this gets to a real handstand push-up." },
  { p: "verticalPush", lvl: 2, name: "Feet-elevated pike push-up (step)", req: ["step"], reps: "6–10", mus: ["shoulders", "triceps", "abs"], how: "Place your feet on the platform, hands on the ground, and pike your hips up over your shoulders. Bend your elbows to lower your head, then press up.", cue: "Stack shoulders directly over your hands before each rep." },
  { p: "verticalPush", lvl: 2, name: "Wall walk", req: [], reps: "3–5", mus: ["shoulders", "triceps", "abs"], how: "Start in a push-up position with your feet touching a wall. Walk your feet up the wall while walking your hands toward it, until you're nearly vertical. Then walk back down the same way.", cue: "Go only as high as you can control — the walk down counts too." },
  { p: "verticalPush", lvl: 3, name: "Deep pike push-up on parallel bars", req: ["parallelBars"], reps: "5–8", mus: ["shoulders", "triceps", "abs"], how: "Grip the parallel bars in a pike position with hips high. Lower your head below the level of your hands — the bars let you go deeper than the ground would — then press back up.", cue: "That extra range below the hands is exactly what makes this harder." },
  { p: "verticalPush", lvl: 3, name: "Wall handstand hold", req: [], reps: "20–40s", mus: ["shoulders", "triceps", "abs"], how: "Face the wall, put your hands on the ground about 20cm from it, and kick one leg then the other up so your heels rest on the wall. Hold that upside-down position, then come down one leg at a time.", cue: "Push tall through your shoulders, tuck the ribs — don't let your back arch." },
  { p: "verticalPush", lvl: 3, name: "Straight-bar dip (foot-assisted)", req: ["lowBar"], reps: "5–8", mus: ["chest", "triceps", "shoulders"], how: "Jump to support yourself on top of the low bar, arms straight, bar at your hips, with your toes still lightly touching the ground behind you. Bend your elbows to lower your chest toward the bar, using your toes to help just enough, then press up.", cue: "Take as much load in the arms as you can — legs are a spotter, not an engine." },
  { p: "verticalPush", lvl: 4, name: "Straight-bar dip", req: ["lowBar"], reps: "4–8", mus: ["chest", "triceps", "shoulders"], how: "Jump to support yourself on top of the bar with straight arms and the bar at your hips, feet off the ground. Lean slightly over the bar, bend your elbows to dip down deep, then press back to straight arms.", cue: "Lean over the bar — brutal on shoulders and chest, in a good way." },
  { p: "verticalPush", lvl: 4, name: "Korean dip", req: ["lowBar"], reps: "3–6", mus: ["chest", "triceps", "shoulders"], how: "Stand with your back to the bar and grip it behind your hips, hands facing back. Support your weight on straight arms with legs out in front, then bend your elbows to dip down and press back up.", cue: "Extreme shoulder stretch — ease into the depth over several sessions." },
  { p: "verticalPush", lvl: 4, name: "Handstand push-up negative", req: [], reps: "3–5 slow", mus: ["shoulders", "triceps", "abs"], how: "Kick up into a handstand against a wall. Bend your elbows to lower the top of your head to the ground as slowly as you can — aim for 5 seconds — then come down, reset, and kick back up.", cue: "The slow lower IS the exercise. Fight every centimetre." },
  { p: "verticalPush", lvl: 2, name: "Lever shoulder press — slow tempo", req: ["shoulderPressM"], reps: "10–12", mus: ["shoulders", "triceps"], how: "Sit in the machine with your back against the pad and grip the handles beside your shoulders. Press up for a count of 1, then lower for a slow count of 3 and pause for 1 second at the bottom before the next rep.", cue: "The light fixed load only becomes training when you slow down — never let the handles drop." },
  { p: "verticalPush", lvl: 3, name: "Single-arm lever shoulder press", req: ["shoulderPressM"], reps: "8–12 / side", mus: ["shoulders", "triceps", "abs"], how: "Sit in the machine with your back against the pad and hold one handle beside your shoulder — say your right hand — with your left hand resting on your thigh. Press the right handle up until your arm is straight, lower slowly, and finish all reps before switching to your left arm.", cue: "Don't lean away from the working arm — your trunk stays square and tall." },
  { p: "verticalPush", lvl: 4, name: "Single-arm lever shoulder press — 5-second lowering", req: ["shoulderPressM"], reps: "6–8 / side", mus: ["shoulders", "triceps", "abs"], how: "Sit in the machine with your back against the pad and hold one handle beside your shoulder — say your right hand. Press up, hold the top for 2 seconds, then take a full 5 seconds to lower and pause at the bottom for 2 seconds. Finish all reps, then switch to your left arm.", cue: "Count the 5 out loud — the lowering is the exercise." },
  { p: "verticalPush", lvl: 2, name: "Log lift — slow lowering", req: ["logLift"], reps: "8–10", mus: ["shoulders", "triceps", "abs"], how: "Stand under the log with feet hip-width apart and grip it with both hands just outside your shoulders. Press it overhead until your arms are straight, then take 3 seconds to lower it back to your shoulders.", cue: "Squeeze your glutes so your lower back doesn't arch as the log goes up." },
  { p: "verticalPush", lvl: 3, name: "Log lift — split stance with overhead pause", req: ["logLift"], reps: "8–10", mus: ["shoulders", "triceps", "abs", "glutes"], how: "Stand under the log in a short split stance — say left foot forward, right foot back — and grip it just outside your shoulders. Press it overhead, hold 2 seconds with arms straight, then lower slowly. Halfway through the set, swap so your right foot is forward.", cue: "Ribs down, glutes tight — the split stance exposes any lean back." },
  { p: "verticalPush", lvl: 4, name: "Log lift — 1¼ reps", req: ["logLift"], reps: "6–8", mus: ["shoulders", "triceps", "abs"], how: "Stand under the log with feet hip-width apart and grip it just outside your shoulders. Press it halfway up, lower it back to your shoulders, then press all the way to straight arms — that whole sequence is one rep. Lower slowly each time.", cue: "Make the bottom quarter deliberate; that's where the press usually stalls." },
  { p: "verticalPush", lvl: 1, name: "Wall pike press", req: [], reps: "8–12", mus: ["shoulders", "triceps"], how: "Stand facing a wall or sturdy post about one big step away. Place your hands on it at head height, shoulder-width apart, then walk your feet back and bend at the hips until your arms and back make one straight line. Bend your elbows to bring the top of your head toward the wall between your hands, then press back.", cue: "Keep the hip bend the whole time — this is an overhead press at an angle, not a wall push-up." },
  { p: "verticalPush", lvl: 1, name: "Kneeling pike push-up", req: [], reps: "6–10", mus: ["shoulders", "triceps"], how: "Kneel on the ground and place your hands flat in front of you, shoulder-width apart, about a forearm's length ahead of your knees. Lift your hips so your weight shifts onto your hands. Bend your elbows to lower the top of your head toward the ground in front of your hands, then press back up.", cue: "Head travels forward of your hands, making a triangle with them — elbows point back, not out." },

  // ---- Vertical pull ----
  { p: "verticalPull", lvl: 1, name: "Dead hang + scapular pulls", req: ["highBar"], reps: "20–30s + 6 pulls", mus: ["forearms", "lats", "upperBack"], how: "Grab the high bar with both hands and hang with your feet off the ground and arms straight. After hanging, pull your shoulder blades down and together — your body rises a few centimetres — without bending your elbows. Lower and repeat.", cue: "Elbows stay locked straight; the movement comes only from the shoulder blades." },
  { p: "verticalPull", lvl: 1, name: "Prone lat pulldown", req: [], reps: "10–12", mus: ["lats", "upperBack"], how: "Lie face down with your arms stretched overhead, thumbs pointing up. Squeeze your back muscles to pull both elbows down toward your ribs — as if pulling an invisible bar to your chest — then reach back overhead.", cue: "Honestly activation-level work — it keeps the pattern in the session until you find a bar." },
  { p: "verticalPull", lvl: 1, name: "Lat pulldown (lever)", req: ["latPulldown"], reps: "12–15", mus: ["lats", "biceps", "upperBack"], how: "Sit in the machine, reach up and grip the handles, then pull them down toward your shoulders. Let them rise back up slowly.", cue: "Fixed light resistance — 3-second negatives, squeeze at the bottom of each rep." },
  { p: "verticalPull", lvl: 2, name: "Negative pull-up", req: ["highBar"], reps: "4–6 slow", mus: ["lats", "biceps", "forearms"], how: "Jump up so your chin is over the bar, then lower yourself down as slowly as possible — count to 5 — until your arms are completely straight. Drop off, rest a moment, and repeat.", cue: "Finish every rep at a full straight-arm hang before letting go." },
  { p: "verticalPull", lvl: 2, name: "Foot-assisted pull-up", req: ["lowBar"], reps: "6–10", mus: ["lats", "biceps", "upperBack"], how: "Grab the low bar overhead while keeping your feet on the ground beneath it, knees bent. Pull your chin over the bar, letting your legs push only as much as needed to complete the rep.", cue: "Use the smallest leg assist you can get away with — arms do the work." },
  { p: "verticalPull", lvl: 2, name: "Foot-assisted chin-up", req: ["lowBar"], reps: "6–10", mus: ["biceps", "lats", "upperBack"], how: "Grab the low bar with palms facing you, feet on the ground beneath it. Pull your chin over the bar, using your legs just enough to finish each rep.", cue: "Underhand grip puts your biceps in the fight — usually the easier variant." },
  { p: "verticalPull", lvl: 2, name: "Dead hang + scapular pulls (monkey bars)", req: ["monkeyBars"], reps: "20–30s + 6 pulls", mus: ["forearms", "lats", "upperBack"], how: "Hang from any rung of the monkey bars with straight arms, feet off the ground. Then pull your shoulder blades down so your body rises slightly, without bending your elbows.", cue: "Any overhead bar works — the shoulder blades do all the moving." },
  { p: "verticalPull", lvl: 3, name: "Chin-up", req: ["highBar"], reps: "6–10", mus: ["biceps", "lats", "upperBack"], how: "Grab the bar with palms facing toward you, about shoulder width. Hang with straight arms, then pull until your chin is over the bar, and lower all the way back down.", cue: "The friendlier grip for your first full reps — full hang between every one." },
  { p: "verticalPull", lvl: 3, name: "Pull-up", req: ["highBar"], reps: "5–10", mus: ["lats", "biceps", "upperBack", "forearms"], how: "Grab the bar with palms facing away from you, hands just wider than shoulders. Hang with straight arms, pull until your chin clears the bar, then lower with control to a full hang.", cue: "Pull your chest toward the bar, no leg kick, dead hang between reps." },
  { p: "verticalPull", lvl: 3, name: "Pull-up on monkey bars", req: ["monkeyBars"], reps: "5–10", mus: ["lats", "biceps", "upperBack", "forearms"], how: "Grip one rung of the monkey bars with palms facing each other and hang with straight arms. Pull your chin above the rung, then lower fully.", cue: "The neutral grip is often kinder on the elbows than a straight bar." },
  { p: "verticalPull", lvl: 4, name: "Archer pull-up", req: ["highBar"], reps: "3–5 / side", mus: ["lats", "biceps", "upperBack", "forearms"], how: "Take a very wide grip on the bar. Pull yourself up toward one hand, letting the other arm stay nearly straight along the bar, then lower and pull toward the other side.", cue: "The straight arm is doing real work — this is the road to one-arm pulling." },
  { p: "verticalPull", lvl: 4, name: "L-sit pull-up", req: ["highBar"], reps: "4–6", mus: ["lats", "biceps", "abs", "forearms"], how: "Hang from the bar and lift your legs until they point straight out in front of you at 90°. Hold them there while you pull your chin over the bar and lower back down.", cue: "The legs never drop — core and lats work as one unit." },
  { p: "verticalPull", lvl: 4, name: "One-arm pull-up progression", req: ["highBar"], reps: "2–4 / side", mus: ["lats", "biceps", "forearms", "upperBack"], how: "Grip the bar with one hand, and wrap your other hand around that wrist instead of the bar. Pull your chin over the bar; the wrist hand assists only as much as needed.", cue: "Slide the assisting hand lower on your forearm as you get stronger — a months-long project." },
  { p: "verticalPull", lvl: 2, name: "Lever pulldown — pause at the bottom", req: ["latPulldown"], reps: "10–12", mus: ["lats", "biceps", "upperBack"], how: "Sit in the machine and grip the handles above you with straight arms. Pull the handles down until your hands are beside your shoulders, hold there for 2 seconds while squeezing your shoulder blades down, then take 3 seconds to let them rise.", cue: "Start each rep by pulling your shoulders down away from your ears, then bend the elbows." },
  { p: "verticalPull", lvl: 3, name: "Single-arm lever pulldown", req: ["latPulldown"], reps: "8–12 / side", mus: ["lats", "biceps", "upperBack", "obliques"], how: "Sit in the machine and hold one handle above you — say with your right hand — with your left hand on your thigh. Pull the right handle down toward your right shoulder, then let it rise slowly. Finish the set, then switch to your left hand.", cue: "Drive the elbow down toward your back pocket; don't twist your trunk to help." },
  { p: "verticalPull", lvl: 4, name: "Single-arm lever pulldown — 5-second lowering", req: ["latPulldown"], reps: "6–8 / side", mus: ["lats", "biceps", "upperBack"], how: "Sit in the machine and hold one handle above you — say with your right hand. Pull it down to your shoulder, hold 3 seconds, then take a full 5 seconds to let it rise back to a straight arm. Finish all reps, then switch to your left hand.", cue: "Keep the shoulder down at the top — don't let the machine pull you into a shrug." },
  { p: "verticalPull", lvl: 1, name: "Reverse snow angel", req: [], reps: "8–10", mus: ["lats", "upperBack", "shoulders"], how: "Lie face down with your arms by your sides, palms facing the ground, and your forehead resting just off the ground. Lift your hands and chest slightly, then sweep both straight arms out to the sides and overhead in a wide arc, as if making a snow angel, and sweep them back to your hips.", cue: "Honest stand-in, not a pull-up — it wakes up the lats and upper back. Hands stay off the ground the whole arc." },

  // ---- Horizontal push ----
  { p: "horizontalPush", lvl: 1, name: "Incline push-up", req: ["bench"], reps: "10–15", mus: ["chest", "triceps", "shoulders"], how: "Put your hands on the bench, walk your feet back until your body is one straight line from head to heels, and do push-ups against the bench.", cue: "The higher the surface, the easier — full elbow lockout at the top of every rep." },
  { p: "horizontalPush", lvl: 1, name: "Incline push-up (low bar)", req: ["lowBar"], reps: "10–15", mus: ["chest", "triceps", "shoulders"], how: "Grip the low bar with both hands and walk your feet back until your body is a straight diagonal line. Lower your chest to the bar and press back up.", cue: "Walk your feet further back to make it harder, closer to make it easier." },
  { p: "horizontalPush", lvl: 1, name: "Lever chest press", req: ["chestPress"], reps: "12–15", mus: ["chest", "triceps", "shoulders"], how: "Sit in the machine with the handles at chest height and push them forward until your arms are straight. Let them come back slowly.", cue: "Fixed light resistance — slow tempo, 2-second pause with arms back at the stretch." },
  { p: "horizontalPush", lvl: 1, name: "Bench dip", req: ["bench"], reps: "8–15", mus: ["triceps", "chest", "shoulders"], how: "Sit on the edge of the bench, hands gripping the edge beside your hips. Slide your bottom off the bench with legs out in front, then bend your elbows to lower your hips toward the ground and press back up.", cue: "Dip until elbows hit 90°, shoulders pressed down away from the ears." },
  { p: "horizontalPush", lvl: 1, name: "Knee diamond push-up", req: [], reps: "8–12", mus: ["triceps", "chest"], how: "Kneel and place your hands together on the ground so your thumbs and index fingers form a diamond shape. Keeping knees down, lower your chest to your hands and press back up.", cue: "Elbows brush your ribs — this builds the triceps for the full version." },
  { p: "horizontalPush", lvl: 2, name: "Push-up", req: [], reps: "8–15", mus: ["chest", "triceps", "shoulders", "abs"], how: "Hands on the ground under your shoulders, legs straight behind you, body in one line. Lower your chest to just above the ground, then push back up.", cue: "Elbows at about 45° from your body, squeeze your glutes, chest leads the way down." },
  { p: "horizontalPush", lvl: 3, name: "Diamond push-up", req: [], reps: "6–12", mus: ["triceps", "chest"], how: "Do a push-up with your hands together under your chest, thumbs and index fingers touching to form a diamond. Lower your chest to your hands and press up.", cue: "Elbows stay tight to the ribs the whole way — this is a triceps exercise." },
  { p: "horizontalPush", lvl: 3, name: "Deficit push-up", req: ["pushupBars"], reps: "8–12", mus: ["chest", "triceps", "shoulders"], how: "Grip the push-up handles and do push-ups, letting your chest sink below the level of your hands at the bottom.", cue: "That extra depth below the handles is the whole point — control it." },
  { p: "horizontalPush", lvl: 3, name: "Feet-elevated push-up", req: ["bench"], reps: "8–12", mus: ["chest", "shoulders", "triceps"], how: "Put your feet up on the bench and your hands on the ground, and do push-ups from that downhill position.", cue: "Shifts the load up toward your shoulders and upper chest." },
  { p: "horizontalPush", lvl: 3, name: "Parallel bar dip", req: ["parallelBars"], reps: "6–10", mus: ["chest", "triceps", "shoulders"], how: "Stand between the bars, grip one with each hand, and jump up to support yourself on straight arms. Bend your elbows to lower your body until your shoulders drop below your elbows, then press back up.", cue: "A slight forward lean keeps the chest working and the shoulders happy." },
  { p: "horizontalPush", lvl: 4, name: "Archer push-up", req: [], reps: "4–6 / side", mus: ["chest", "triceps", "shoulders"], how: "Set your hands much wider than usual. Lower your chest toward one hand, letting the other arm straighten out to the side, then press up and repeat toward the other hand.", cue: "The straight arm stays straight — you're pressing almost all your weight with one side." },
  { p: "horizontalPush", lvl: 4, name: "Feet-elevated diamond push-up", req: ["bench"], reps: "6–10", mus: ["triceps", "chest", "shoulders"], how: "Feet up on the bench, hands in a diamond shape on the ground under your chest. Lower your chest to your hands and press up.", cue: "Maximum triceps load available without weights." },
  { p: "horizontalPush", lvl: 4, name: "Pseudo-planche push-up", req: ["pushupBars"], reps: "4–8", mus: ["shoulders", "chest", "triceps", "abs"], how: "Grip the handles positioned down by your hips rather than your shoulders, and lean your whole body far forward so your shoulders are in front of your hands. Do push-ups from that leaned position.", cue: "The further the lean, the harder — toes should feel almost weightless." },
  { p: "horizontalPush", lvl: 2, name: "Lever chest press — slow tempo", req: ["chestPress"], reps: "10–12", mus: ["chest", "triceps", "shoulders"], how: "Sit in the machine with your back against the pad and grip the handles at chest height. Push them forward until your arms are straight, then take 3 seconds to bring them back and pause 1 second before the next rep.", cue: "Shoulder blades stay pinned to the pad — push with the chest, not by rolling the shoulders forward." },
  { p: "horizontalPush", lvl: 3, name: "Single-arm lever chest press", req: ["chestPress"], reps: "8–12 / side", mus: ["chest", "triceps", "shoulders", "obliques"], how: "Sit with your back against the pad and hold one handle at chest height — say with your right hand — left hand resting on your thigh. Press the right handle forward until your arm is straight, return slowly, finish the set, then switch to your left arm.", cue: "Your torso must not rotate toward the working side — brace as if someone is about to push you." },
  { p: "horizontalPush", lvl: 4, name: "Single-arm lever chest press — pause and 5-second return", req: ["chestPress"], reps: "6–8 / side", mus: ["chest", "triceps", "shoulders"], how: "Sit with your back against the pad and hold one handle at chest height — say with your right hand. Press forward, hold the straight-arm position for 2 seconds, take 5 seconds to return, then pause 2 seconds with the handle near your chest. Finish all reps, then switch arms.", cue: "The pause at the chest is the hardest part — no bouncing out of it." },
  { p: "horizontalPush", lvl: 1, name: "Knee push-up on push-up bars", req: ["pushupBars"], reps: "8–12", mus: ["chest", "triceps", "shoulders"], how: "Kneel facing the push-up bars and grip one with each hand, wrists straight, then walk your knees back until your body is a straight line from knees to head. Bend your elbows to lower your chest between the bars, then push back up.", cue: "Grip the bars firmly and keep your elbows at about 45° from your body." },
  { p: "horizontalPush", lvl: 2, name: "Push-up on push-up bars", req: ["pushupBars"], reps: "8–15", mus: ["chest", "triceps", "shoulders", "abs"], how: "Grip one push-up bar in each hand and step your feet back into a plank, body straight from head to heels. Lower your chest to the height of the bars, then push back up.", cue: "Squeeze your glutes and thighs so your hips don't sag or pike." },
  { p: "horizontalPush", lvl: 1, name: "Wall push-up", req: [], reps: "10–15", mus: ["chest", "triceps", "shoulders"], how: "Stand facing a wall or sturdy post about one arm's length away and place your hands on it at chest height, a little wider than your shoulders. Keeping your body in one straight line from head to heels, bend your elbows to bring your chest toward the wall, then push back.", cue: "Step your feet further back to make it harder — keep your heels down and hips in line." },
  { p: "horizontalPush", lvl: 1, name: "Knee push-up", req: [], reps: "8–12", mus: ["chest", "triceps", "shoulders"], how: "Kneel on the ground and place your hands flat, a little wider than your shoulders. Walk your hands forward until your body is a straight line from knees to head. Bend your elbows to lower your chest toward the ground, then push back up.", cue: "Hips stay in line with your shoulders and knees — don't leave your bottom up in the air." },

  // ---- Horizontal pull ----
  { p: "horizontalPull", lvl: 1, name: "Incline row", req: ["lowBar"], reps: "8–12", mus: ["upperBack", "lats", "biceps"], how: "Grip the bar at about chest height, lean back with straight arms and your body in a straight line, heels on the ground. Pull your chest to the bar, then lower back with control.", cue: "Body stays rigid like a plank — pull with the back, not a hip heave." },
  { p: "horizontalPull", lvl: 1, name: "Incline row on parallel bars", req: ["parallelBars"], reps: "8–12", mus: ["upperBack", "lats", "biceps"], how: "Grip one of the parallel bars with both hands and lean back with straight arms at a comfortable angle, heels on the ground, body in one line. Pull your chest to the bar, then lower back with control.", cue: "Stand more upright to make it easier; walk your feet forward to make it harder." },
  { p: "horizontalPull", lvl: 1, name: "Prone Y-T-W raise", req: [], reps: "6–8 per letter", mus: ["upperBack", "shoulders"], how: "Lie face down on the ground with your arms stretched overhead in a Y shape, thumbs pointing up. Lift both arms off the ground and lower them. Move your arms out to the sides into a T and lift again. Then bend your elbows into a W shape and lift again. That's one round.", cue: "Small lifts, shoulder blades squeezing — no equipment needed, keeps the pulling muscles alive." },
  { p: "horizontalPull", lvl: 2, name: "Horizontal row", req: ["lowBar"], reps: "6–12", mus: ["upperBack", "lats", "biceps"], how: "Grip a waist-height bar and walk your feet forward until your body is nearly flat under it, heels on the ground, arms straight. Pull your chest up to the bar and lower down slowly.", cue: "The flatter your body, the harder it gets." },
  { p: "horizontalPull", lvl: 2, name: "Row under parallel bars", req: ["parallelBars"], reps: "6–12", mus: ["upperBack", "lats", "biceps"], how: "Lie under one of the parallel bars and grip it with both hands. Walk your feet forward until your body is nearly flat, then pull your chest to the bar and lower back down.", cue: "Squeeze your shoulder blades together at the top of every rep." },
  { p: "horizontalPull", lvl: 3, name: "Feet-elevated row", req: ["lowBar", "bench"], reps: "6–10", mus: ["upperBack", "lats", "biceps"], how: "Set up a row under the low bar, but put your heels up on the bench so your body hangs flat below the bar. Pull your chest to the bar and lower with control.", cue: "The hardest standard row — your whole bodyweight is now in your hands." },
  { p: "horizontalPull", lvl: 3, name: "Wide-grip row", req: ["lowBar"], reps: "6–10", mus: ["upperBack", "lats", "biceps"], how: "Do a horizontal row but with your hands set much wider than your shoulders. Pull your upper chest to the bar with elbows flared out, then lower slowly.", cue: "Wide grip shifts the work to the upper back and rear shoulders." },
  { p: "horizontalPull", lvl: 4, name: "Archer row", req: ["lowBar"], reps: "4–6 / side", mus: ["upperBack", "lats", "biceps"], how: "Take a wide grip on the bar in a row position. Pull your chest toward one hand while the other arm stays straight along the bar, then lower and pull toward the other side.", cue: "One arm is doing nearly everything — the path to the one-arm row." },
  { p: "horizontalPull", lvl: 4, name: "Tuck front-lever row", req: ["highBar"], reps: "4–6", mus: ["lats", "upperBack", "abs", "biceps"], how: "Hang from the high bar, pull your knees to your chest, and lean back until your back is flat and facing the ground — body horizontal, knees tucked. From there, pull the bar to your hips and lower back to straight arms, all while staying horizontal.", cue: "Hold the horizontal body line the entire time — that's the exercise inside the exercise." },
  { p: "horizontalPull", lvl: 1, name: "Swiss ladder row", req: ["swissLadder"], reps: "8–12", mus: ["upperBack", "lats", "biceps"], how: "Stand facing the Swiss ladder and grip a rung at chest height with both hands. Walk your feet a small step toward the ladder and lean back until your arms are straight, body in one line from head to heels. Pull your chest to the rung, then lower slowly.", cue: "The closer your feet are to the ladder, the harder it gets — adjust until the last 2 reps are tough." },
  { p: "horizontalPull", lvl: 2, name: "Swiss ladder row (low rung)", req: ["swissLadder"], reps: "6–12", mus: ["upperBack", "lats", "biceps"], how: "Stand facing the Swiss ladder and grip a rung at waist height with both hands. Walk your feet in close to the base and lean back until your arms are straight and your body is at a steep angle, one straight line from head to heels. Pull your chest to the rung, then lower slowly.", cue: "Pause for a second with your chest at the rung and your shoulder blades squeezed together." },
  { p: "horizontalPull", lvl: 1, name: "Supine elbow press", req: [], reps: "8–12 × 3s hold", mus: ["upperBack", "lats"], how: "Lie on your back with your knees bent and feet flat. Bend your elbows to 90° with your upper arms by your sides. Drive your elbows down into the ground to lift your upper back and shoulders a few centimetres off the ground, hold 3 seconds, then lower.", cue: "Honest floor stand-in for a row — squeeze your shoulder blades together as the elbows press down. A waist-height bar or railing unlocks real rows." },

  // ---- Knee-dominant ----
  { p: "kneeDominant", lvl: 1, name: "Bench squat", req: ["bench"], reps: "10–15", mus: ["quads", "glutes"], how: "Stand in front of the bench facing away from it, feet shoulder-width apart. Bend your knees and push your hips back to sit down until you lightly touch the bench, then stand straight back up.", cue: "Touch, don't rest — drive up through the middle of your feet." },
  { p: "kneeDominant", lvl: 1, name: "Air squat", req: [], reps: "12–20", mus: ["quads", "glutes"], how: "Stand with feet shoulder-width apart, toes slightly out. Bend your knees and push your hips back to lower down as far as comfortable — ideally until your thighs pass parallel to the ground — then stand back up.", cue: "Chest stays tall, heels stay planted." },
  { p: "kneeDominant", lvl: 1, name: "Leg press (lever)", req: ["legPressM"], reps: "12–15", mus: ["quads", "glutes"], how: "Sit in the machine with your feet on the plate and push it away until your legs are almost straight, then let it come back slowly.", cue: "Fixed light resistance — try one leg at a time with a slow tempo to make it count." },
  { p: "kneeDominant", lvl: 2, name: "Step-up", req: ["step"], reps: "8–10 / leg", mus: ["quads", "glutes"], how: "Place one whole foot on the platform and push through that leg to lift your body up on top, then step back down slowly. Finish all reps on one leg before switching.", cue: "The bottom foot is a passenger — no push-off from the ground leg." },
  { p: "kneeDominant", lvl: 2, name: "Single-leg step-down (Patrick step)", req: ["step"], reps: "8–10 / leg", mus: ["quads", "glutes", "calves"], how: "Stand on the platform on one leg, near the edge. Keeping your hips pushed forward (not stuck back), bend the standing knee — letting it travel forward over your toes — to lower the free heel down and lightly tap the ground, then push back up.", cue: "Hips stay forward, knee travels over the toes on purpose — that controlled range is what builds bulletproof knees." },
  { p: "kneeDominant", lvl: 2, name: "Split squat", req: [], reps: "8–12 / leg", mus: ["quads", "glutes"], how: "Take a long step forward and stay in that stance. Bend both knees to lower your back knee toward the ground, then push back up through your front foot without moving your feet.", cue: "Back knee kisses the ground, front shin stays near vertical." },
  { ath: "power", p: "kneeDominant", lvl: 2, name: "Jump squat", req: [], reps: "6–10", mus: ["quads", "glutes", "calves"], how: "Do a squat, but on the way up push hard enough to leave the ground. Land softly with bent knees and go straight into the next rep.", cue: "Land quiet, reach full hip extension at takeoff." },
  { p: "kneeDominant", lvl: 2, name: "Reverse lunge", req: [], reps: "8–10 / leg", mus: ["quads", "glutes"], how: "From standing, step one foot backward and bend both knees until the back knee nearly touches the ground. Push through the front heel to return to standing.", cue: "Easier on the knees than forward lunges — torso stays upright." },
  { p: "kneeDominant", lvl: 2, name: "Walking lunge", req: [], reps: "10–12 / leg", mus: ["quads", "glutes", "hamstrings"], how: "Step forward into a lunge, lowering the back knee toward the ground, then push off and step the back foot all the way through into the next lunge — walking forward with each rep.", cue: "Long controlled steps, torso tall — use the path beside the corner." },
  { p: "kneeDominant", lvl: 3, name: "Reverse Nordic", req: [], reps: "6–10", mus: ["quads", "abs"], how: "Kneel on soft ground or grass with your knees hip-width apart and your body upright from knees to head. Keeping your hips fully straight (no bending at the waist), lean your whole body backward as far as you can control, then squeeze your quads to pull yourself back upright.", cue: "Hips stay locked forward — the moment they bend, the quads stop working. Go shallow at first." },
  { p: "kneeDominant", lvl: 3, name: "ATG split squat", req: [], reps: "6–8 / leg", mus: ["quads", "glutes", "hamstrings"], how: "Take a long lunge stance and lower your back knee toward the ground while letting your front knee travel far forward over your toes, until your hamstring rests on your calf at the bottom. Push back up through the front foot. If you can't get that deep yet, put your front foot up on a step — elevation makes it easier.", cue: "Full depth with control beats partial depth with speed — front heel stays down." },
  { p: "kneeDominant", lvl: 3, name: "Bulgarian split squat", req: ["bench"], reps: "6–10 / leg", mus: ["quads", "glutes"], how: "Stand facing away from the bench and place the top of one foot behind you on it. Bend your front knee to lower straight down, then push back up through the front foot.", cue: "Slight forward torso lean, full control at the bottom — the king of single-leg work." },
  { p: "kneeDominant", lvl: 3, name: "Seated pistol squat", req: ["bench"], reps: "5–8 / leg", mus: ["quads", "glutes"], how: "Stand facing away from the bench on one leg, other leg held out in front. Sit back slowly onto the bench, pause, then stand back up using only the one leg.", cue: "No rocking to build momentum — pause fully, then stand. The pistol bridge." },
  { p: "kneeDominant", lvl: 4, name: "Assisted pistol squat", req: ["lowBar"], reps: "4–6 / leg", mus: ["quads", "glutes"], how: "Stand on one leg beside the bar, holding it lightly with your fingertips, other leg straight out in front. Squat all the way down on the standing leg, then push back up, using the bar only for balance.", cue: "Fingertips for balance, not a pull — the leg does the lifting." },
  { p: "kneeDominant", lvl: 4, name: "Pistol squat", req: [], reps: "3–6 / leg", mus: ["quads", "glutes"], how: "Stand on one leg with the other held straight out in front and arms reaching forward for balance. Squat all the way down on the standing leg, then stand back up.", cue: "Heel stays glued down; free leg stays off the ground the whole rep." },
  { p: "kneeDominant", lvl: 1, name: "Swiss ladder assisted squat", req: ["swissLadder"], reps: "10–15", mus: ["quads", "glutes"], how: "Stand facing the Swiss ladder, feet shoulder-width apart, and hold a rung at waist height with both hands. Sit your hips back and down as deep as is comfortable, using your hands only as much as you need, then stand back up.", cue: "Let the rung take some weight so you can sit deeper — chest up, heels down." },
  { p: "kneeDominant", lvl: 2, name: "Leg press (lever) — slow with pause", req: ["legPressM"], reps: "10–12", mus: ["quads", "glutes"], how: "Sit in the machine with your back against the pad and both feet flat on the footplate. Push the plate away until your legs are almost straight, then take 3 seconds to bend your knees back and pause 2 seconds at the bottom.", cue: "Stop just short of locking your knees — keep the tension on the legs, not the joints." },
  { p: "kneeDominant", lvl: 3, name: "Single-leg lever leg press", req: ["legPressM"], reps: "8–12 / leg", mus: ["quads", "glutes"], how: "Sit in the machine with your back against the pad and place one foot — say your right — in the middle of the footplate, with your left foot resting on the frame. Push the plate away with your right leg, return slowly, finish the set, then switch to your left leg.", cue: "Knee tracks in line with your middle toes — don't let it cave inward." },
  { p: "kneeDominant", lvl: 4, name: "Single-leg lever leg press — 5-second lowering", req: ["legPressM"], reps: "6–8 / leg", mus: ["quads", "glutes"], how: "Sit with your back against the pad and place one foot — say your right — in the middle of the footplate. Push the plate away, then take a full 5 seconds to bend the knee back and pause 2 seconds at the bottom. Finish all reps, then switch legs.", cue: "If the lowering speeds up, the set is over." },
  { p: "kneeDominant", lvl: 1, name: "Assisted squat (holding a post)", req: [], reps: "10–15", mus: ["quads", "glutes"], how: "Stand facing a post, pole or railing, feet shoulder-width apart, and hold it with both hands at waist height. Sit your hips back and down as far as is comfortable, using your hands to help, then stand back up.", cue: "Use your hands only as much as you need — chest up, heels flat, knees follow your toes." },
  { p: "kneeDominant", lvl: 1, name: "Wall sit", req: [], reps: "20–40s", mus: ["quads", "glutes"], how: "Stand with your back flat against a wall or post and walk your feet forward about two foot-lengths. Slide your back down until your knees are bent to a comfortable angle — no deeper than a chair seat — and hold.", cue: "Weight in your heels and knees over your ankles — go higher if your knees complain." },

  // ---- Hip-dominant ----
  { p: "hipDominant", lvl: 1, name: "Elephant walk", req: [], reps: "15–20 / side", mus: ["hamstrings", "lowerBack"], how: "Stand and fold forward at the hips, reaching your hands toward the ground (bend both knees as much as you need to touch). Then alternately straighten one knee at a time while the other bends, pressing each straightening leg's heel down — like slowly 'walking' in place while folded over. Keep breathing.", cue: "Over weeks, your hands get closer to flat on the floor — hamstrings and a healthy, mobile lower back in one drill." },
  { p: "hipDominant", lvl: 1, name: "Glute bridge", req: [], reps: "12–15", mus: ["glutes", "hamstrings"], how: "Lie on your back with knees bent and feet flat on the ground near your hips. Push through your heels to lift your hips up until your body is a straight line from knees to shoulders, then lower down.", cue: "Squeeze at the top for 2 counts; don't arch the lower back to get higher." },
  { p: "hipDominant", lvl: 2, name: "Single-leg glute bridge", req: [], reps: "8–12 / leg", mus: ["glutes", "hamstrings"], how: "Set up a glute bridge, then lift one foot off the ground and hold that leg up. Lift and lower your hips using only the planted leg.", cue: "Hips stay level — don't let the free side sag." },
  { p: "hipDominant", lvl: 2, name: "Seated good morning", req: ["bench"], reps: "10–15", mus: ["lowerBack", "hamstrings", "glutes"], how: "Sit on the edge of the bench with feet flat and wider than your hips, hands behind your head or crossed on your chest. Keeping your back flat, hinge your chest forward and down toward your thighs, then squeeze your lower back and hips to sit back up tall.", cue: "The slow, controlled hinge is direct lower-back strength most bodyweight training never touches." },
  { p: "hipDominant", lvl: 2, name: "Hip thrust on bench", req: ["bench"], reps: "10–15", mus: ["glutes", "hamstrings"], how: "Sit on the ground with your upper back against the edge of the bench, knees bent, feet flat. Drive through your heels to lift your hips until your thighs are level with the bench, then lower.", cue: "Full lockout at the top — chin tucked, ribs down." },
  { p: "hipDominant", lvl: 3, name: "Single-leg Romanian deadlift", req: [], reps: "8–10 / leg", mus: ["hamstrings", "glutes", "lowerBack"], how: "Stand on one leg with a soft knee. Hinge forward at the hips, letting your free leg swing straight back behind you, until your torso and back leg are near horizontal. Then squeeze your glute to stand back up.", cue: "Flat back — torso and back leg move together like one seesaw." },
  { p: "hipDominant", lvl: 3, name: "Single-leg hip thrust", req: ["bench"], reps: "6–10 / leg", mus: ["glutes", "hamstrings"], how: "Set up a hip thrust with your upper back on the bench, then lift one foot off the ground. Drive your hips to full height with the planted leg only.", cue: "Same full lockout as the two-leg version — no shortcuts on range." },
  { p: "hipDominant", lvl: 4, name: "Nordic curl negative", req: ["situpBench"], reps: "3–5 slow", mus: ["hamstrings", "glutes"], how: "Kneel on the ground facing away from the sit-up bench and hook your ankles under its foot pads. With hips straight, lower your whole body forward toward the ground as slowly as you can, catching yourself with your hands at the bottom. Push back up to kneeling and repeat.", cue: "As slow as humanly possible — the best hamstring builder that exists without weights." },
  { p: "hipDominant", lvl: 4, name: "Nordic curl negative (Swiss ladder)", req: ["swissLadder"], reps: "3–5 slow", mus: ["hamstrings", "glutes"], how: "Kneel facing away from the wall bars and hook your heels under a low rung. Keeping your hips straight, lower your body forward as slowly as possible, catching yourself with your hands.", cue: "Hips stay extended — bending at the waist is cheating the hamstrings." },
  { p: "hipDominant", lvl: 1, name: "Hip hinge wall tap", req: [], reps: "10–12", mus: ["hamstrings", "glutes", "lowerBack"], how: "Stand with your back to a wall, heels about a foot-length away from it, knees soft. Keeping your back flat, push your hips backward until your bottom taps the wall, then squeeze your glutes to stand tall.", cue: "Hips go back, not down — you should feel the stretch in the back of your thighs." },

  // ---- Core ----
  { p: "core", lvl: 1, name: "Plank", req: [], reps: "30–45s", mus: ["abs"], how: "Lie face down, then prop yourself up on your forearms and toes so your body makes one straight line from head to heels. Hold that position.", cue: "Glutes tight, ribs tucked down, breathe steadily behind the brace." },
  { p: "core", lvl: 1, name: "Dead bug", req: [], reps: "8–10 / side", mus: ["abs"], how: "Lie on your back with arms pointing at the ceiling and knees bent at 90° above your hips. Slowly lower one arm overhead and the opposite leg toward the ground at the same time, then bring them back and switch sides.", cue: "Your lower back stays glued to the ground the whole time — that's the test." },
  { p: "core", lvl: 1, name: "Side plank", req: [], reps: "20–30s / side", mus: ["obliques", "abs"], how: "Lie on your side, then prop yourself up on one forearm with your feet stacked, lifting your hips so your body is a straight line. Hold, then switch sides.", cue: "Hips stacked and lifted high — the sideways strength most people never train." },
  { p: "core", lvl: 1, name: "Bird dog", req: [], reps: "8–10 / side", mus: ["abs", "lowerBack", "glutes"], how: "Start on hands and knees. Reach one arm straight forward and the opposite leg straight back at the same time, hold for a second, then return and switch sides.", cue: "Hips stay square to the ground — imagine balancing a cup of kopi on your lower back." },
  { p: "core", lvl: 1, name: "Superman hold", req: [], reps: "20–30s", mus: ["lowerBack", "glutes"], how: "Lie face down with arms stretched overhead. Lift your arms, chest, and legs off the ground at the same time and hold.", cue: "Squeeze the glutes and everything along your spine — reach long, not high." },
  { p: "core", lvl: 2, name: "Hollow hold", req: [], reps: "20–30s", mus: ["abs"], how: "Lie flat on your back. Press your lower back into the ground, then lift your shoulders and legs a few centimetres off the floor, arms stretched overhead, so your body makes a shallow banana shape. Hold it.", cue: "If your lower back peels off the ground, bend your knees or raise your legs higher — that's the honest version." },
  { p: "core", lvl: 2, name: "Reverse plank", req: [], reps: "20–30s", mus: ["lowerBack", "glutes", "shoulders"], how: "Sit with legs straight and hands on the ground behind you, fingers pointing toward your feet. Push your hips up until your body is one straight line from heels to shoulders, facing the sky. Hold.", cue: "Push the hips high and let the front of the shoulders open up." },
  { p: "core", lvl: 2, name: "Seated leg lift hold", req: [], reps: "10–15s / leg", mus: ["abs", "quads"], how: "Sit on the ground with both legs straight out in front and hands on the ground beside your hips. Keeping one leg locked straight, lift that foot as high off the ground as you can and hold it there, then switch legs.", cue: "Hip flexor strength above 90° — the hidden ingredient in sprinting knee drive and pistol squats." },
  { p: "core", lvl: 2, name: "Side plank hip lift", req: [], reps: "8–12 / side", mus: ["obliques", "abs"], how: "Set up a side plank on your forearm with feet stacked. Instead of just holding, lower your hip toward the ground under control, then lift it back up as high as you can. That's one rep.", cue: "Moving through range beats holding still for building the side of your waist." },
  { p: "core", lvl: 2, name: "Russian twist", req: [], reps: "10–12 / side", mus: ["obliques", "abs"], how: "Sit on the ground, lean back slightly, and lift your feet so they hover. Clasp your hands and rotate your torso to touch the ground beside one hip, then the other.", cue: "Rotate the ribcage, not just the arms — slow beats fast here." },
  { p: "core", lvl: 2, name: "Incline sit-up", req: ["situpBench"], reps: "10–15", mus: ["abs"], how: "Lie back on the incline bench with your feet hooked under the pads, head at the low end. Curl your torso up toward your knees, then lower back down slowly.", cue: "The slow lower is where the work is — don't just flop back." },
  { p: "core", lvl: 2, name: "Hanging knee tuck hold", req: ["highBar"], reps: "15–20s", mus: ["abs", "forearms"], how: "Hang from the bar with straight arms, then pull your knees up to your chest and hold them there.", cue: "No swinging — squeeze the knees to the chest and stay still." },
  { p: "core", lvl: 2, name: "Swiss ladder knee raise", req: ["swissLadder"], reps: "10–15", mus: ["abs", "forearms"], how: "Face away from the wall bars, reach up and grip the top rung with your back resting against the bars. Lift your knees up toward your chest, then lower them slowly.", cue: "The bars behind you kill the swing — pure ab work." },
  { p: "core", lvl: 3, name: "Hollow rocks", req: [], reps: "10–15", mus: ["abs"], how: "Get into a hollow hold — shoulders and legs off the ground, lower back pressed down — then rock gently back and forth like a rocking chair without changing your shape.", cue: "The banana shape never breaks; the rock comes from momentum, not bending." },
  { p: "core", lvl: 3, name: "Bird dog plank", req: [], reps: "5–8 / side", mus: ["abs", "glutes", "lowerBack"], how: "Get into a full push-up-position plank. Lift one arm straight forward and the opposite leg straight back at the same time, hold for a second, return, and switch sides.", cue: "Hips dead level — harder than it looks, honest as they come." },
  { p: "core", lvl: 3, name: "L-hang", req: ["highBar"], reps: "10–20s", mus: ["abs", "forearms"], how: "Hang from the bar with straight arms, then lift both legs straight out in front of you until they're horizontal — your body makes an L shape. Hold.", cue: "Toes pointed, knees locked — the gateway to the L-sit." },
  { p: "core", lvl: 3, name: "Knee raise (captain's chair)", req: ["legRaise"], reps: "10–15", mus: ["abs"], how: "Rest your forearms on the pads of the leg raise station with your back against the backrest, legs hanging. Lift your knees toward your chest, then lower slowly.", cue: "Curl the pelvis up at the top — don't just swing the knees." },
  { p: "core", lvl: 3, name: "Hanging knee raise", req: ["highBar"], reps: "8–12", mus: ["abs", "forearms"], how: "Hang from the bar with straight arms and lift your knees up toward your chest, then lower them slowly without swinging.", cue: "Tilt the hips up slightly at the top of each rep, kill the swing at the bottom." },
  { p: "core", lvl: 4, name: "Hanging straight-leg raise", req: ["highBar"], reps: "6–10", mus: ["abs", "forearms"], how: "Hang from the bar and, keeping both legs completely straight, lift them until they're at least horizontal in front of you. Lower slowly.", cue: "Locked knees, zero swing — much harder than the knee version." },
  { p: "core", lvl: 4, name: "Toes-to-bar", req: ["highBar"], reps: "5–10", mus: ["abs", "lats", "forearms"], how: "Hang from the bar and lift your straight legs all the way up until your toes touch the bar between your hands, then lower with control.", cue: "Pull down with your lats as the legs come up — it's a whole-body pull." },
  { p: "core", lvl: 4, name: "L-sit on parallel bars", req: ["parallelBars"], reps: "10–20s", mus: ["abs", "triceps", "shoulders"], how: "Grip both parallel bars and press yourself up onto straight arms. Lift both legs straight out in front until horizontal, and hold your whole body off the bars in an L shape.", cue: "Press the shoulders down hard, lock the knees — a benchmark hold." },
  { p: "core", lvl: 4, name: "Hanging windshield wiper", req: ["highBar"], reps: "4–6 / side", mus: ["obliques", "abs", "forearms"], how: "Hang from the bar and lift your straight legs up toward it. Keeping them up, sweep both legs side to side like a windshield wiper, under control.", cue: "Elite rotation strength — small controlled arcs before big ones." },
  { p: "core", lvl: 1, name: "Captain's chair support hold", req: ["legRaise"], reps: "15–25s", mus: ["abs", "shoulders", "triceps"], how: "Step into the leg-raise station with your back against the pad and place your forearms on the arm pads, gripping the handles. Press down so your feet lift off the step, legs hanging straight, and hold.", cue: "Push the pads away so your shoulders stay down — no shrugging into your ears." },
  { p: "core", lvl: 2, name: "Captain's chair knee tuck (half range)", req: ["legRaise"], reps: "8–12", mus: ["abs"], how: "Support yourself in the leg-raise station with your forearms on the pads and your back against the pad. Lift your knees until your thighs are level with the ground, then lower slowly until your legs hang straight.", cue: "Lift with your stomach, not by swinging — pause for a second at the top." },
  { p: "core", lvl: 4, name: "Straight-leg raise (captain's chair)", req: ["legRaise"], reps: "6–10", mus: ["abs"], how: "Support yourself in the leg-raise station with your forearms on the pads and your back against the pad. Keeping your legs straight and together, lift them until they're level with the ground, then lower slowly.", cue: "No swinging — if your legs swing back past the pad, slow down." },
  { p: "core", lvl: 1, name: "Decline sit-up negative", req: ["situpBench"], reps: "6–10", mus: ["abs"], how: "Sit on the sit-up bench with your feet hooked under the anchor and knees bent. From sitting upright, slowly lower your back toward the bench over 3–4 seconds, then use your hands on your thighs to help yourself sit back up.", cue: "Curl down one segment of your back at a time — don't drop flat." },
  { p: "core", lvl: 3, name: "Twisting incline sit-up", req: ["situpBench"], reps: "8–10 / side", mus: ["obliques", "abs"], how: "Sit on the sit-up bench with your feet hooked under the anchor and lie back. Sit up, and as you rise, turn your chest so your right shoulder points toward your left knee; lower slowly, then turn the other way on the next rep.", cue: "The twist comes from your ribs, not from flinging an elbow." },
  { p: "core", lvl: 4, name: "Arms-overhead slow sit-up", req: ["situpBench"], reps: "6–10", mus: ["abs"], how: "Sit on the sit-up bench with your feet hooked under the anchor and lie back with both arms straight overhead beside your ears. Sit up without swinging your arms forward, then take 4 seconds to lower.", cue: "Arms stay beside your ears — the moment they swing forward, the rep gets easier." },
  { p: "core", lvl: 3, name: "Swiss ladder straight-leg raise", req: ["swissLadder"], reps: "6–10", mus: ["abs", "forearms"], how: "Stand with your back against the Swiss ladder and reach up to grip a rung above your head, so you hang with your back against the bars. Keeping your legs straight, lift them until they're level with the ground, then lower slowly.", cue: "Press your lower back into the bars at the top — no swinging." },
  { p: "core", lvl: 3, name: "Tuck hold on push-up bars", req: ["pushupBars"], reps: "10–20s", mus: ["abs", "triceps", "shoulders"], how: "Sit on the ground between the push-up bars and grip one in each hand. Press down to lift your bottom off the ground, then pull your knees toward your chest so only your hands touch, and hold.", cue: "Push the bars away — tall shoulders, back slightly rounded." },
  { p: "core", lvl: 1, name: "Kneeling plank", req: [], reps: "20–30s", mus: ["abs"], how: "Lie face down, then prop yourself up on your forearms with elbows under your shoulders. Keep your knees on the ground and lift your hips until your body is a straight line from knees to head, and hold.", cue: "Squeeze your glutes and pull your belly button in — no sagging hips." },
  { p: "core", lvl: 1, name: "Heel-tap dead bug", req: [], reps: "8–10 / side", mus: ["abs"], how: "Lie on your back with your arms pointing at the sky and your knees bent at 90° above your hips. Keeping your lower back pressed into the ground, slowly lower one foot — say your right — to tap your heel on the ground, bring it back, then do your left.", cue: "If your lower back lifts off the ground, don't lower the foot as far." },

  // ---- Grip / athletic ----
  { p: "gripAthletic", lvl: 1, name: "Timed dead hang", req: ["highBar"], reps: "max hold", mus: ["forearms", "lats"], how: "Grab the bar with both hands and simply hang with your feet off the ground for as long as you can. Note your time.", cue: "Relax everything except your grip — beat the number next session." },
  { ath: "power", p: "gripAthletic", lvl: 1, name: "Broad jump", req: [], reps: "5 jumps", mus: ["glutes", "quads", "calves"], how: "Stand with feet shoulder-width apart, swing your arms back, and jump forward as far as you can, landing on both feet with bent knees. Walk back and reset fully before the next jump.", cue: "Stick every landing quietly — distance with control, not chaos." },
  { p: "gripAthletic", lvl: 1, name: "Tibialis raise (wall lean)", req: [], reps: "20–25", mus: ["calves"], how: "Stand with your back against a wall or post and walk your heels about 30cm out, so you're leaning back slightly. Keeping your legs straight, lift your toes and the front of your feet as high as you can, pause 2 seconds, and lower.", cue: "Closer to the wall = easier, further = harder. Burn in the shins is the point — it's the muscle that protects your knees when you decelerate." },
  { p: "gripAthletic", lvl: 1, name: "Single-leg calf raise", req: ["step"], reps: "12–15 / leg", mus: ["calves"], how: "Stand with the ball of one foot on the edge of the step, heel hanging off, other foot lifted. Lower your heel below the step for a full stretch, then rise up onto your toes as high as you can.", cue: "Full stretch at the bottom, pause at the top — great ankle work too." },
  { p: "gripAthletic", lvl: 2, name: "Bent-knee calf raise (soleus)", req: ["step"], reps: "12–15 / leg", mus: ["calves"], how: "Stand on the edge of the step on the ball of one foot like a normal calf raise — but keep that knee bent about 30° the whole time. Lower the heel for a full stretch, then rise up, keeping the knee bent throughout.", cue: "The bent knee shifts the work to the soleus — the muscle that guards your Achilles. Runners, this one's yours." },
  { ath: "skill", p: "gripAthletic", lvl: 2, name: "Monkey bar traverse", req: ["monkeyBars"], reps: "1–2 lengths", mus: ["forearms", "lats", "shoulders"], how: "Hang from the first rung and travel to the far end by reaching one hand to the next rung, then the other, rung by rung.", cue: "Minimal swing, control the last rung — don't just drop." },
  { ath: "power", p: "gripAthletic", lvl: 2, name: "Box jump", req: ["step"], reps: "5–8", mus: ["glutes", "quads", "calves"], how: "Stand facing the platform, swing your arms, and jump up to land with both feet fully on top, knees bent. Step down — don't jump down — and reset.", cue: "Land soft in a quarter squat; stepping down saves your ankles for tomorrow." },
  { ath: "skill", p: "gripAthletic", lvl: 2, name: "Beam walk", req: ["beam"], reps: "2 lengths / direction", mus: ["calves", "abs"], how: "Step up onto the beam and walk slowly along it, placing one foot directly in front of the other, heel touching toe. Walk to the end, then come back.", cue: "Eyes ahead, not at your feet — add backwards passes when it gets easy." },
  { ath: "skill", p: "gripAthletic", lvl: 2, name: "Parallel bar support walk", req: ["parallelBars"], reps: "1–2 lengths", mus: ["shoulders", "triceps", "abs"], how: "Jump up between the parallel bars to support yourself on straight arms, feet off the ground. Travel to the far end by moving one hand forward at a time.", cue: "Shoulders pressed down away from the ears the whole trip." },
  { ath: "skill", p: "gripAthletic", lvl: 2, name: "Frog stand", req: [], reps: "15–30s", mus: ["forearms", "shoulders", "abs"], how: "Squat down and place your hands flat on the ground in front of you. Rest your knees on the backs of your bent elbows, then slowly lean forward until your feet float off the ground. Balance there.", cue: "Look at the ground ahead of your hands — the foundation for all hand balancing." },
  { ath: "skill", p: "gripAthletic", lvl: 4, name: "Skin the cat", req: ["highBar"], reps: "3–5", mus: ["lats", "shoulders", "abs", "forearms"], how: "Hang from the bar, tuck your knees to your chest, and keep rotating backward — lifting your hips up and over — until you've passed all the way through your arms and your feet point at the ground behind you. Then reverse the rotation back to a normal hang.", cue: "Go slow and own every degree — the best shoulder mobility work a corner offers." },
  { ath: "skill", p: "gripAthletic", lvl: 3, name: "Monkey bar traverse — there and back", req: ["monkeyBars"], reps: "1 round trip", mus: ["forearms", "lats", "shoulders"], how: "Traverse to the far end of the monkey bars, then — without dropping — turn your body around hand over hand at the last rung and traverse back to the start.", cue: "The turn is the skill: swap hands one at a time, stay calm through the spin." },
  { ath: "skill", p: "gripAthletic", lvl: 4, name: "Backward monkey bar traverse", req: ["monkeyBars"], reps: "1 length", mus: ["forearms", "lats", "shoulders"], how: "Traverse to the far end, then come back the way you came while still facing the same direction — reaching each hand behind you to the previous rung, moving backward without turning around.", cue: "You can't see where you're going — feel for each rung and keep the swing tiny." },
  { ath: "skill", p: "gripAthletic", lvl: 3, name: "Monkey bar traverse (skip rungs)", req: ["monkeyBars"], reps: "1–2 lengths", mus: ["forearms", "lats", "shoulders"], how: "Traverse the monkey bars, but reach past the next rung to grab the one after it — skipping every other rung.", cue: "Bigger reach means a bigger pull and a bigger grip demand." },
  { p: "gripAthletic", lvl: 3, name: "One-arm hang (assisted)", req: ["highBar"], reps: "10–15s / side", mus: ["forearms", "lats", "shoulders"], how: "Hang from the bar with one hand, and with the other hand grip your hanging wrist — or keep just two fingers on the bar. Hold, then switch sides.", cue: "Reduce the assist gradually over weeks — wrist grip, then fingers, then nothing." },
  { p: "gripAthletic", lvl: 4, name: "One-arm dead hang", req: ["highBar"], reps: "max / side", mus: ["forearms", "lats", "shoulders"], how: "Hang from the bar with one hand only, the other arm free, for as long as you can. Switch sides.", cue: "Shoulder packed, body quiet. Brutal and honest." },
  { ath: "elastic", p: "gripAthletic", lvl: 1, name: "Pogo hops", req: [], reps: "2 × 20", mus: ["calves"], how: "Stand tall and bounce up and down on the balls of your feet with your knees almost straight, using your ankles like springs. Small, quick, rhythmic hops — imagine the ground is hot.", cue: "Stiff ankles, minimal ground time — this is Achilles spring training, not jumping for height." },
  { ath: "elastic", p: "gripAthletic", lvl: 1, name: "Step toe taps", req: ["step"], reps: "2 × 20s", mus: ["quads", "calves", "abs"], how: "Stand facing the step. Quickly tap the top of it with the toes of one foot, then switch feet in a light hop, alternating in a running rhythm — like drumming the step with your feet.", cue: "Stay tall and light, knees driving up — build speed only while the rhythm stays crisp." },
  { ath: "elastic", p: "gripAthletic", lvl: 2, name: "Lateral line hops", req: [], reps: "2 × 15s", mus: ["calves", "quads", "glutes"], how: "Find a line or crack on the ground. With feet together, hop quickly side to side over it, staying on the balls of your feet.", cue: "Quick and quiet — think skipping rope sideways, not long jumping." },
  { ath: "elastic", p: "gripAthletic", lvl: 2, name: "Scissor jumps", req: [], reps: "3 × 6 / side", mus: ["quads", "glutes", "calves"], how: "Start in a lunge position. Jump straight up and switch your legs in the air, landing softly in a lunge with the other foot forward. Keep alternating.", cue: "Land soft with the back knee just off the ground — height comes after control." },
  { ath: "elastic", p: "gripAthletic", lvl: 3, name: "Lateral beam hops", req: ["beam"], reps: "3 × 5 / side", mus: ["calves", "quads", "glutes", "abs"], how: "Stand side-on to the low balance beam. With feet together, jump sideways over it and land on the other side, then jump straight back. Rebound with as little ground time as you can control.", cue: "Clear it clean and land quiet — if the beam feels high, start with a line on the ground." },
  { ath: "power", p: "gripAthletic", lvl: 1, name: "Sprint strides", req: [], reps: "4 × 40m", mus: ["glutes", "hamstrings", "calves"], how: "Find 40 metres of clear path. Run it at about 90% of your top speed with tall, relaxed form, then walk back slowly as your recovery. That's one stride.", cue: "Fast but smooth — you should finish each one feeling springy, not gassed." },
  { ath: "power", p: "gripAthletic", lvl: 2, name: "Lateral bound", req: [], reps: "4–6 / side", mus: ["glutes", "quads", "calves"], how: "Stand on one leg, then jump sideways as far as you can to land on the other leg, holding the landing for a second before bounding back the other way.", cue: "Stick each landing quietly on one foot — the hold is where the athleticism lives." },
  { ath: "power", p: "gripAthletic", lvl: 3, name: "Tuck jump", req: [], reps: "4–6", mus: ["quads", "glutes", "calves", "abs"], how: "From standing, jump as high as you can and pull both knees up toward your chest at the top, then land softly with bent knees. Reset fully between reps.", cue: "Height first, tuck second — land quiet or the rep doesn't count." },
  { ath: "power", p: "gripAthletic", lvl: 3, name: "Depth drop landing", req: ["step"], reps: "4–6", mus: ["quads", "glutes"], how: "Stand on the platform, step off (don't jump), and land on both feet in a quarter squat, absorbing the impact silently. Step back up and repeat.", cue: "The landing IS the exercise — teach your legs to be brakes before bigger jumps." },
  { ath: "power", p: "gripAthletic", lvl: 4, name: "Single-leg bound", req: [], reps: "3–5 / side", mus: ["glutes", "quads", "calves", "hamstrings"], how: "Standing on one leg, jump forward as far as you can and land on the same leg, sticking the landing before the next bound.", cue: "Elite-level tissue load — only after months of two-leg jumping and landing." },
  { ath: "skill", p: "gripAthletic", lvl: 1, name: "Backward walk", req: [], reps: "30–50m", mus: ["quads", "calves"], how: "Simply walk backward along a clear, flat stretch of path, pushing through your toes with each step. Glance over your shoulder regularly and keep the steps smooth.", cue: "The zero-equipment version of the reverse sled — gentle on knees while it strengthens them. Slight uphill is a bonus." },
  { ath: "skill", p: "gripAthletic", lvl: 1, name: "Bear crawl", req: [], reps: "10–15m", mus: ["shoulders", "abs", "quads"], how: "Get on hands and feet with your knees bent and hovering just off the ground. Crawl forward by moving your opposite hand and foot together, keeping your back flat and hips low.", cue: "Slow and level — imagine a cup of water balanced on your lower back." },
  { ath: "skill", p: "gripAthletic", lvl: 1, name: "Crab walk", req: [], reps: "10m each way", mus: ["triceps", "glutes", "shoulders"], how: "Sit on the ground, place your hands behind you and lift your hips so you're supported on hands and feet, belly facing the sky. Walk forward, then backward.", cue: "Hips stay lifted the whole way — great shoulder and glute wake-up." },
  { ath: "skill", p: "gripAthletic", lvl: 3, name: "Precision jump to beam", req: ["beam"], reps: "5–8", mus: ["quads", "calves", "abs"], how: "Stand a short, comfortable distance from the balance beam. Jump with both feet and land on the beam, sticking the landing with bent knees before stepping down. Increase the distance only when landings are perfect.", cue: "Accuracy over distance — a stuck landing from close beats a wobble from far." },
  { ath: "elastic", p: "gripAthletic", lvl: 1, name: "High knees + toe taps (bench)", req: ["bench"], reps: "2 × 20s", mus: ["quads", "calves", "abs"], how: "Stand facing the end of the bench, about half a step back. Drive your knees up quickly one at a time, tapping the top of the bench lightly with the ball of each foot before it comes back down, alternating in a light running rhythm.", cue: "Quick and light — the tap is a touch, not a stomp." },
  { ath: "power", p: "gripAthletic", lvl: 2, name: "Fast step-ups (step)", req: ["step"], reps: "10 / leg", mus: ["quads", "glutes", "calves"], how: "Stand facing the platform. Drive one foot up onto it and push through that leg to snap your whole body up fast, then step straight back down and immediately drive up again — same leg leads every rep, then switch.", cue: "Speed off the platform is the point — this is the explosive cousin of the slow step-up." },
  { ath: "power", p: "gripAthletic", lvl: 2, name: "Fast step-ups (bench)", req: ["bench"], reps: "10 / leg", mus: ["quads", "glutes", "calves"], how: "Stand facing the bench. Drive one foot up onto it and push through that leg to snap your whole body up fast, then step straight back down and immediately drive up again — same leg leads every rep, then switch.", cue: "Speed off the bench is the point — this is the explosive cousin of the slow step-up." },
  { ath: "power", p: "gripAthletic", lvl: 2, name: "Burpees", req: [], reps: "8–10", mus: ["chest", "quads", "glutes", "abs", "shoulders"], how: "Stand tall, then squat down and place both hands on the ground in front of your feet. Kick both feet back into a push-up position, do one push-up, then jump both feet back up to your hands and explode straight up into a jump, reaching overhead.", cue: "Land soft, chest up immediately — don't let the next rep start from a slump." },
  { ath: "power", p: "gripAthletic", lvl: 3, name: "Broad jump series", req: [], reps: "3 jumps × 3 sets", mus: ["glutes", "quads", "calves", "hamstrings"], how: "Stand with feet shoulder-width apart. Jump forward as far as you can, and the instant you land, without resetting or pausing, jump forward again — three jumps in a row, sticking only the final landing.", cue: "Absorb and fire immediately on jumps one and two — only the last landing gets to be quiet and controlled." },
  { ath: "power", p: "gripAthletic", lvl: 4, name: "Bounding skips", req: [], reps: "4 × 20m", mus: ["glutes", "hamstrings", "quads", "calves"], how: "Jog a few steps to get moving, then start driving one knee up high and pushing hard off the ground with the opposite leg, covering as much distance per stride as you can — an exaggerated, skipping bound down a straight line.", cue: "Distance per stride, not speed — hang in the air, then reach for the next stride." },
  { ath: "elastic", p: "gripAthletic", lvl: 3, name: "Single-leg lateral hops", req: [], reps: "3 × 8 / side", mus: ["calves", "quads", "glutes"], how: "Stand balanced on one leg. Hop sideways a short distance and land softly back on the same leg, then hop back to the start — small, quick, controlled hops staying on that one leg for the whole set before switching sides.", cue: "Quiet landings, ankle doing the work — bigger hops only once every landing is silent." },
  { ath: "elastic", p: "gripAthletic", lvl: 4, name: "Single-leg pogo hops", req: [], reps: "2 × 15 / side", mus: ["calves"], how: "Stand balanced on one leg with the other lifted slightly off the ground. Bounce up and down on the ball of that one foot with a nearly straight knee, using your ankle like a spring, small and quick.", cue: "Stiff ankle, minimal ground time — the hardest version of the corner's easiest drill." },
  { ath: "skill", p: "gripAthletic", lvl: 3, name: "Single-leg hop-to-stick", req: [], reps: "5 / side", mus: ["quads", "glutes", "calves"], how: "Stand balanced on one leg. Hop forward a comfortable distance and land on that same leg, freezing completely still for two full seconds before the next hop — the other foot never touches down.", cue: "The stick is the exercise — a wobble or a tapping foot means the distance was too far." },
  { ath: "skill", p: "gripAthletic", lvl: 4, name: "Bear crawl with shoulder taps", req: [], reps: "6 / side", mus: ["abs", "shoulders", "quads"], how: "Get into a bear crawl position — hands under shoulders, knees hovering just off the ground. Without letting your hips rotate or your knees touch down, lift one hand and tap the opposite shoulder, then place it back down and repeat on the other side.", cue: "Stillness in the hips is the whole test — the tap itself should feel almost boring." },
  { ath: "skill", p: "gripAthletic", lvl: 2, name: "Swiss ladder climb", req: ["swissLadder"], reps: "2–3 climbs", mus: ["forearms", "lats", "quads"], how: "Face the Swiss ladder and grip a rung at head height. Climb up three or four rungs, then climb back down, always keeping three points of contact — two hands and a foot, or two feet and a hand.", cue: "Move one limb at a time and look where your foot is going before you step." },
  { ath: "skill", p: "gripAthletic", lvl: 1, name: "Single-leg beam balance", req: ["beam"], reps: "20–30s / leg", mus: ["calves", "abs"], how: "Step up onto the low beam with both feet, arms out to the sides. Lift one foot — say your right — and balance on your left leg for the full time, then switch legs. Step off whenever you need to.", cue: "Eyes on a fixed point ahead; let your ankle make the tiny corrections." },
  { ath: "skill", p: "gripAthletic", lvl: 3, name: "Backward beam walk", req: ["beam"], reps: "2 lengths", mus: ["calves", "abs", "quads"], how: "Stand at one end of the beam with your back to the direction you'll walk, arms out to the sides. Step backward, placing the ball of each foot on the beam before the heel, until you reach the other end.", cue: "Feel for the beam with your toes before committing your weight." },
  { ath: "skill", p: "gripAthletic", lvl: 4, name: "Beam walk with squat touch", req: ["beam"], reps: "2 lengths", mus: ["quads", "calves", "abs"], how: "Walk forward along the beam with your arms out. Halfway along, slowly squat down until you can touch the beam with one hand, stand back up without stepping off, then finish the length.", cue: "Slow is the skill — rush the squat and you'll fall off." },
  { p: "gripAthletic", lvl: 1, name: "Wall-supported calf raise", req: [], reps: "15–20", mus: ["calves"], how: "Stand facing a wall or post with your fingertips resting on it for balance, feet hip-width apart. Rise up onto the balls of your feet as high as you can, pause for a second, then lower your heels slowly.", cue: "Take 2 seconds to lower — the slow way down does most of the work." },
];

/* ------------------------------------------------------------------ */
/* GENERATOR                                                           */
/* ------------------------------------------------------------------ */
const FOCUS = {
  full: { label: "Full body", patterns: ["verticalPull", "horizontalPush", "kneeDominant", "horizontalPull", "hipDominant", "core"], scope: null },
  upper: { label: "Upper body", patterns: ["verticalPush", "verticalPull", "horizontalPush", "horizontalPull", "core"], scope: ["shoulders", "chest", "triceps", "biceps", "lats", "upperBack", "lowerBack", "abs", "obliques", "forearms"] },
  lower: { label: "Lower body", patterns: ["kneeDominant", "hipDominant", "core", "gripAthletic"], scope: ["quads", "glutes", "hamstrings", "calves", "lowerBack", "abs", "obliques", "forearms"] },
  coreGrip: { label: "Core & grip", patterns: ["core", "gripAthletic", "core", "gripAthletic"], scope: ["abs", "obliques", "lowerBack", "forearms", "lats", "calves"] },
};
FOCUS.full.scope = Object.keys(MUSCLES);

// Full body alternates its vertical slot: pull-up day ↔ overhead-push day
// (decided per Generate from your last saved full-body session). Keeps the
// session at 6 stations while still training overhead pushing every other time.
function focusPatterns(focus, vslot) {
  const ps = FOCUS[focus].patterns;
  return focus === "full" && vslot === "push" ? ps.map((p) => (p === "verticalPull" ? "verticalPush" : p)) : ps;
}

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

// ---- Controlled variety ----
// Seeded RNG: the same seed always rebuilds the same workout (stable across
// re-renders and reloads); every Generate / New mix draws a fresh seed.
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function newSeed() { return Math.floor(Math.random() * 2147483647); }
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Order same-tier peers: (1) exercises that use equipment you ticked beat
// ground-only ones — "select what you see" means what you see gets used;
// (2) exercises not done recently; (3) seeded shuffle. Level still sets the
// floor — this only reorders one tier.
const usesEq = (e) => (e.req.length > 0 ? 1 : 0);
function orderPeers(peers, rng, avoid) {
  return peers
    .map((e) => ({ e, r: rng() }))
    .sort((a, b) => (usesEq(b.e) - usesEq(a.e)) || (avoid.has(a.e.name) - avoid.has(b.e.name)) || (a.r - b.r))
    .map((k) => k.e);
}

function eligible(pattern, level, eq) {
  return EXERCISES.filter(
    (e) => e.p === pattern && e.lvl <= level && e.req.every((r) => eq.includes(r))
  ).sort((a, b) => b.lvl - a.lvl);
}

function buildSession(focus, level, eq, adjs, mem, seed = 1, avoidList = [], vslot = "pull") {
  const used = new Set();
  const avoid = new Set(avoidList);
  return focusPatterns(focus, vslot).map((pattern, idx) => {
    // Per-station RNG so stepping one station never reshuffles the others.
    const rng = mulberry32((seed ^ hashStr(pattern + ":" + idx)) >>> 0);
    const effLevel = Math.min(4, Math.max(1, level + (adjs[idx] || 0) + ((mem && mem[pattern]) || 0)));
    let pool = eligible(pattern, effLevel, eq).filter((e) => !used.has(e.name));
    if (pool.length === 0) {
      // Nothing at or below this level — never drop a movement pattern.
      // Fall back to the easiest exercise this equipment supports, at any level.
      const any = EXERCISES.filter(
        (e) => e.p === pattern && !used.has(e.name) && e.req.every((r) => eq.includes(r))
      ).sort((a, b) => a.lvl - b.lvl);
      if (any.length === 0) return { pattern, missing: true, effLevel };
      pool = any.filter((e) => e.lvl === any[0].lvl);
    }
    // Swap moves sideways: only variants at the hardest available tier.
    // Easier tiers are reachable only via the level stepper.
    const topLvl = pool[0].lvl;
    const peers = orderPeers(pool.filter((e) => e.lvl === topLvl), rng, avoid);
    const pick = peers[0];
    used.add(pick.name);
    const next = EXERCISES.filter(
      (e) => e.p === pattern && e.lvl === pick.lvl + 1 && e.req.every((r) => eq.includes(r))
    )[0];
    const easier = EXERCISES.filter(
      (e) => e.p === pattern && e.lvl === pick.lvl - 1 && e.req.every((r) => eq.includes(r))
    )[0];
    return { pattern, pick, alternatives: peers, next, easier, effLevel };
  });
}

// Athletic block adapts to focus: upper-body days drop the reactive hop drill,
// core & grip days drop the max-effort jump.
const ATH_KINDS = { full: ["skill", "power", "elastic"], lower: ["skill", "power", "elastic"], upper: ["skill", "power"], coreGrip: ["skill", "elastic"] };
const ATH_LABEL = { skill: "Movement skill", power: "Explosive power", elastic: "Reactive / elastic" };
const memLabel = (p) => PATTERNS[p] || ({ "ath-skill": "Athletic · movement skill", "ath-power": "Athletic · power", "ath-elastic": "Athletic · reactive" })[p] || p;

function buildAthletic(level, eq, used, adjs, kinds = ATH_KINDS.full, mem = {}) {
  // 1 skill primer (coordination, low fatigue) + explosive drill(s), done while fresh.
  // Deterministic on purpose: power and skill improve by repeating drills, not rotating them.
  return kinds.map((kind, j) => {
    const key = "a" + j;
    const effLevel = Math.min(4, Math.max(1, level + (adjs[key] || 0) + (mem["ath-" + kind] || 0)));
    let pool = EXERCISES.filter(
      (e) => e.ath === kind && e.lvl <= effLevel && e.req.every((r) => eq.includes(r)) && !used.has(e.name)
    ).sort((a, b) => b.lvl - a.lvl);
    if (pool.length === 0) {
      const any = EXERCISES.filter(
        (e) => e.ath === kind && !used.has(e.name) && e.req.every((r) => eq.includes(r))
      ).sort((a, b) => a.lvl - b.lvl);
      if (any.length === 0) return { kind, missing: true, effLevel };
      pool = any.filter((e) => e.lvl === any[0].lvl);
    }
    const topLvl = pool[0].lvl;
    // Deterministic (see invariant 7), but ticked equipment still wins ties.
    const peers = pool.filter((e) => e.lvl === topLvl).sort((a, b) => usesEq(b) - usesEq(a));
    const pick = peers[0];
    used.add(pick.name);
    const next = EXERCISES.filter(
      (e) => e.ath === kind && e.lvl === pick.lvl + 1 && e.req.every((r) => eq.includes(r))
    )[0];
    const easier = EXERCISES.filter(
      (e) => e.ath === kind && e.lvl === pick.lvl - 1 && e.req.every((r) => eq.includes(r))
    )[0];
    return { kind, pick, alternatives: peers, next, easier, effLevel };
  });
}

// Resolve what each station actually DISPLAYS (swap offset applied), never
// showing an exercise that an earlier station already shows — "Core & grip"
// repeats patterns, so two stations can share a swap pool.
function resolvePicks(stations, swaps, keyFn, taken = []) {
  const t = new Set(taken);
  return stations.map((s, i) => {
    if (s.missing) return null;
    const n = s.alternatives.length;
    const off = swaps[keyFn(i)] || 0;
    let ex = s.alternatives[off % n];
    for (let k = 1; k < n && t.has(ex.name); k++) ex = s.alternatives[(off + k) % n];
    t.add(ex.name);
    return ex;
  });
}

const clampLvl = (v) => Math.min(4, Math.max(1, v));

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* STATION PLATE — shared by main stations and the athletic block      */
/* ------------------------------------------------------------------ */
function StationPlate({ note, num, eyebrow, ex, setsText, canSwap, onSwap, guideOpen, onToggleGuide, easierDisabled, harderDisabled, onEasier, onHarder, easier, next, sessionActive, doneAt, onDone }) {
  return (
    <div style={{ background: T.card, border: `2px solid ${T.line}`, borderLeft: `6px solid ${T.yellow}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div className="disp" style={{ background: T.green, color: T.yellow, fontWeight: 800, fontSize: String(num).length > 1 ? 20 : 26, width: 52, display: "grid", placeItems: "center" }}>
          {num}
        </div>
        <div style={{ padding: "10px 14px", flex: 1 }}>
          <div className="disp" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.steel }}>
            {eyebrow}
          </div>
          <div className="disp" data-station={ex.name} data-lvl={ex.lvl} style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.01em" }}>
            {ex.name}
          </div>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: T.green, marginTop: 2 }}>
            {setsText}
          </div>
          {note && (
            <div data-note style={{ fontSize: 12.5, color: T.safetyText, background: T.safetyBg, borderRadius: 6, padding: "6px 8px", marginTop: 6, lineHeight: 1.4 }}>
              {note}
            </div>
          )}
        </div>
        {sessionActive && (doneAt == null ? (
          <button
            onClick={onDone}
            className="disp"
            style={{ border: "none", borderLeft: `2px solid ${T.line}`, background: T.yellow, color: T.greenDark, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 14px" }}
          >
            Done
          </button>
        ) : (
          <div className="disp done-check-pop" style={{ borderLeft: `2px solid ${T.line}`, display: "grid", placeItems: "center", padding: "0 10px", color: T.green, fontWeight: 800, fontSize: 13 }}>
            ✓ at {Math.floor(doneAt / 60)}:{String(doneAt % 60).padStart(2, "0")}
          </div>
        ))}
        {canSwap && !sessionActive && (
          <button
            onClick={onSwap}
            className="disp"
            aria-label={`Swap ${ex.name}`}
            style={{
              border: "none", borderLeft: `2px solid ${T.line}`, background: "transparent",
              color: T.green, fontWeight: 700, fontSize: 13, textTransform: "uppercase",
              letterSpacing: "0.06em", padding: "0 12px",
            }}
          >
            Swap
          </button>
        )}
      </div>
      <div style={{ display: "flex", borderTop: `2px solid ${T.line}` }}>
        <button
          onClick={onEasier}
          disabled={easierDisabled}
          className="disp"
          style={{
            flex: 1, border: "none", borderRight: `2px solid ${T.line}`, background: "transparent",
            color: easierDisabled ? T.line : T.green, padding: "10px 0",
            fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em",
          }}
        >
          − Easier
        </button>
        <button
          onClick={onToggleGuide}
          className="disp"
          style={{
            flex: 1.3, border: "none", borderRight: `2px solid ${T.line}`,
            background: guideOpen ? "#E7EDE3" : "transparent",
            color: T.green, padding: "10px 0",
            fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em",
          }}
        >
          {guideOpen ? "Close guide −" : "Guide +"}
        </button>
        <button
          onClick={onHarder}
          disabled={harderDisabled}
          className="disp"
          style={{
            flex: 1, border: "none", background: "transparent",
            color: harderDisabled ? T.line : T.green, padding: "10px 0",
            fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em",
          }}
        >
          Harder +
        </button>
      </div>
      {guideOpen && (
        <div className="panel-reveal" style={{ borderTop: `3px solid ${T.greenDark}`, padding: "12px 14px" }}>
          <div className="disp" style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.green }}>
            Set up
          </div>
          <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.55, marginTop: 3 }}>{ex.how}</div>
          <div style={{ borderLeft: `3px solid ${T.orange}`, paddingLeft: 10, marginTop: 10 }}>
            <div className="disp" style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.orange }}>
              Form cue
            </div>
            <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, marginTop: 2 }}>{ex.cue}</div>
          </div>
          {ex.mus && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}>
              <AnatomyFig hit={new Set(ex.mus)} h={92} />
              <div style={{ fontSize: 12, color: T.steel, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.6 }}>
                {ex.mus.map((m) => MUSCLES[m]).join(" · ")}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12.5, color: T.steel, marginTop: 10, borderTop: `1px solid ${T.line}`, paddingTop: 8 }}>
            {easier && <><b style={{ color: T.green }}>Easier:</b> {easier.name}. </>}
            {next && <><b style={{ color: T.green }}>Next milestone:</b> {next.name}.</>}
          </div>
          <div style={{ background: T.safetyBg, color: T.safetyText, fontSize: 13, borderRadius: 6, padding: "8px 10px", marginTop: 10 }}>
            Stop if you feel sharp pain, dizziness, or can no longer control the movement.
          </div>
        </div>
      )}
    </div>
  );
}

function FitnessCornerGenerator() {
  const [step, setStep] = useState(0);
  const [eq, setEq] = useState(["highBar", "parallelBars", "situpBench", "bench"]);
  const [level, setLevel] = useState(2);
  const [focus, setFocus] = useState("full");
  const [sets, setSets] = useState(3);
  const [format, setFormat] = useState("circuit");
  const [warmup, setWarmup] = useState(true);
  const [power, setPower] = useState(false);
  const [mobility, setMobility] = useState(true);
  const [gen, setGen] = useState(() => ({ seed: newSeed(), avoid: [] })); // variety: seed + recently-done names to rotate away from
  const [swaps, setSwaps] = useState({}); // pattern-index -> offset
  const [adjs, setAdjs] = useState({}); // pattern-index -> level delta
  const [guides, setGuides] = useState({}); // pattern-index -> guide open
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [cooldownOpen, setCooldownOpen] = useState(false);
  const [athleticOpen, setAthleticOpen] = useState(false);

  // ---- Session logging prototype (persistent via window.storage) ----
  const hasStorage = typeof window !== "undefined" && !!window.storage;
  const [savedCorners, setSavedCorners] = useState({});
  const [log, setLog] = useState(null);
  const [patternMem, setPatternMem] = useState({});
  const streakRef = useRef({});
  const [phase, setPhase] = useState("idle"); // idle | running | rating
  const [startTs, setStartTs] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState({}); // station key -> elapsed seconds
  const [ratings, setRatings] = useState({}); // main station index -> easy|right|hard
  const [cornerName, setCornerName] = useState("");
  const [activeCorner, setActiveCorner] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [restEnd, setRestEnd] = useState(null); // timestamp when the current rest ends
  const [restFlash, setRestFlash] = useState(false); // "rest over" banner
  const audioRef = useRef(null);
  const [finisherLog, setFinisherLog] = useState({ hang: [], jump: [] });
  const [finisherInput, setFinisherInput] = useState("");
  const [finisherToday, setFinisherToday] = useState(null); // {type, value} recorded this session
  const [hasLastSetup, setHasLastSetup] = useState(false);

  useEffect(() => {
    if (!hasStorage) { setLog([]); return; }
    (async () => {
      try { const r = await window.storage.get("fc-corners"); setSavedCorners(JSON.parse(r.value)); } catch { setSavedCorners({}); }
      try { const r = await window.storage.get("fc-log"); setLog(JSON.parse(r.value)); } catch { setLog([]); }
      try { const r = await window.storage.get("fc-levels"); const v = JSON.parse(r.value); setPatternMem(v.mem || {}); streakRef.current = v.streak || {}; } catch { setPatternMem({}); streakRef.current = {}; }
      try { const r = await window.storage.get("fc-finisher"); const v = JSON.parse(r.value); setFinisherLog({ hang: v.hang || [], jump: v.jump || [] }); } catch { /* none yet */ }
      // Two-tap start: restore the last corner + session settings.
      try {
        const r = await window.storage.get("fc-settings"); const v = JSON.parse(r.value);
        if (Array.isArray(v.eq)) setEq(v.eq.filter((id) => EQUIPMENT.some((q) => q.id === id)));
        if ([1, 2, 3, 4].includes(v.level)) setLevel(v.level);
        if (FOCUS[v.focus]) setFocus(v.focus);
        if ([2, 3, 4, 5].includes(v.sets)) setSets(v.sets);
        if (v.format === "circuit" || v.format === "straight") setFormat(v.format);
        if (typeof v.warmup === "boolean") setWarmup(v.warmup);
        if (typeof v.power === "boolean") setPower(v.power);
        if (typeof v.mobility === "boolean") setMobility(v.mobility);
        if (typeof v.activeCorner === "string") setActiveCorner(v.activeCorner);
        setHasLastSetup(true);
      } catch { /* first visit — keep defaults */ }
      // Session safety: a reload (or iOS killing the tab) restores the
      // generated workout and any in-progress clock / ticks / ratings.
      try {
        const r = await window.storage.get("fc-active"); const a = JSON.parse(r.value);
        if (a.gen && typeof a.gen.seed === "number") setGen({ seed: a.gen.seed, avoid: Array.isArray(a.gen.avoid) ? a.gen.avoid : [], vslot: a.gen.vslot === "push" ? "push" : "pull" });
        if (a.swaps) setSwaps(a.swaps);
        if (a.adjs) setAdjs(a.adjs);
        if ((a.phase === "running" || a.phase === "rating") && a.startTs) {
          setPhase(a.phase); setStartTs(a.startTs); setNow(Date.now());
          setDone(a.done || {}); setRatings(a.ratings || {}); setStep(2);
          if (a.restEnd && a.restEnd > Date.now()) setRestEnd(a.restEnd);
          if (a.finisherToday) setFinisherToday(a.finisherToday);
        }
      } catch { /* nothing in progress */ }
      setSettingsLoaded(true);
    })();
  }, [hasStorage]);

  useEffect(() => {
    if (!hasStorage || !settingsLoaded) return;
    const v = { eq, level, focus, sets, format, warmup, power, mobility, activeCorner };
    window.storage.set("fc-settings", JSON.stringify(v)).catch((e) => console.warn(e));
  }, [hasStorage, settingsLoaded, eq, level, focus, sets, format, warmup, power, mobility, activeCorner]);

  useEffect(() => {
    if (!hasStorage || !settingsLoaded) return;
    const a = { phase, startTs, done, ratings, gen, swaps, adjs, restEnd, finisherToday };
    window.storage.set("fc-active", JSON.stringify(a)).catch((e) => console.warn(e));
  }, [hasStorage, settingsLoaded, phase, startTs, done, ratings, gen, swaps, adjs, restEnd, finisherToday]);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Keep the screen awake while a session runs (Screen Wake Lock API, where
  // supported — iOS 16.4+, Chrome/Android). Re-acquired when you come back to
  // the app, since the OS drops the lock whenever the page is hidden.
  const [wakeOn, setWakeOn] = useState(false);
  useEffect(() => {
    if (phase !== "running" || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock = null; let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) { lock.release(); return; }
        setWakeOn(true);
        lock.addEventListener("release", () => setWakeOn(false));
      } catch { setWakeOn(false); }
    };
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVis); if (lock) lock.release().catch(() => {}); setWakeOn(false); };
  }, [phase]);

  const { session, athletic } = useMemo(() => {
    const s = buildSession(focus, level, eq, adjs, patternMem, gen.seed, gen.avoid, gen.vslot);
    const used = new Set(s.filter((x) => !x.missing).map((x) => x.pick.name));
    const a = power ? buildAthletic(level, eq, used, adjs, ATH_KINDS[focus], patternMem) : [];
    return { session: s, athletic: a };
  }, [focus, level, eq, adjs, power, patternMem, gen]);

  const picks = useMemo(() => {
    const main = resolvePicks(session, swaps, (i) => i);
    const ath = resolvePicks(athletic, swaps, (j) => "a" + j, main.filter(Boolean).map((e) => e.name));
    return { main, ath, names: new Set([...main, ...ath].filter(Boolean).map((e) => e.name)) };
  }, [session, athletic, swaps]);

  useEffect(() => {
    if (!athletic.some((s) => !s.missing)) return;
    if (athletic.every((s, j) => s.missing || done["a" + j] != null)) setAthleticOpen(false);
  }, [done, athletic]);

  const elapsedSec = phase === "running" && startTs ? Math.floor((now - startTs) / 1000) : 0;
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startSession = () => { setPhase("running"); setStartTs(Date.now()); setNow(Date.now()); setDone({}); setRatings({}); setRestEnd(null); setFinisherToday(null); };

  // ---- Rest countdown: tap after a set/round; length follows the format ----
  const restLen = format === "straight" ? (level >= 3 ? 120 : 90) : 75;
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0;
  const beep = () => {
    try {
      const ctx = audioRef.current; if (!ctx) return;
      [0, 0.3].forEach((t) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22);
      });
    } catch { /* audio is a nice-to-have */ }
  };
  const startRest = (secs = restLen) => {
    // Create/unlock audio inside the tap (iOS only allows sound after a gesture).
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !audioRef.current) audioRef.current = new AC();
      if (audioRef.current && audioRef.current.state === "suspended") audioRef.current.resume();
    } catch { /* no audio */ }
    setRestFlash(false); setNow(Date.now()); setRestEnd(Date.now() + secs * 1000);
  };
  useEffect(() => {
    if (!restEnd || now < restEnd) return;
    setRestEnd(null); setRestFlash(true); beep();
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch { /* not supported (iOS) */ }
  }, [now, restEnd]);
  useEffect(() => {
    if (!restFlash) return;
    const id = setTimeout(() => setRestFlash(false), 4000);
    return () => clearTimeout(id);
  }, [restFlash]);

  // ---- Finisher record (dead hang seconds / broad jump cm) ----
  const finType = eq.includes("highBar") || eq.includes("monkeyBars") ? "hang" : "jump";
  const saveFinisher = async () => {
    const v = Math.round(Number(finisherInput));
    if (!v || v <= 0 || v > (finType === "hang" ? 900 : 400)) return;
    const rec = { date: new Date().toISOString(), value: v, corner: activeCorner || "" };
    const next = { ...finisherLog, [finType]: [rec, ...(finisherLog[finType] || [])].slice(0, 50) };
    setFinisherLog(next); setFinisherToday({ type: finType, value: v }); setFinisherInput("");
    if (hasStorage) { try { await window.storage.set("fc-finisher", JSON.stringify(next)); } catch (e) { console.error(e); } }
  };
  const markDone = (key) => setDone((d) => (d[key] != null ? d : { ...d, [key]: Math.floor((Date.now() - startTs) / 1000) }));
  const finishSession = () => setPhase("rating");
  const discardSession = () => { setPhase("idle"); setDone({}); setRatings({}); setRestEnd(null); };

  const writeCorners = async (next) => {
    setSavedCorners(next);
    if (hasStorage) { try { await window.storage.set("fc-corners", JSON.stringify(next)); } catch (e) { console.error(e); } }
  };

  const saveCorner = async () => {
    const name = cornerName.trim();
    if (!name) return;
    if (savedCorners[name] && !window.confirm(`"${name}" is already saved. Replace its equipment with what's ticked now?`)) return;
    setActiveCorner(name); setCornerName("");
    await writeCorners({ ...savedCorners, [name]: eq });
  };

  const renameCorner = async (oldName) => {
    const input = window.prompt(`Rename "${oldName}" to:`, oldName);
    const name = (input || "").trim();
    if (!name || name === oldName) return;
    if (savedCorners[name] && !window.confirm(`"${name}" already exists. Replace it with "${oldName}"?`)) return;
    const next = {};
    Object.entries(savedCorners).forEach(([k, v]) => { if (k !== oldName && k !== name) next[k] = v; else if (k === oldName) next[name] = v; });
    await writeCorners(next);
    if (activeCorner === oldName) setActiveCorner(name);
    // Keep history attached to the corner so rotation-by-corner still works.
    const nextLog = (log || []).map((en) => (en.corner === oldName ? { ...en, corner: name } : en));
    setLog(nextLog);
    if (hasStorage) { try { await window.storage.set("fc-log", JSON.stringify(nextLog)); } catch (e) { console.error(e); } }
  };

  const deleteCorner = async (name) => {
    if (!window.confirm(`Delete the saved corner "${name}"? Your workout history stays.`)) return;
    const next = { ...savedCorners }; delete next[name];
    await writeCorners(next);
    if (activeCorner === name) setActiveCorner("");
  };

  // ---- Backup: export / import every fc-* key as one JSON file ----
  const BACKUP_SKIP = ["fc-active"]; // transient in-progress state, not worth restoring
  const exportData = async () => {
    const data = {};
    try {
      const { keys } = await window.storage.list("fc-");
      for (const k of keys) {
        if (BACKUP_SKIP.includes(k)) continue;
        try { const r = await window.storage.get(k); data[k] = JSON.parse(r.value); } catch { /* skip unreadable key */ }
      }
    } catch (e) { console.error(e); }
    const stamp = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify({ app: "fitness-corner", format: 1, exportedAt: new Date().toISOString(), data }, null, 2);
    const fname = `fitness-corner-backup-${stamp}.json`;
    const blob = new Blob([json], { type: "application/json" });
    const standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    try {
      const file = new File([blob], fname, { type: "application/json" });
      if (standalone && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Fitness Corner backup" }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const importData = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || parsed.app !== "fitness-corner" || typeof parsed.data !== "object") throw new Error("not a Fitness Corner backup");
      const keys = Object.keys(parsed.data).filter((k) => k.startsWith("fc-") && !BACKUP_SKIP.includes(k));
      const when = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString("en-SG") : "unknown date";
      if (!window.confirm(`Replace your current corners, history and levels with the backup from ${when}? (${keys.length} item${keys.length === 1 ? "" : "s"})`)) return;
      for (const k of keys) await window.storage.set(k, JSON.stringify(parsed.data[k]));
      window.location.reload();
    } catch (e) {
      window.alert("Couldn't import that file: " + e.message);
    }
  };

  const saveSession = async () => {
    const stations = session.map((s, i) => {
      if (s.missing) return null;
      const ex = picks.main[i];
      return { pattern: s.pattern, name: ex.name, lvl: ex.lvl, doneAt: done[i] ?? null, rating: ratings[i] || null, adj: adjs[i] || 0 };
    }).filter(Boolean);
    // Athletic stations are rated, logged and auto-levelled like the others.
    const athStations = athletic.map((s, j) => {
      if (s.missing) return null;
      const ex = picks.ath[j]; const k = "a" + j;
      return { pattern: "ath-" + s.kind, name: ex.name, lvl: ex.lvl, doneAt: done[k] ?? null, rating: ratings[k] || null, adj: adjs[k] || 0, athletic: true };
    }).filter(Boolean);
    stations.unshift(...athStations);
    const entry = {
      date: new Date().toISOString(), corner: activeCorner || "Unnamed corner", focus: FOCUS[focus].label, vslot: focus === "full" ? (gen.vslot || "pull") : undefined,
      durationSec: startTs ? Math.floor((Date.now() - startTs) / 1000) : 0, stations, format,
      warmupAt: done["warmup"] ?? null, cooldownAt: done["cooldown"] ?? null,
      rounds: format === "circuit" ? Array.from({ length: sets }).map((_, r) => done["r" + r] ?? null) : null,
      finisher: finisherToday,
    };
    const nextLog = [entry, ...(log || [])].slice(0, 100);
    setLog(nextLog);
    // Auto-level memory, applied ONCE per pattern per session (Core & grip has
    // two stations per pattern — they must not double-count):
    // 1. Manual "Harder + / − Easier" steps are kept: the level you finished at
    //    becomes the new baseline for that pattern.
    // 2. Ratings: "too easy" in two consecutive sessions promotes; one "too hard"
    //    demotes. Any "hard" wins; "easy" only if every station of it was easy.
    const mem = { ...patternMem }; const streak = { ...streakRef.current };
    const byPat = {};
    stations.forEach((st) => {
      const b = byPat[st.pattern] || (byPat[st.pattern] = { adj: [], r: [] });
      b.adj.push(st.adj); if (st.rating) b.r.push(st.rating);
    });
    Object.entries(byPat).forEach(([p, { adj, r }]) => {
      const a = Math.round(adj.reduce((x, y) => x + y, 0) / adj.length);
      let m = (mem[p] || 0) + a;
      if (a !== 0) streak[p] = 0;
      const rating = r.includes("hard") ? "hard" : r.length && r.every((x) => x === "easy") ? "easy" : r.length ? "right" : null;
      if (rating === "easy") {
        streak[p] = (streak[p] || 0) + 1;
        if (streak[p] >= 2) { m += 1; streak[p] = 0; }
      } else if (rating === "hard") { m -= 1; streak[p] = 0; }
      else if (rating === "right") { streak[p] = 0; }
      mem[p] = Math.max(-3, Math.min(3, m));
    });
    setPatternMem(mem); streakRef.current = streak;
    if (hasStorage) {
      try { await window.storage.set("fc-log", JSON.stringify(nextLog)); } catch (e) { console.error(e); }
      try { await window.storage.set("fc-levels", JSON.stringify({ mem, streak })); } catch (e) { console.error(e); }
    }
    setPhase("idle"); setDone({}); setRatings({}); setAdjs({}); setSwaps({}); setRestEnd(null); setFinisherToday(null);
  };

  const resetData = async () => {
    if (!window.confirm("Delete ALL saved corners, workout history and auto-levels on this device? This can't be undone — export a backup first if unsure.")) return;
    setLog([]); setPatternMem({}); streakRef.current = {}; setSavedCorners({}); setHasLastSetup(false); setFinisherLog({ hang: [], jump: [] });
    if (hasStorage) { for (const k of ["fc-log", "fc-levels", "fc-corners", "fc-settings", "fc-finisher"]) { try { await window.storage.delete(k); } catch {} } }
  };

  const hitMuscles = useMemo(() => {
    const hit = new Set();
    [...picks.main, ...picks.ath].forEach((ex) => ex && (ex.mus || []).forEach((m) => hit.add(m)));
    return hit;
  }, [picks]);

  // Step from what's DISPLAYED (level + auto-memory + manual), so the button
  // state and the step always agree. adjs stores the delta vs level + memory.
  const bump = (key, d, memKey) =>
    setAdjs((a) => {
      const base = level + ((memKey && patternMem[memKey]) || 0);
      const next = clampLvl(clampLvl(base + (a[key] || 0)) + d);
      return { ...a, [key]: next - base };
    });

  // Changing equipment, focus or level rebuilds the workout — drop per-station
  // swaps/steps so they can't land on the wrong station.
  const resetTweaks = () => { setSwaps({}); setAdjs({}); };

  const toggle = (id) => {
    resetTweaks();
    setActiveCorner("");
    setEq((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const applyPreset = (p) => { resetTweaks(); setActiveCorner(""); setEq(p.eq); };

  // Fresh seed + rotate away from what you did last time at this corner and in
  // your most recent session. `extra` lets "New mix" also dodge today's picks.
  const regenerate = (corner = activeCorner, extra = []) => {
    const avoid = new Set(extra);
    const lg = log || [];
    const atCorner = corner ? lg.find((en) => en.corner === corner) : null;
    [atCorner, lg[0]].forEach((en) => en && (en.stations || []).forEach((st) => avoid.add(st.name)));
    // Full body: flip the vertical slot relative to the last saved full-body session.
    const lastFull = lg.find((en) => en.focus === FOCUS.full.label);
    const vslot = lastFull && !(lastFull.stations || []).some((st) => st.pattern === "verticalPush") ? "push" : "pull";
    setGen({ seed: newSeed(), avoid: [...avoid], vslot });
    setSwaps({}); setAdjs({});
  };

  // "Go": load a corner (or keep the current setup) and jump straight to a fresh workout.
  const go = (corner, eqList) => {
    if (eqList) { setEq(eqList); setActiveCorner(corner); }
    regenerate(eqList ? corner : activeCorner);
    setStep(2);
  };

  // Swap to the next peer that isn't already shown at another station.
  const doSwap = (key, s, current) =>
    setSwaps((sw) => {
      const n = s.alternatives.length;
      const off = sw[key] || 0;
      for (let k = 1; k <= n; k++) {
        const c = s.alternatives[(off + k) % n];
        if (c.name !== current.name && !picks.names.has(c.name)) return { ...sw, [key]: (off + k) % n };
      }
      return sw;
    });

  const restLine =
    format === "straight"
      ? "Rest 90–120s between sets. Complete all sets of one station before moving on."
      : "Circuit: one set at each station in order, loop back to station 1, repeat until all rounds are done. Rest 60–90s between rounds only.";

  // Warm-up/cool-down adapt to what the session actually trains today.
  // "Full body" naturally trips both (it spans upper + lower patterns) — full coverage by construction, not a special case.
  const todayPatterns = focusPatterns(focus, gen.vslot);
  const needsUpperPrep = todayPatterns.some((p) => ["verticalPush", "verticalPull", "horizontalPush", "horizontalPull"].includes(p));
  const needsLowerPrep = todayPatterns.some((p) => ["kneeDominant", "hipDominant", "gripAthletic"].includes(p));
  const needsGripPrep = todayPatterns.includes("gripAthletic");

  // ---- Warm-up / cool-down content: equipment + focus + level aware ----
  const byLvl = (arr) => arr[Math.min(level, arr.length) - 1];
  const hasBar = eq.includes("highBar") || eq.includes("monkeyBars");
  const warmupItems = [
    { n: level === 1 ? "Easy walk" : "Easy jog or brisk walk", d: byLvl(["3 min", "3 min", "3–4 min", "4–5 min"]), h: "To the corner or a lap around it — just enough to feel warm.", show: true },
    { n: "Arm circles", d: byLvl(["8 each way", "10 each way", "10 each way", "12 each way"]), h: "Stand tall and make big, slow circles with straight arms — forward first, then backward.", show: needsUpperPrep },
    { n: "Leg swings", d: byLvl(["8 / leg, each direction", "10 / leg, each direction", "10 / leg, each direction", "12 / leg, each direction"]), h: "Hold something for balance and swing one leg front-to-back, then side-to-side, then switch legs.", show: needsLowerPrep },
    { n: "Wrist circles + stretch", d: "10 each way + 15s", h: "Circle both wrists 10 times each direction. Then press your palms together in front of your chest with fingers pointing up, and lower your hands toward your waist, keeping palms together, until you feel a stretch across both forearms.", show: needsUpperPrep || needsGripPrep },
    { n: "Scap push-ups", d: byLvl(["", "8 reps", "10 reps", "10 reps"]), h: "Get into a push-up position (knees down is fine). Keeping your arms straight, let your chest sink so your shoulder blades squeeze together, then push the ground away to spread them apart.", show: needsUpperPrep && level >= 2 },
    { n: "Squat-to-stand", d: byLvl(["3 reps", "5 reps", "5 reps", "6 reps"]), h: "Bend down and grab your toes with straight-ish legs, then pull your hips down into a deep squat with your chest up, then straighten your legs back to the toe-grab. That's one rep.", show: needsLowerPrep },
    { n: "Heel walks + toe walks", d: byLvl(["10m each", "15m each", "15m each", "20m each"]), h: "Walk on your heels with your toes lifted high, then walk up on your tiptoes. Wakes up the shins, calves and ankles before they take load.", show: needsLowerPrep },
    { n: "Tibialis raise (wall lean)", d: byLvl(["8–10 reps", "10–12 reps", "10–12 reps", "12–15 reps"]), h: "Stand with your back against a wall or post and walk your heels about 30cm out, so you're leaning back slightly. Keeping your legs straight, lift your toes and the front of your feet as high as you can, then lower. A light prep set — the full working set shows up later if your session trains this pattern.", show: needsLowerPrep },
    { n: "World's Greatest Stretch", d: byLvl(["2 / side", "3 / side", "3 / side", "4 / side"]), h: "Step into a long lunge — say right foot forward — and place both hands on the ground inside your front foot. The arm on the same side as the front leg is the one that moves: keep the left hand planted and sweep your right arm up toward the sky, opening your chest toward your front-leg side and following the hand with your eyes. Bring it down, then swap sides — left foot forward, left arm up. Hip flexors, hamstrings, and upper-back rotation in one move.", show: true },
    { n: level === 1 ? "Supported bar hang" : "Easy bar hang", d: byLvl(["15s", "15s", "20s", "20s + 5 scap pulls"]), h: level === 1 ? "Hold the bar with your feet still on the ground or a step, and bend your knees to let some of your weight hang. Relax your shoulders and breathe." : "A relaxed hang to wake up the grip and shoulders." + (level >= 4 ? " Then, still hanging, pull your shoulder blades down 5 times without bending your elbows." : ""), show: needsUpperPrep && hasBar },
    { n: "Pogo hops (easy)", d: "2 × 10", h: "Small, springy hops on the balls of your feet with stiff ankles and soft knees — primes the calves and tendons for jumping.", show: needsLowerPrep && level >= 3 },
  ].filter((m) => m.show);
  const hold = (a) => byLvl(a);
  const cooldownItems = [
    {
      ...(hasBar
        ? { n: "Dead hang", d: hold(["20–30s", "30–45s", "45–60s", "60s"]), h: "Grab the bar and just hang with straight arms" + (level === 1 ? " — keep your toes on the ground if you need to." : ", feet off the ground.") + " Let your shoulders relax up toward your ears and breathe slowly — this decompresses the spine." }
        : { n: "Cross-body shoulder stretch", d: hold(["20s / side", "30s / side", "30s / side", "45s / side"]), h: "Stand tall and bring one straight arm across the front of your body at chest height. Use your other forearm to gently press it closer to your chest, then switch sides." }),
      show: needsUpperPrep,
    },
    { n: "Standing chest stretch", d: hold(["20s", "30s", "30–45s", "45s"]), h: "Stand tall, clasp your hands together behind your lower back, and straighten your arms. Lift your chest and gently raise your clasped hands away from your body until you feel a stretch across the front of your shoulders and chest.", show: needsUpperPrep },
    { n: "Overhead triceps stretch", d: hold(["20s / side", "30s / side", "30s / side", "45s / side"]), h: "Reach one arm straight up, then bend that elbow so your hand drops behind your head. Use your other hand to gently press on that elbow, then switch sides.", show: needsUpperPrep },
    { n: "Wrist + forearm stretch", d: hold(["15s / side, both ways", "20s / side, both ways", "20s / side, both ways", "30s / side, both ways"]), h: "Hold one arm straight out in front, palm up. Use your other hand to gently pull the fingers back toward you, then flip the palm down and gently pull the fingers down and in, feeling the stretch on both sides of the forearm before switching arms.", show: needsUpperPrep || needsGripPrep },
    { n: level === 1 ? "Supported deep squat hold" : "Deep squat hold", d: hold(["30s", "60s", "60–90s", "90s"]), h: (level === 1 ? "Hold a post or rail in front of you for balance. " : "") + "Squat all the way down until your bottom is near your heels, feet flat on the ground about shoulder width. Put your elbows inside your knees and gently press them outward. Hold and breathe.", show: needsLowerPrep },
    {
      ...(eq.includes("parallelBars") || eq.includes("lowBar")
        ? { n: "Supported hamstring hinge", d: hold(["30s", "60s", "60s", "60–90s"]), h: "Hold the bar with both hands at arm's length and step back. Keeping your back flat and knees almost straight, push your hips backward until you feel a stretch down the back of your thighs." }
        : eq.includes("bench")
          ? { n: "Supported hamstring hinge", d: hold(["30s", "60s", "60s", "60–90s"]), h: "Put both hands on a bench or ledge and step back. Keeping your back flat and knees almost straight, push your hips backward until the back of your thighs stretches." }
          : { n: "Standing forward fold", d: hold(["30s", "60s", "60s", "60–90s"]), h: "Stand with feet hip-width, bend your knees slightly, and fold forward at the hips, letting your head and arms hang heavy toward the ground. Sway gently." }),
      show: needsLowerPrep,
    },
    {
      ...(eq.includes("bench")
        ? { n: "Couch stretch", d: hold(["20–30s / side", "30–45s / side", "45s / side", "60s / side"]), h: "Kneel facing away from the bench and place the top of one foot up on its edge behind you, that knee on the ground, other foot planted in front. Tuck your tailbone and lift your chest tall until you feel a deep stretch down the front of the back leg's hip and thigh." }
        : { n: "Hip flexor stretch", d: hold(["20s / side", "30s / side", "45s / side", "60s / side"]), h: "Kneel on one knee like a marriage proposal, other foot flat in front. Tuck your tailbone under and shift your whole body slightly forward until you feel a stretch down the front of the hip on the kneeling side." }),
      show: needsLowerPrep,
    },
    { n: "Calf stretch", d: hold(["20s / side, ×2", "30s / side, ×2", "30s / side, ×2", "45s / side, ×2"]), h: "Hands against a post or wall, step one foot back with the heel down and that leg straight — hold. Then bend that back knee slightly, heel still down, to move the stretch lower into the calf — hold again. Switch legs.", show: needsLowerPrep },
    {
      ...(eq.includes("bench")
        ? { n: "Pigeon stretch (bench)", d: hold(["20–30s / side", "30–45s / side", "45s / side", "60s / side"]), h: "Stand facing the bench and lay one shin sideways along the top of it, knee and foot both resting on the bench. Keep your back leg straight behind you and lean your chest gently forward over the front shin until the outside of that hip stretches." }
        : { n: "Pigeon stretch (floor)", d: hold(["20–30s / side", "30–45s / side", "45s / side", "60s / side"]), h: "Sit and cross one ankle over the opposite knee in a figure-4 shape, then hug the bottom knee toward your chest until the outside of the crossed leg's hip stretches." }),
      show: needsLowerPrep,
    },
    { n: "Pancake or butterfly stretch", d: level >= 3 ? "60–90s" : "60s · optional", h: "Sit with your legs spread wide (pancake) or with the soles of your feet pressed together, knees out (butterfly). Keep your back long and lean your chest forward until the inner thighs stretch.", show: needsLowerPrep && level >= 2 },
  ].filter((m) => m.show);
  const blockStatus = (key, closeFn) => phase === "running" && (done[key] == null ? (
    <button onClick={() => { markDone(key); closeFn(false); }} className="disp" style={{ background: T.yellow, color: T.greenDark, border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>✓ Done</button>
  ) : (
    <span className="disp done-check-pop" style={{ color: T.green, fontWeight: 800, fontSize: 13 }}>✓ at {fmtT(done[key])}</span>
  ));

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink, fontFamily: "'Barlow', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&display=swap');
        .disp { font-family: 'Barlow Condensed', sans-serif; }
        button { cursor: pointer; }
        button:focus-visible { outline: 3px solid ${T.yellow}; outline-offset: 2px; }
        @keyframes panelReveal { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes doneCheckPop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        .panel-reveal { animation: panelReveal 0.18s ease-out; }
        .done-check-pop { display: inline-block; animation: doneCheckPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; }
          .panel-reveal, .done-check-pop { animation: none !important; }
        }
      `}</style>

      {/* ---------- Signage header ---------- */}
      <header style={{ background: T.green, borderBottom: `6px solid ${T.yellow}` }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 16px" }}>
          <div className="disp" style={{ color: T.yellow, fontWeight: 700, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Singapore · Park Connector Network
          </div>
          <h1 className="disp" style={{ color: "#fff", fontWeight: 800, fontSize: 34, lineHeight: 1.05, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.02em" }}>
            Fitness Corner<br />Workout Generator
          </h1>
        </div>
        {/* step tabs */}
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", padding: "0 20px" }}>
          {["Equipment", "Session", "Workout", "Library", "Log"].map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className="disp"
              style={{
                flex: 1, border: "none", padding: "10px 0", fontSize: 11.5, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.03em",
                background: step === i ? T.bg : T.greenDark,
                color: step === i ? T.green : "rgba(255,255,255,0.6)",
                borderRadius: "8px 8px 0 0", marginRight: i < 4 ? 4 : 0,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {step === 2 && phase === "running" && (
        <div data-restbar style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, background: restEnd ? T.yellow : T.greenDark, borderTop: `4px solid ${restEnd ? T.greenDark : T.yellow}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            {restEnd ? (
              <>
                <span className="disp" style={{ fontWeight: 800, fontSize: 30, color: T.greenDark, minWidth: 80 }}>{fmtT(restLeft)}</span>
                <span className="disp" style={{ flex: 1, fontWeight: 700, fontSize: 14, color: T.greenDark, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rest</span>
                <button onClick={() => setRestEnd((e) => e + 15000)} className="disp" style={{ minHeight: 44, background: "transparent", border: `2px solid ${T.greenDark}`, color: T.greenDark, borderRadius: 8, padding: "0 12px", fontWeight: 800, fontSize: 14 }}>+15s</button>
                <button onClick={() => setRestEnd(null)} className="disp" style={{ minHeight: 44, background: T.greenDark, border: "none", color: "#fff", borderRadius: 8, padding: "0 14px", fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>Skip</button>
              </>
            ) : (
              <>
                <span className="disp" style={{ flex: 1, color: restFlash ? T.yellow : "rgba(255,255,255,0.8)", fontWeight: 800, fontSize: restFlash ? 18 : 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {restFlash ? "Rest over — go! 💪" : format === "straight" ? "Finished a set?" : "Finished a round?"}
                </span>
                <button onClick={() => startRest()} className="disp" style={{ minHeight: 48, background: T.yellow, color: T.greenDark, border: "none", borderRadius: 10, padding: "0 18px", fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ⏱ Rest {fmtT(restLen)}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <main style={{ maxWidth: 560, margin: "0 auto", padding: step === 2 && phase === "running" ? "20px 20px 110px" : "20px 20px 60px" }}>
        {/* ================= STEP 1: EQUIPMENT ================= */}
        {step === 0 && (
          <>
            {hasLastSetup && (
              <button
                onClick={() => go()}
                className="disp"
                style={{ width: "100%", marginBottom: 14, background: T.yellow, color: T.greenDark, border: "none", borderRadius: 10, padding: "12px 14px", textAlign: "left", fontWeight: 800, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                ▶ Go — same as last time
                <div style={{ fontFamily: "'Barlow', system-ui, sans-serif", textTransform: "none", letterSpacing: 0, fontWeight: 500, fontSize: 13, marginTop: 2 }}>
                  {activeCorner ? `📍 ${activeCorner}` : `${eq.length} item${eq.length === 1 ? "" : "s"} ticked`} · {FOCUS[focus].label} · {LEVELS[level - 1]} · {sets} sets · {format === "straight" ? "straight sets" : "circuit"}
                </div>
              </button>
            )}
            <p style={{ fontSize: 15, color: T.steel, margin: "4px 0 6px" }}>
              Tap what you can see at this corner. Ground exercises are always included.
            </p>
            <p style={{ fontSize: 12.5, color: T.steel, margin: "0 0 14px" }}>
              Tai chi wheels, air walkers, body twisters and back massagers are common here but carry no trainable resistance — this generator skips them on purpose.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className="disp"
                  style={{
                    border: `2px solid ${T.green}`, background: "transparent", color: T.green,
                    borderRadius: 999, padding: "6px 14px", fontSize: 14, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => { resetTweaks(); setEq([]); setActiveCorner(""); }}
                className="disp"
                style={{
                  border: `2px dashed ${T.steel}`, background: "transparent", color: T.steel,
                  borderRadius: 999, padding: "6px 14px", fontSize: 14, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}
              >
                ✕ Clear
              </button>
            </div>
            {Object.keys(savedCorners).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="disp" style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: T.green, marginBottom: 6 }}>
                  My corners — tap Go to start
                </div>
                {Object.entries(savedCorners).map(([nm, eqList]) => (
                  <div key={nm} data-corner={nm} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <button
                      onClick={() => { resetTweaks(); setEq(eqList); setActiveCorner(nm); }}
                      className="disp"
                      style={{
                        flex: 1, textAlign: "left", minHeight: 44,
                        border: `2px solid ${activeCorner === nm ? T.green : T.line}`, background: activeCorner === nm ? T.green : T.card,
                        color: activeCorner === nm ? "#fff" : T.ink, borderRadius: 10, padding: "8px 12px",
                        fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                      }}
                    >
                      📍 {nm} <span style={{ fontWeight: 500, fontSize: 12, opacity: 0.75 }}>· {eqList.length} item{eqList.length === 1 ? "" : "s"}</span>
                    </button>
                    <button
                      onClick={() => go(nm, eqList)}
                      aria-label={`Go: workout at ${nm}`}
                      className="disp"
                      style={{ minWidth: 64, minHeight: 44, background: T.yellow, color: T.greenDark, border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em" }}
                    >
                      ▶ Go
                    </button>
                    <button
                      onClick={() => renameCorner(nm)}
                      aria-label={`Rename ${nm}`}
                      style={{ minWidth: 40, minHeight: 44, background: T.card, color: T.green, border: `2px solid ${T.line}`, borderRadius: 10, fontSize: 15 }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteCorner(nm)}
                      aria-label={`Delete ${nm}`}
                      style={{ minWidth: 40, minHeight: 44, background: T.card, color: T.safetyText, border: `2px solid ${T.line}`, borderRadius: 10, fontSize: 15 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {EQUIPMENT.map((e) => {
                const on = eq.includes(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    style={{
                      textAlign: "left", borderRadius: 10, padding: "12px 12px", position: "relative",
                      border: on ? `2px solid ${T.green}` : `2px solid ${T.line}`,
                      background: on ? T.green : T.card,
                      color: on ? "#fff" : T.ink,
                      transition: "background 0.15s, border 0.15s",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 18, height: 18, borderRadius: 4,
                        background: on ? T.yellow : "transparent",
                        border: on ? "none" : `2px solid ${T.line}`,
                        display: "grid", placeItems: "center",
                        color: T.greenDark, fontWeight: 800, fontSize: 13,
                      }}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <div style={{ color: on ? T.yellow : T.green, marginBottom: 4 }}>
                      <EquipIcon id={e.id} />
                    </div>
                    <div className="disp" style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>{e.label}</div>
                    <div style={{ fontSize: 12.5, marginTop: 4, color: on ? "rgba(255,255,255,0.75)" : T.steel }}>
                      {e.hint}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <input
                value={cornerName}
                onChange={(e) => setCornerName(e.target.value)}
                placeholder="Name this corner (e.g. Bedok Res PCN)"
                style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `2px solid ${T.line}`, fontSize: 14, fontFamily: "inherit", background: T.card }}
              />
              <button
                onClick={saveCorner}
                disabled={!cornerName.trim()}
                className="disp"
                style={{ background: cornerName.trim() ? T.green : T.line, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}
              >
                Save
              </button>
            </div>
            <button
              onClick={() => setStep(1)}
              className="disp"
              style={{
                marginTop: 20, width: "100%", background: T.yellow, color: T.greenDark,
                border: "none", borderRadius: 10, padding: "14px 0", fontSize: 18,
                fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
              }}
            >
              Next — set up the session
            </button>
          </>
        )}

        {/* ================= STEP 2: SESSION INPUTS ================= */}
        {step === 1 && (
          <>
            <Field label="Training level">
              <Segmented options={LEVELS} value={LEVELS[level - 1]} onChange={(v) => { resetTweaks(); setLevel(LEVELS.indexOf(v) + 1); }} />
            </Field>
            <Field label="Focus">
              <Segmented
                options={Object.values(FOCUS).map((f) => f.label)}
                value={FOCUS[focus].label}
                onChange={(v) => { resetTweaks(); setFocus(Object.keys(FOCUS).find((k) => FOCUS[k].label === v)); }}
              />
            </Field>
            <Field label="Sets per station">
              <Segmented options={["2", "3", "4", "5"]} value={String(sets)} onChange={(v) => setSets(Number(v))} />
            </Field>
            <Field label="Format">
              <Segmented
                options={["Circuit", "Straight sets"]}
                value={format === "straight" ? "Straight sets" : "Circuit"}
                onChange={(v) => setFormat(v === "Circuit" ? "circuit" : "straight")}
              />
              <div style={{ fontSize: 13, color: T.steel, marginTop: 8, lineHeight: 1.45 }}>
                {format === "straight"
                  ? "Finish all sets at one station before moving to the next, with full rest. Best for strength — every rep at max quality."
                  : "Everything at a fitness corner is steps apart — so do one set at each apparatus, loop back to the first, and repeat until all rounds are done. Same total work, ~40% shorter session, higher heart rate."}
              </div>
            </Field>
            <Field label="Warm-up — optional">
              <Toggle on={warmup} onChange={setWarmup} />
              <div style={{ fontSize: 13, color: T.steel, marginTop: 8, lineHeight: 1.45 }}>
                Dynamic movement prep — jog, arm circles, squat-to-stand, heel/toe walks, World's Greatest Stretch. On by default; skip only if you've already warmed up elsewhere.
              </div>
            </Field>
            <Field label="Athletic block — optional">
              <Toggle on={power} onChange={setPower} />
              <div style={{ fontSize: 13, color: T.steel, marginTop: 8, lineHeight: 1.5 }}>
                <div><strong style={{ color: T.ink }}>1.</strong> Movement-skill drill — crawls, traverses, balance</div>
                <div><strong style={{ color: T.ink }}>2.</strong> Max-effort power drill — jumps, bounds</div>
                <div><strong style={{ color: T.ink }}>3.</strong> Reactive drill — pogo hops, toe taps, line hops</div>
                <div style={{ marginTop: 6 }}>Sits right after the warm-up, while you're fresh — power quality dies when you're fatigued. Upper-body days skip the hop drill; core &amp; grip days skip the max-effort jump. Drills are rated and auto-levelled like everything else.</div>
              </div>
            </Field>
            <Field label="Cool-down flow — optional">
              <Toggle on={mobility} onChange={setMobility} />
              <div style={{ fontSize: 13, color: T.steel, marginTop: 8, lineHeight: 1.45 }}>
                Static flexibility holds — hangs, deep squat, hip flexors, calves — done after training while muscles are warm.
              </div>
            </Field>
            <button
              onClick={() => { regenerate(); setStep(2); }}
              className="disp"
              style={{
                marginTop: 12, width: "100%", background: T.yellow, color: T.greenDark,
                border: "none", borderRadius: 10, padding: "14px 0", fontSize: 18,
                fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
              }}
            >
              Generate workout
            </button>
          </>
        )}

        {/* ================= STEP 3: WORKOUT ================= */}
        {step === 2 && (
          <>
            {phase === "idle" && (
              <div style={{ marginBottom: 14 }}>
                <button
                  onClick={startSession}
                  className="disp"
                  style={{ width: "100%", background: T.green, color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 17, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  ▶ Start session
                </button>
                <button
                  onClick={() => regenerate(activeCorner, [...picks.names])}
                  className="disp"
                  style={{ width: "100%", marginTop: 8, background: "transparent", color: T.green, border: `2px solid ${T.green}`, borderRadius: 10, padding: "9px 0", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  🔀 New mix — same level, different exercises
                </button>
                {(() => {
                  const stMin = Math.round(todayPatterns.length * sets * (format === "straight" ? 1.8 : 1.1));
                  const est = (warmup ? 5 : 0) + (power ? 7 : 0) + stMin + (mobility ? 6 : 0);
                  return (
                    <div style={{ fontSize: 12.5, color: T.steel, marginTop: 6, textAlign: "center" }}>
                      One clock for the whole session — tap ✓ as you finish each block. Rough guide: ~{est} min total
                      ({warmup ? "5 warm-up, " : ""}{power ? "7 athletic, " : ""}~{stMin} stations{mobility ? ", 6 cool-down" : ""}).
                    </div>
                  );
                })()}
              </div>
            )}
            {phase === "running" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.greenDark, borderRadius: 10, padding: "10px 14px", marginBottom: format === "circuit" ? 8 : 14 }}>
                  <span className="disp" style={{ color: T.yellow, fontWeight: 800, fontSize: 26, letterSpacing: "0.04em", flex: 1 }}>{fmtT(elapsedSec)}</span>
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5 }}>{Object.keys(done).length} ✓ · covers warm-up to cool-down{wakeOn ? " · 🔆 screen stays on" : ""}</span>
                  <button onClick={finishSession} className="disp" style={{ background: T.yellow, color: T.greenDark, border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>
                    Finish
                  </button>
                </div>
                {format === "circuit" && (
                  <div style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                    <div className="disp" style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}>
                      Circuit rounds — tap after each full loop
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      {Array.from({ length: sets }).map((_, r) => {
                        const key = "r" + r;
                        const t = done[key];
                        const prevDone = r === 0 || done["r" + (r - 1)] != null;
                        return t != null ? (
                          <div key={key} className="disp done-check-pop" style={{ flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 8, background: T.green, color: "#fff", fontWeight: 800, fontSize: 13 }}>
                            ✓ {fmtT(t)}
                          </div>
                        ) : (
                          <button
                            key={key}
                            disabled={!prevDone}
                            onClick={() => { markDone(key); if (r < sets - 1) startRest(); }}
                            className="disp"
                            style={{
                              flex: 1, padding: "9px 0", borderRadius: 8, fontWeight: 800, fontSize: 13, textTransform: "uppercase",
                              border: `2px solid ${prevDone ? T.green : T.line}`,
                              background: prevDone ? T.yellow : "transparent",
                              color: prevDone ? T.greenDark : T.line,
                            }}
                          >
                            Round {r + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            {phase === "rating" && (
              <div style={{ background: T.card, border: `3px solid ${T.green}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <div className="disp" style={{ fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}>
                  How was each pattern?
                </div>
                <div style={{ fontSize: 12.5, color: T.steel, marginTop: 2 }}>
                  Any Harder + / − Easier taps are remembered. On top of that, "too easy" two sessions in a row promotes that pattern; "too hard" steps it back immediately.
                </div>
                {[
                  ...athletic.map((s, j) => (s.missing ? null : { key: "a" + j, label: "A" + (j + 1), ex: picks.ath[j] })),
                  ...session.map((s, i) => (s.missing ? null : { key: i, label: String(i + 1), ex: picks.main[i] })),
                ].filter(Boolean).map(({ key: i, label, ex }) => {
                  return (
                    <div key={i} style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{label}. {ex.name}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        {[["easy", "Too easy"], ["right", "Just right"], ["hard", "Too hard"]].map(([val, lbl]) => (
                          <button
                            key={val}
                            onClick={() => setRatings((r) => ({ ...r, [i]: val }))}
                            className="disp"
                            style={{
                              flex: 1, padding: "7px 0", borderRadius: 8, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.03em",
                              border: ratings[i] === val ? `2px solid ${T.green}` : `2px solid ${T.line}`,
                              background: ratings[i] === val ? T.green : T.card, color: ratings[i] === val ? "#fff" : T.ink,
                            }}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                  <select
                    value={activeCorner}
                    onChange={(e) => setActiveCorner(e.target.value)}
                    style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: `2px solid ${T.line}`, background: T.card, fontSize: 14, fontFamily: "inherit" }}
                  >
                    <option value="">Corner: unnamed</option>
                    {Object.keys(savedCorners).map((nm) => <option key={nm} value={nm}>{nm}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={saveSession} className="disp" style={{ flex: 2, background: T.green, color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 800, fontSize: 15, textTransform: "uppercase" }}>
                    Save session
                  </button>
                  <button onClick={discardSession} className="disp" style={{ flex: 1, background: "transparent", color: T.steel, border: `2px solid ${T.line}`, borderRadius: 8, padding: "11px 0", fontWeight: 700, fontSize: 14, textTransform: "uppercase" }}>
                    Discard
                  </button>
                </div>
              </div>
            )}
            {warmup && (
              <BlockCard
                id="warmup"
                title="Warm-up"
                meta={`${level === 1 ? 4 : 5} min · dynamic`}
                open={warmupOpen}
                onToggle={() => setWarmupOpen((o) => !o)}
                status={blockStatus("warmup", setWarmupOpen)}
                intro="Movement, not holds — rehearse the positions, raise the temperature. Save long stretches for after."
              >
                {warmupItems.map((m, j) => <BlockItem key={j} j={j} {...m} />)}
              </BlockCard>
            )}

            {power && athletic.some((s) => !s.missing) && (
              <BlockCard
                id="athletic"
                title="Athletic block"
                meta={`${athletic.filter((s) => !s.missing).length} drills · while fresh`}
                open={athleticOpen}
                onToggle={() => setAthleticOpen((o) => !o)}
                status={phase === "running" && (() => {
                  const total = athletic.filter((s) => !s.missing).length;
                  const doneCount = athletic.filter((s, j) => !s.missing && done["a" + j] != null).length;
                  return (
                    <span className="disp done-check-pop" key={doneCount} style={{ color: T.green, fontWeight: 800, fontSize: 13 }}>
                      {doneCount}/{total} ✓
                    </span>
                  );
                })()}
                intro={`${focus === "upper" ? "A movement-skill primer and one max-effort power drill (no hop drill on an upper-body day)." : focus === "coreGrip" ? "A movement-skill primer and one springy reactive drill." : "A movement-skill primer, one max-effort power drill, and one springy reactive drill."} All done fresh — stop each drill while reps are still crisp; this is about speed and precision, never fatigue. Rated and auto-levelled like the main stations.`}
              >
                <div style={{ marginTop: 10 }}>
                  {athletic.map((s, j) => {
                    if (s.missing) return null;
                    const k = "a" + j;
                    const ex = picks.ath[j];
                    const setsText = ex.reps.includes("×") ? ex.reps : (s.kind === "skill" ? `2 × ${ex.reps}` : `3 × ${ex.reps}`);
                    return (
                      <StationPlate
                        key={k}
                        num={"A" + (j + 1)}
                        eyebrow={`${ATH_LABEL[s.kind]} · ${LEVELS[ex.lvl - 1]}`}
                        ex={ex}
                        setsText={setsText}
                        canSwap={s.alternatives.length > 1}
                        onSwap={() => doSwap(k, s, ex)}
                        guideOpen={!!guides[k]}
                        onToggleGuide={() => setGuides((g) => ({ ...g, [k]: !g[k] }))}
                        easierDisabled={s.effLevel <= 1}
                        harderDisabled={s.effLevel >= 4}
                        onEasier={() => { bump(k, -1, "ath-" + s.kind); setSwaps((sw) => ({ ...sw, [k]: 0 })); }}
                        onHarder={() => { bump(k, 1, "ath-" + s.kind); setSwaps((sw) => ({ ...sw, [k]: 0 })); }}
                        easier={s.easier}
                        next={s.next}
                        sessionActive={phase === "running"}
                        doneAt={done[k]}
                        onDone={() => markDone(k)}
                      />
                    );
                  })}
                </div>
              </BlockCard>
            )}

            {focus === "full" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#E7EDE3", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 13, color: T.ink }}>
                <span style={{ flex: 1 }}>
                  <b>Today: {gen.vslot === "push" ? "overhead-push day" : "pull-up day"}.</b> Full body alternates pull-ups and overhead pushing each session.
                </span>
                {phase === "idle" && (
                  <button
                    onClick={() => { setGen((g) => ({ ...g, vslot: g.vslot === "push" ? "pull" : "push" })); resetTweaks(); }}
                    className="disp"
                    style={{ background: "transparent", border: `2px solid ${T.green}`, color: T.green, borderRadius: 6, padding: "4px 10px", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}
                  >
                    Switch
                  </button>
                )}
              </div>
            )}
            <div style={{ fontSize: 13.5, color: T.steel, marginBottom: 6 }}>{restLine}</div>
            <div style={{ fontSize: 13.5, color: T.steel, marginBottom: 14, lineHeight: 1.45 }}>
              <span className="disp" style={{ fontWeight: 800, color: T.green, textTransform: "uppercase", letterSpacing: "0.04em" }}>Progression standard:</span> when you can complete every set at the top of an exercise's rep range with perfect form and control — two sessions in a row — promote that pattern one level with "Harder +" — when you save the session, the level you finished at is remembered for next time. Until then, win by one more rep, one more second, or a slower tempo.
            </div>

            {session.map((s, i) => {
              if (s.missing) {
                return (
                  <div key={i} style={{ border: `2px dashed ${T.line}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12, color: T.steel }}>
                    <span className="disp" style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 14, letterSpacing: "0.06em" }}>
                      {PATTERNS[s.pattern]}
                    </span>
                    <div style={{ fontSize: 13.5, marginTop: 2 }}>
                      No equipment selected supports this pattern at your level — station skipped.
                    </div>
                  </div>
                );
              }
              const ex = picks.main[i];
              return (
                <StationPlate
                  key={i}
                  num={i + 1}
                  note={(s.pattern === "verticalPull" || s.pattern === "horizontalPull") && ex.req.length === 0
                    ? "No bar ticked — this is an honest floor stand-in. It wakes up your back muscles but won't build pulling strength like a real row or pull-up. Any sturdy waist-height bar or railing unlocks real rows."
                    : null}
                  eyebrow={`${PATTERNS[s.pattern]} · ${LEVELS[ex.lvl - 1]}`}
                  ex={ex}
                  setsText={`${sets} × ${ex.reps}`}
                  canSwap={s.alternatives.length > 1}
                  onSwap={() => doSwap(i, s, ex)}
                  guideOpen={!!guides[i]}
                  onToggleGuide={() => setGuides((g) => ({ ...g, [i]: !g[i] }))}
                  easierDisabled={s.effLevel <= 1}
                  harderDisabled={s.effLevel >= 4}
                  onEasier={() => { bump(i, -1, s.pattern); setSwaps((sw) => ({ ...sw, [i]: 0 })); }}
                  onHarder={() => { bump(i, 1, s.pattern); setSwaps((sw) => ({ ...sw, [i]: 0 })); }}
                  easier={s.easier}
                  next={s.next}
                  sessionActive={phase === "running" && format === "straight"}
                  doneAt={done[i]}
                  onDone={() => markDone(i)}
                />
              );
            })}

            <div style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "12px 14px" }}>
              <div className="disp" style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}>
                Finisher · optional
              </div>
              <div style={{ fontSize: 14, color: T.steel, marginTop: 2 }}>
                {finType === "hang"
                  ? "Max-time dead hang. One attempt. Beat last session's number."
                  : "5 max-effort broad jumps, full reset between each. Record your best."}
              </div>
              {(() => {
                const all = finisherLog[finType] || [];
                const recordedToday = finisherToday && finisherToday.type === finType;
                const hist = recordedToday ? all.slice(1) : all; // history before today
                const unit = finType === "hang" ? "s" : " cm";
                const last = hist[0]; const best = hist.reduce((m, x) => Math.max(m, x.value), 0);
                const fmtD = (d) => new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
                return (
                  <>
                    <div data-finisher-last style={{ fontSize: 13, color: T.ink, marginTop: 6 }}>
                      {last ? <>Last time: <b>{last.value}{unit}</b> ({fmtD(last.date)}) · Best: <b>{best}{unit}</b></> : "No result yet — set your first benchmark."}
                    </div>
                    {recordedToday ? (
                      <div className="disp done-check-pop" style={{ color: T.green, fontWeight: 800, fontSize: 14, marginTop: 6 }}>
                        ✓ Today: {finisherToday.value}{unit}{hist.length > 0 && finisherToday.value > best ? " — new best! 🎉" : ""}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input
                          type="number" inputMode="numeric" min="1" data-finisher-input
                          value={finisherInput}
                          onChange={(e) => setFinisherInput(e.target.value)}
                          placeholder={finType === "hang" ? "Seconds held" : "Best jump (cm)"}
                          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `2px solid ${T.line}`, fontSize: 16, fontFamily: "inherit", background: T.card }}
                        />
                        <button
                          onClick={saveFinisher}
                          disabled={!(Number(finisherInput) > 0)}
                          className="disp"
                          style={{ background: Number(finisherInput) > 0 ? T.green : T.line, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 800, fontSize: 13, textTransform: "uppercase" }}
                        >
                          Record
                        </button>
                      </div>
                    )}
                    {finType === "jump" && <div style={{ fontSize: 12, color: T.steel, marginTop: 4 }}>Measure toe line to back of your heels — or count foot-lengths (≈ 27 cm each).</div>}
                  </>
                );
              })()}
            </div>

            <div style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
              <div className="disp" style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}>
                Muscle coverage
              </div>
              <div style={{ marginTop: 10 }}>
                <AnatomyFig hit={hitMuscles} h={130} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {Object.entries(MUSCLES).map(([key, label]) => {
                  const hit = hitMuscles.has(key);
                  const inScope = FOCUS[focus].scope.includes(key);
                  return (
                    <span
                      key={key}
                      className="disp"
                      style={{
                        padding: "4px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        background: hit ? T.green : "transparent",
                        color: hit ? "#fff" : T.steel,
                        border: hit ? `2px solid ${T.green}` : inScope ? `2px solid ${T.line}` : `2px dashed ${T.line}`,
                        textDecoration: hit || !inScope ? "none" : "line-through",
                        opacity: hit || inScope ? 1 : 0.55,
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
              <div style={{ fontSize: 12.5, color: T.steel, marginTop: 8, lineHeight: 1.45 }}>
                {(() => {
                  const scope = FOCUS[focus].scope;
                  const gaps = scope.filter((m) => !hitMuscles.has(m));
                  const offDuty = Object.keys(MUSCLES).filter((m) => !scope.includes(m) && !hitMuscles.has(m));
                  const parts = [];
                  if (gaps.length === 0) parts.push("Everything in today's focus is covered.");
                  else parts.push(`Gaps within today's focus: ${gaps.map((m) => MUSCLES[m].toLowerCase()).join(", ")} — patch them below.`);
                  if (offDuty.length > 0) parts.push(`Off-duty by design: ${offDuty.map((m) => MUSCLES[m].toLowerCase()).join(", ")}. Catch them elsewhere in your week.`);
                  return parts.join(" ");
                })()}
              </div>
            </div>

            {(() => {
              const missed = FOCUS[focus].scope.filter((m) => !hitMuscles.has(m));
              if (missed.length === 0) return null;
              const usedNames = new Set();
              const patches = missed.map((m) => {
                const pick =
                  EXERCISES.filter((e) => e.mus?.includes(m) && !usedNames.has(e.name) && e.req.every((r) => eq.includes(r)) && e.lvl <= level)
                    .sort((a, b) => b.lvl - a.lvl)[0] ||
                  EXERCISES.filter((e) => e.mus?.includes(m) && !usedNames.has(e.name) && e.req.length === 0)
                    .sort((a, b) => a.lvl - b.lvl)[0];
                if (pick) usedNames.add(pick.name);
                return { m, pick };
              });
              // one exercise can patch several muscles — collapse duplicates
              const seen = new Set();
              const rows = patches.filter((p) => {
                if (!p.pick) return true;
                if (seen.has(p.pick.name)) return false;
                seen.add(p.pick.name);
                return true;
              });
              return (
                <div style={{ background: T.card, border: `2px solid ${T.line}`, borderLeft: `6px solid ${T.green}`, borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
                  <div className="disp" style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}>
                    Patch the gaps · optional
                  </div>
                  <div style={{ fontSize: 12.5, color: T.steel, marginTop: 2 }}>
                    2 sets each, tacked on at the end — enough to touch the muscle, not enough to wreck recovery.
                  </div>
                  {rows.map(({ m, pick }, j) => (
                    <div key={j} style={{ marginTop: 8 }}>
                      {pick ? (
                        <>
                          <div style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>
                            {pick.name} <span style={{ color: T.green, fontWeight: 700 }}>— 2 × {pick.reps}</span>
                          </div>
                          <div style={{ fontSize: 12, color: T.steel, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 1 }}>
                            Covers: {pick.mus.filter((x) => !hitMuscles.has(x)).map((x) => MUSCLES[x]).join(" · ")}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 13, color: T.steel }}>
                          {MUSCLES[m]} — needs equipment this corner doesn't have (usually a bar). Catch it at the next stop.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {mobility && (
              <div style={{ marginTop: 12 }}>
                <BlockCard
                  id="cooldown"
                  title="Cool-down"
                  meta={`${level === 1 ? "4–6" : "5–8"} min · static`}
                  open={cooldownOpen}
                  onToggle={() => setCooldownOpen((o) => !o)}
                  status={blockStatus("cooldown", setCooldownOpen)}
                  intro="Long holds on warm muscles — this is where flexibility is actually built."
                >
                  {cooldownItems.map((m, j) => <BlockItem key={j} j={j} {...m} />)}
                </BlockCard>
              </div>
            )}

            <button
              onClick={() => { regenerate(); setStep(0); }}
              className="disp"
              style={{
                marginTop: 18, width: "100%", background: "transparent", color: T.green,
                border: `2px solid ${T.green}`, borderRadius: 10, padding: "12px 0",
                fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
              }}
            >
              New corner, new workout
            </button>
          </>
        )}
        {/* ================= STEP 4: LIBRARY ================= */}
        {step === 3 && (
          <>
            <p style={{ fontSize: 15, color: T.steel, margin: "4px 0 4px" }}>
              Every movement in the generator, from easiest to hardest. Greyed-out entries need equipment you haven't ticked on the Equipment tab.
            </p>
            <p style={{ fontSize: 12.5, color: T.steel, margin: "0 0 16px" }}>
              L1 Beginner · L2 Intermediate · L3 Advanced · L4 Expert
            </p>
            {Object.entries(PATTERNS).map(([pat, patLabel]) => (
              <div key={pat} style={{ marginBottom: 18 }}>
                <div className="disp" style={{ fontWeight: 800, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green, borderBottom: `3px solid ${T.yellow}`, paddingBottom: 4, marginBottom: 8 }}>
                  {patLabel}
                </div>
                {EXERCISES.filter((e) => e.p === pat)
                  .sort((a, b) => a.lvl - b.lvl)
                  .map((e, k) => {
                    const have = e.req.every((r) => eq.includes(r));
                    return (
                      <div key={k} style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8, opacity: have ? 1 : 0.55 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                              <span className="disp" style={{ background: T.green, color: T.yellow, fontWeight: 800, fontSize: 12, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>
                                L{e.lvl}
                              </span>
                              <span className="disp" style={{ fontWeight: 800, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.01em" }}>
                                {e.name}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: T.ink, marginTop: 5, lineHeight: 1.5 }}>{e.how}</div>
                            <div style={{ fontSize: 12, color: T.green, marginTop: 4 }}>
                              <b>Form tip:</b> {e.cue}
                            </div>
                            <div style={{ fontSize: 11.5, color: T.steel, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {e.mus ? `Works: ${e.mus.map((m) => MUSCLES[m]).join(" · ")}` : ""}
                              {e.req.length > 0 && (
                                <> {e.mus ? "· " : ""}Needs: {e.req.map((r) => EQUIPMENT.find((q) => q.id === r)?.label).join(" + ")}</>
                              )}
                            </div>
                          </div>
                          {e.mus && (
                            <div style={{ flexShrink: 0, alignSelf: "center" }}>
                              <AnatomyFig hit={new Set(e.mus)} h={78} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </>
        )}
        {/* ================= STEP 5: LOG ================= */}
        {step === 4 && (
          <>
            {!hasStorage && (
              <div style={{ background: T.safetyBg, color: T.safetyText, fontSize: 13.5, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                Persistent storage isn't available here — sessions will be lost when you close this page.
              </div>
            )}
            {log === null ? (
              <div style={{ color: T.steel, fontSize: 14 }}>Loading your history…</div>
            ) : (
              <>
                {Object.keys(patternMem).some((k) => patternMem[k] !== 0) && (
                  <div style={{ background: T.card, border: `2px solid ${T.green}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                    <div className="disp" style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}>
                      Auto-level memory
                    </div>
                    <div style={{ fontSize: 12.5, color: T.steel, marginTop: 2 }}>
                      Learned from your ratings and Harder/Easier taps — applied automatically to new workouts.
                    </div>
                    {Object.entries(patternMem).filter(([, v]) => v !== 0).map(([p, v]) => (
                      <div key={p} style={{ fontSize: 13.5, color: T.ink, marginTop: 5 }}>
                        {memLabel(p)}: <b style={{ color: v > 0 ? T.green : T.orange }}>{v > 0 ? `+${v}` : v} level{Math.abs(v) > 1 ? "s" : ""}</b>
                      </div>
                    ))}
                  </div>
                )}
                {log.length === 0 && (
                  <div style={{ color: T.steel, fontSize: 14, lineHeight: 1.5 }}>
                    No sessions yet. Generate a workout, hit <b>Start session</b>, tap <b>Done</b> at each station, and save — your history, times, and auto-levels will live here.
                  </div>
                )}
                {log.map((en, i) => (
                  <div key={i} style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span className="disp" style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", color: T.green }}>
                        {new Date(en.date).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                      </span>
                      <span style={{ fontSize: 13, color: T.steel, flex: 1 }}>📍 {en.corner} · {en.focus}</span>
                      <span className="disp" style={{ fontWeight: 800, fontSize: 15, color: T.ink }}>{Math.floor(en.durationSec / 60)} min</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: T.steel, marginTop: 6, lineHeight: 1.6 }}>
                      {en.warmupAt != null && <div>Warm-up · finished at {Math.floor(en.warmupAt / 60)}:{String(en.warmupAt % 60).padStart(2, "0")}</div>}
                      {en.rounds && en.rounds.map((t, r) =>
                        t != null ? <div key={"r" + r}>Round {r + 1} · done at {Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")}</div> : null
                      )}
                      {en.stations.map((st, j) => (
                        <div key={j}>
                          {st.name}
                          {st.doneAt != null && <> · {Math.floor(st.doneAt / 60)}:{String(st.doneAt % 60).padStart(2, "0")}</>}
                          {st.rating && <> · {st.rating === "easy" ? "😴 too easy" : st.rating === "hard" ? "🥵 too hard" : "✅ just right"}</>}
                        </div>
                      ))}
                      {en.finisher && <div>Finisher · {en.finisher.type === "hang" ? `dead hang ${en.finisher.value}s` : `broad jump ${en.finisher.value} cm`}</div>}
                      {en.cooldownAt != null && <div>Cool-down · finished at {Math.floor(en.cooldownAt / 60)}:{String(en.cooldownAt % 60).padStart(2, "0")}</div>}
                    </div>
                  </div>
                ))}
                {hasStorage && (
                  <div style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                    <div className="disp" style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}>
                      Backup
                    </div>
                    <div style={{ fontSize: 12.5, color: T.steel, marginTop: 2, lineHeight: 1.45 }}>
                      Your data lives only on this phone. Export a file now and then (save it to Files / Drive) so a cleared browser or new phone doesn't wipe your history.
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={exportData} className="disp" style={{ flex: 1, background: T.green, color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>
                        ⬇ Export backup
                      </button>
                      <label className="disp" style={{ flex: 1, textAlign: "center", background: "transparent", color: T.green, border: `2px solid ${T.green}`, borderRadius: 8, padding: "8px 0", fontWeight: 800, fontSize: 14, textTransform: "uppercase", cursor: "pointer" }}>
                        ⬆ Import
                        <input type="file" accept="application/json,.json" data-import style={{ display: "none" }} onChange={(e) => { importData(e.target.files && e.target.files[0]); e.target.value = ""; }} />
                      </label>
                    </div>
                  </div>
                )}
                {(log.length > 0 || Object.keys(savedCorners).length > 0) && (
                  <button
                    onClick={resetData}
                    className="disp"
                    style={{ marginTop: 8, width: "100%", background: "transparent", color: T.safetyText, border: `2px solid ${T.safetyBg}`, borderRadius: 8, padding: "10px 0", fontWeight: 700, fontSize: 13, textTransform: "uppercase" }}
                  >
                    Reset all saved data
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ---------- session blocks: warm-up, athletic, cool-down share one shell ---------- */
function BlockCard({ id, title, meta, open, onToggle, status, intro, children }) {
  return (
    <div data-block={id} style={{ background: T.card, border: `2px solid ${T.line}`, borderLeft: `6px solid ${T.green}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="disp"
          style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 6, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer", color: T.green }}
        >
          <span style={{ display: "inline-block", transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
          <span style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
          <span style={{ fontWeight: 700, fontSize: 12.5, color: T.steel, textTransform: "uppercase", letterSpacing: "0.06em" }}>· {meta}</span>
        </button>
        {status}
      </div>
      {open && (
        <div className="panel-reveal">
          {intro && <div style={{ fontSize: 12.5, color: T.steel, marginTop: 8, lineHeight: 1.45 }}>{intro}</div>}
          {children}
        </div>
      )}
    </div>
  );
}

function BlockItem({ j, n, d, h }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>
        {j + 1}. {n} {d && <span style={{ color: T.green, fontWeight: 700 }}>— {d}</span>}
      </div>
      {h && <div style={{ fontSize: 12.5, color: T.steel, marginTop: 2, lineHeight: 1.45 }}>{h}</div>}
    </div>
  );
}

/* ---------- small controls ---------- */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="disp" style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.1em", color: T.green, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="disp"
            style={{
              flex: "1 1 auto", minWidth: 90, padding: "10px 8px", borderRadius: 8,
              border: on ? `2px solid ${T.green}` : `2px solid ${T.line}`,
              background: on ? T.green : T.card, color: on ? "#fff" : T.ink,
              fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.04em",
              transition: "background 0.15s",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange, onLabel = "Include", offLabel = "Skip" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={() => onChange(!on)}
        aria-pressed={on}
        style={{
          width: 46, height: 26, borderRadius: 13, flexShrink: 0, padding: 0, position: "relative",
          border: `2px solid ${on ? T.green : T.line}`, background: on ? T.green : T.card,
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: on ? 22 : 2, width: 18, height: 18, borderRadius: "50%",
          background: on ? "#fff" : T.steel, transition: "left 0.15s ease-out",
        }} />
      </button>
      <span className="disp" style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em", color: on ? T.green : T.steel }}>
        {on ? onLabel : offLabel}
      </span>
    </div>
  );
}
