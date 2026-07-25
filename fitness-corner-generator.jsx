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
  { p: "verticalPush", lvl: 1, name: "Pike push-up", req: [], reps: "6–10", mus: ["shoulders", "triceps"], how: "Start in a push-up position, then walk your feet toward your hands so your hips point at the sky — your body forms an upside-down V. Bend your elbows to lower the top of your head toward the ground, then press back up.", cue: "Head travels toward your hands, elbows track back, hips stay high." },
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

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

function eligible(pattern, level, eq) {
  return EXERCISES.filter(
    (e) => e.p === pattern && e.lvl <= level && e.req.every((r) => eq.includes(r))
  ).sort((a, b) => b.lvl - a.lvl);
}

function buildSession(focus, level, eq, adjs, mem) {
  const used = new Set();
  return FOCUS[focus].patterns.map((pattern, idx) => {
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
    const peers = pool.filter((e) => e.lvl === topLvl);
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

function buildAthletic(level, eq, used, adjs) {
  // 1 skill primer (coordination, low fatigue) + 2 explosive drills, done while fresh.
  // Deterministic on purpose: power and skill improve by repeating drills, not rotating them.
  return [{ kind: "skill" }, { kind: "power" }, { kind: "elastic" }].map(({ kind }, j) => {
    const key = "a" + j;
    const effLevel = Math.min(4, Math.max(1, level + (adjs[key] || 0)));
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
    const peers = pool.filter((e) => e.lvl === topLvl);
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

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* STATION PLATE — shared by main stations and the athletic block      */
/* ------------------------------------------------------------------ */
function StationPlate({ num, eyebrow, ex, setsText, canSwap, onSwap, guideOpen, onToggleGuide, easierDisabled, harderDisabled, onEasier, onHarder, easier, next, sessionActive, doneAt, onDone }) {
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
          <div className="disp" style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.01em" }}>
            {ex.name}
          </div>
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, color: T.green, marginTop: 2 }}>
            {setsText}
          </div>
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

  useEffect(() => {
    if (!hasStorage) { setLog([]); return; }
    (async () => {
      try { const r = await window.storage.get("fc-corners"); setSavedCorners(JSON.parse(r.value)); } catch { setSavedCorners({}); }
      try { const r = await window.storage.get("fc-log"); setLog(JSON.parse(r.value)); } catch { setLog([]); }
      try { const r = await window.storage.get("fc-levels"); const v = JSON.parse(r.value); setPatternMem(v.mem || {}); streakRef.current = v.streak || {}; } catch { setPatternMem({}); streakRef.current = {}; }
    })();
  }, [hasStorage]);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const elapsedSec = phase === "running" && startTs ? Math.floor((now - startTs) / 1000) : 0;
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startSession = () => { setPhase("running"); setStartTs(Date.now()); setNow(Date.now()); setDone({}); setRatings({}); };
  const markDone = (key) => setDone((d) => (d[key] != null ? d : { ...d, [key]: Math.floor((Date.now() - startTs) / 1000) }));
  const finishSession = () => setPhase("rating");
  const discardSession = () => { setPhase("idle"); setDone({}); setRatings({}); };

  const saveCorner = async () => {
    const name = cornerName.trim();
    if (!name) return;
    const next = { ...savedCorners, [name]: eq };
    setSavedCorners(next); setActiveCorner(name); setCornerName("");
    if (hasStorage) { try { await window.storage.set("fc-corners", JSON.stringify(next)); } catch (e) { console.error(e); } }
  };

  const saveSession = async () => {
    const stations = session.map((s, i) => {
      if (s.missing) return null;
      const off = swaps[i] || 0;
      const ex = s.alternatives[off % s.alternatives.length];
      return { pattern: s.pattern, name: ex.name, lvl: ex.lvl, doneAt: done[i] ?? null, rating: ratings[i] || null };
    }).filter(Boolean);
    const entry = {
      date: new Date().toISOString(), corner: activeCorner || "Unnamed corner", focus: FOCUS[focus].label,
      durationSec: startTs ? Math.floor((Date.now() - startTs) / 1000) : 0, stations, format,
      warmupAt: done["warmup"] ?? null, cooldownAt: done["cooldown"] ?? null,
      rounds: format === "circuit" ? Array.from({ length: sets }).map((_, r) => done["r" + r] ?? null) : null,
    };
    const nextLog = [entry, ...(log || [])].slice(0, 100);
    setLog(nextLog);
    // Auto-level memory: two "too easy" in a row promotes; one "too hard" demotes.
    const mem = { ...patternMem }; const streak = { ...streakRef.current };
    stations.forEach((st) => {
      if (st.rating === "easy") {
        streak[st.pattern] = (streak[st.pattern] || 0) + 1;
        if (streak[st.pattern] >= 2) { mem[st.pattern] = Math.min(3, (mem[st.pattern] || 0) + 1); streak[st.pattern] = 0; }
      } else if (st.rating === "hard") {
        mem[st.pattern] = Math.max(-3, (mem[st.pattern] || 0) - 1); streak[st.pattern] = 0;
      } else if (st.rating === "right") { streak[st.pattern] = 0; }
    });
    setPatternMem(mem); streakRef.current = streak;
    if (hasStorage) {
      try { await window.storage.set("fc-log", JSON.stringify(nextLog)); } catch (e) { console.error(e); }
      try { await window.storage.set("fc-levels", JSON.stringify({ mem, streak })); } catch (e) { console.error(e); }
    }
    setPhase("idle"); setDone({}); setRatings({});
  };

  const resetData = async () => {
    setLog([]); setPatternMem({}); streakRef.current = {}; setSavedCorners({});
    if (hasStorage) { for (const k of ["fc-log", "fc-levels", "fc-corners"]) { try { await window.storage.delete(k); } catch {} } }
  };

  const { session, athletic } = useMemo(() => {
    const s = buildSession(focus, level, eq, adjs, patternMem);
    const used = new Set(s.filter((x) => !x.missing).map((x) => x.pick.name));
    const a = power ? buildAthletic(level, eq, used, adjs) : [];
    return { session: s, athletic: a };
  }, [focus, level, eq, adjs, power, patternMem]);

  useEffect(() => {
    if (!athletic.some((s) => !s.missing)) return;
    if (athletic.every((s, j) => s.missing || done["a" + j] != null)) setAthleticOpen(false);
  }, [done, athletic]);

  const hitMuscles = useMemo(() => {
    const hit = new Set();
    const collect = (arr, keyFn) =>
      arr.forEach((st, i) => {
        if (!st.missing) {
          const off = swaps[keyFn(i)] || 0;
          const ex = st.alternatives[off % st.alternatives.length];
          (ex.mus || []).forEach((m) => hit.add(m));
        }
      });
    collect(session, (i) => i);
    collect(athletic, (i) => "a" + i);
    return hit;
  }, [session, athletic, swaps]);

  const bump = (i, d) =>
    setAdjs((a) => {
      const eff = Math.min(4, Math.max(1, level + (a[i] || 0) + d));
      return { ...a, [i]: eff - level };
    });

  const toggle = (id) => {
    setActiveCorner("");
    setEq((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const applyPreset = (p) => { setActiveCorner(""); setEq(p.eq); };

  const doSwap = (i, poolLen) =>
    setSwaps((s) => ({ ...s, [i]: ((s[i] || 0) + 1) % poolLen }));

  const restLine =
    format === "straight"
      ? "Rest 90–120s between sets. Complete all sets of one station before moving on."
      : "Circuit: one set at each station in order, loop back to station 1, repeat until all rounds are done. Rest 60–90s between rounds only.";

  // Warm-up/cool-down adapt to what the session actually trains today.
  // "Full body" naturally trips both (it spans upper + lower patterns) — full coverage by construction, not a special case.
  const needsUpperPrep = FOCUS[focus].patterns.some((p) => ["verticalPush", "verticalPull", "horizontalPush", "horizontalPull"].includes(p));
  const needsLowerPrep = FOCUS[focus].patterns.some((p) => ["kneeDominant", "hipDominant", "gripAthletic"].includes(p));
  const needsGripPrep = FOCUS[focus].patterns.includes("gripAthletic");

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

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 60px" }}>
        {/* ================= STEP 1: EQUIPMENT ================= */}
        {step === 0 && (
          <>
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
                onClick={() => { setEq([]); setActiveCorner(""); }}
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
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {Object.entries(savedCorners).map(([nm, eqList]) => (
                  <button
                    key={nm}
                    onClick={() => { setEq(eqList); setActiveCorner(nm); }}
                    className="disp"
                    style={{
                      border: `2px solid ${activeCorner === nm ? T.green : T.line}`, background: activeCorner === nm ? T.green : T.card,
                      color: activeCorner === nm ? "#fff" : T.ink, borderRadius: 999, padding: "6px 14px",
                      fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >
                    📍 {nm}
                  </button>
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
              <Segmented options={LEVELS} value={LEVELS[level - 1]} onChange={(v) => setLevel(LEVELS.indexOf(v) + 1)} />
            </Field>
            <Field label="Focus">
              <Segmented
                options={Object.values(FOCUS).map((f) => f.label)}
                value={FOCUS[focus].label}
                onChange={(v) => setFocus(Object.keys(FOCUS).find((k) => FOCUS[k].label === v))}
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
                <div style={{ marginTop: 6 }}>Sits right after the warm-up, while you're fresh — power quality dies when you're fatigued.</div>
              </div>
            </Field>
            <Field label="Cool-down flow — optional">
              <Toggle on={mobility} onChange={setMobility} />
              <div style={{ fontSize: 13, color: T.steel, marginTop: 8, lineHeight: 1.45 }}>
                Static flexibility holds — hangs, deep squat, hip flexors, calves — done after training while muscles are warm.
              </div>
            </Field>
            <button
              onClick={() => { setSwaps({}); setAdjs({}); setStep(2); }}
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
                {(() => {
                  const stMin = Math.round(FOCUS[focus].patterns.length * sets * (format === "straight" ? 1.8 : 1.1));
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
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5 }}>{Object.keys(done).length} ✓ · covers warm-up to cool-down</span>
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
                            onClick={() => markDone(key)}
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
                  "Too easy" twice in a row auto-promotes that pattern next session. "Too hard" steps it back immediately.
                </div>
                {session.map((s, i) => {
                  if (s.missing) return null;
                  const off = swaps[i] || 0;
                  const ex = s.alternatives[off % s.alternatives.length];
                  return (
                    <div key={i} style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{i + 1}. {ex.name}</div>
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
            <div style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => setWarmupOpen((o) => !o)}
                  className="disp"
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}
                >
                  <span style={{ display: "inline-block", transition: "transform 0.15s", transform: warmupOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
                  Warm-up · 5 min · dynamic
                </button>
                {phase === "running" && (done["warmup"] == null ? (
                  <button onClick={() => { markDone("warmup"); setWarmupOpen(false); }} className="disp" style={{ background: T.yellow, color: T.greenDark, border: "none", borderRadius: 6, padding: "5px 12px", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>✓ Done</button>
                ) : (
                  <span className="disp done-check-pop" style={{ color: T.green, fontWeight: 800, fontSize: 13 }}>✓ at {fmtT(done["warmup"])}</span>
                ))}
              </div>
              {warmupOpen && (
                <div className="panel-reveal">
                  <div style={{ fontSize: 12.5, color: T.steel, marginTop: 8 }}>
                    Movement, not holds — rehearse the positions, raise the temperature. Save long stretches for after.
                  </div>
                  {[
                    { n: "Easy jog or brisk walk", d: "to the corner", h: null, show: true },
                    { n: "Arm circles", d: "10 each way", h: "Stand tall and make big, slow circles with straight arms — 10 forward, then 10 backward.", show: needsUpperPrep },
                    { n: "Leg swings", d: "10 / leg, each direction", h: "Hold something for balance and swing one leg front-to-back 10 times, then side-to-side 10 times, then switch legs.", show: needsLowerPrep },
                    { n: "Wrist circles + stretch", d: "10 each way + 15s", h: "Circle both wrists 10 times each direction. Then press your palms together in front of your chest with fingers pointing up, and lower your hands toward your waist, keeping palms together, until you feel a stretch across both forearms.", show: needsUpperPrep || needsGripPrep },
                    { n: "Squat-to-stand", d: "5 reps", h: "Bend down and grab your toes with straight-ish legs, then pull your hips down into a deep squat with your chest up, then straighten your legs back to the toe-grab. That's one rep.", show: needsLowerPrep },
                    { n: "Heel walks + toe walks", d: "15m each", h: "Walk on your heels with your toes lifted high for 15 metres, then walk up on your tiptoes for 15 metres. Wakes up the shins, calves and ankles before they take load.", show: needsLowerPrep },
                    { n: "Tibialis raise (wall lean)", d: "10–12 reps", h: "Stand with your back against a wall or post and walk your heels about 30cm out, so you're leaning back slightly. Keeping your legs straight, lift your toes and the front of your feet as high as you can, then lower. A light prep set — the full working set shows up later if your session trains this pattern.", show: needsLowerPrep },
                    { n: "World's Greatest Stretch", d: "3 / side", h: "Step into a long lunge — say right foot forward — and place both hands on the ground inside your front foot. The arm on the same side as the front leg is the one that moves: keep the left hand planted and sweep your right arm up toward the sky, opening your chest toward your front-leg side and following the hand with your eyes. Bring it down, then swap sides — left foot forward, left arm up. Hip flexors, hamstrings, and upper-back rotation in one move.", show: true },
                    { n: "Easy bar hang", d: "15s", h: "If there's a bar — a relaxed hang to wake up the grip and shoulders. Skip if not.", show: needsUpperPrep },
                  ].filter((m) => m.show).map((m, j) => (
                    <div key={j} style={{ marginTop: j === 0 ? 8 : 8 }}>
                      <div style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>
                        {j + 1}. {m.n} <span style={{ color: T.green, fontWeight: 700 }}>— {m.d}</span>
                      </div>
                      {m.h && <div style={{ fontSize: 12.5, color: T.steel, marginTop: 2, lineHeight: 1.45 }}>{m.h}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {power && athletic.some((s) => !s.missing) && (
              <>
                <div style={{ background: T.card, border: `2px solid ${T.green}`, borderRadius: 10, padding: "10px 14px", marginBottom: athleticOpen ? 12 : 14 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => setAthleticOpen((o) => !o)}
                      className="disp"
                      style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}
                    >
                      <span style={{ display: "inline-block", transition: "transform 0.15s", transform: athleticOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
                      Athletic block · while fresh
                    </button>
                    {phase === "running" && (() => {
                      const total = athletic.filter((s) => !s.missing).length;
                      const doneCount = athletic.filter((s, j) => !s.missing && done["a" + j] != null).length;
                      return (
                        <span className="disp done-check-pop" key={doneCount} style={{ color: T.green, fontWeight: 800, fontSize: 13 }}>
                          {doneCount}/{total} ✓
                        </span>
                      );
                    })()}
                  </div>
                  {athleticOpen && (
                    <div className="panel-reveal" style={{ fontSize: 13, color: T.steel, marginTop: 8, lineHeight: 1.45 }}>
                      Three jobs, one block: a movement-skill primer to wake up coordination, one max-effort power drill, and one springy reactive drill for footwork and ankle stiffness. All done fresh — stop each drill while reps are still crisp; this is about speed and precision, never fatigue.
                    </div>
                  )}
                </div>
                {athleticOpen && athletic.map((s, j) => {
                  if (s.missing) return null;
                  const k = "a" + j;
                  const off = swaps[k] || 0;
                  const ex = s.alternatives[off % s.alternatives.length];
                  const setsText = ex.reps.includes("×") ? ex.reps : (s.kind === "skill" ? `2 × ${ex.reps}` : `3 × ${ex.reps}`);
                  return (
                    <StationPlate
                      key={k}
                      num={"A" + (j + 1)}
                      eyebrow={`${({ skill: "Movement skill", power: "Explosive power", elastic: "Reactive / elastic" })[s.kind]} · ${LEVELS[ex.lvl - 1]}`}
                      ex={ex}
                      setsText={setsText}
                      canSwap={s.alternatives.length > 1}
                      onSwap={() => doSwap(k, s.alternatives.length)}
                      guideOpen={!!guides[k]}
                      onToggleGuide={() => setGuides((g) => ({ ...g, [k]: !g[k] }))}
                      easierDisabled={s.effLevel <= 1}
                      harderDisabled={s.effLevel >= 4}
                      onEasier={() => { bump(k, -1); setSwaps((sw) => ({ ...sw, [k]: 0 })); }}
                      onHarder={() => { bump(k, 1); setSwaps((sw) => ({ ...sw, [k]: 0 })); }}
                      easier={s.easier}
                      next={s.next}
                      sessionActive={phase === "running"}
                      doneAt={done[k]}
                      onDone={() => markDone(k)}
                    />
                  );
                })}
              </>
            )}

            <div style={{ fontSize: 13.5, color: T.steel, marginBottom: 6 }}>{restLine}</div>
            <div style={{ fontSize: 13.5, color: T.steel, marginBottom: 14, lineHeight: 1.45 }}>
              <span className="disp" style={{ fontWeight: 800, color: T.green, textTransform: "uppercase", letterSpacing: "0.04em" }}>Progression standard:</span> when you can complete every set at the top of an exercise's rep range with perfect form and control — two sessions in a row — promote that pattern one level with "Harder +". Until then, win by one more rep, one more second, or a slower tempo.
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
              const offset = swaps[i] || 0;
              const ex = s.alternatives[offset % s.alternatives.length];
              return (
                <StationPlate
                  key={i}
                  num={i + 1}
                  eyebrow={`${PATTERNS[s.pattern]} · ${LEVELS[ex.lvl - 1]}`}
                  ex={ex}
                  setsText={`${sets} × ${ex.reps}`}
                  canSwap={s.alternatives.length > 1}
                  onSwap={() => doSwap(i, s.alternatives.length)}
                  guideOpen={!!guides[i]}
                  onToggleGuide={() => setGuides((g) => ({ ...g, [i]: !g[i] }))}
                  easierDisabled={s.effLevel <= 1}
                  harderDisabled={s.effLevel >= 4}
                  onEasier={() => { bump(i, -1); setSwaps((sw) => ({ ...sw, [i]: 0 })); }}
                  onHarder={() => { bump(i, 1); setSwaps((sw) => ({ ...sw, [i]: 0 })); }}
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
                {eq.includes("highBar")
                  ? "Max-time dead hang. One attempt. Beat last session's number."
                  : "5 max-effort broad jumps, full reset between each."}
              </div>
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
              <div style={{ background: T.card, border: `2px solid ${T.line}`, borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => setCooldownOpen((o) => !o)}
                    className="disp"
                    style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.08em", color: T.green }}
                  >
                    <span style={{ display: "inline-block", transition: "transform 0.15s", transform: cooldownOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▸</span>
                    Cool-down flow · 5–8 min · static
                  </button>
                  {phase === "running" && (done["cooldown"] == null ? (
                    <button onClick={() => { markDone("cooldown"); setCooldownOpen(false); }} className="disp" style={{ background: T.yellow, color: T.greenDark, border: "none", borderRadius: 6, padding: "5px 12px", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>✓ Done</button>
                  ) : (
                    <span className="disp done-check-pop" style={{ color: T.green, fontWeight: 800, fontSize: 13 }}>✓ at {fmtT(done["cooldown"])}</span>
                  ))}
                </div>
                {cooldownOpen && (
                  <div className="panel-reveal">
                    <div style={{ fontSize: 12.5, color: T.steel, marginTop: 8 }}>
                      Long holds on warm muscles — this is where flexibility is actually built.
                    </div>
                    {[
                      {
                        ...(eq.includes("highBar") || eq.includes("monkeyBars")
                          ? { n: "Dead hang", d: "30–60s", h: "Grab the bar and just hang with straight arms, feet off the ground. Let your shoulders relax up toward your ears and breathe slowly — this decompresses the spine." }
                          : { n: "Cross-body shoulder stretch", d: "30s / side", h: "Stand tall and bring one straight arm across the front of your body at chest height. Use your other forearm to gently press it closer to your chest, then switch sides." }),
                        show: needsUpperPrep,
                      },
                      { n: "Standing chest stretch", d: "30s", h: "Stand tall, clasp your hands together behind your lower back, and straighten your arms. Lift your chest and gently raise your clasped hands away from your body until you feel a stretch across the front of your shoulders and chest.", show: needsUpperPrep },
                      { n: "Overhead triceps stretch", d: "30s / side", h: "Reach one arm straight up, then bend that elbow so your hand drops behind your head. Use your other hand to gently press on that elbow, then switch sides.", show: needsUpperPrep },
                      { n: "Wrist + forearm stretch", d: "20s / side, both ways", h: "Hold one arm straight out in front, palm up. Use your other hand to gently pull the fingers back toward you, then flip the palm down and gently pull the fingers down and in, feeling the stretch on both sides of the forearm before switching arms.", show: needsUpperPrep || needsGripPrep },
                      { n: "Deep squat hold", d: "60s", h: "Squat all the way down until your bottom is near your heels, feet flat on the ground about shoulder width. Put your elbows inside your knees and gently press them outward. Hold and breathe.", show: needsLowerPrep },
                      {
                        ...(eq.includes("parallelBars") || eq.includes("lowBar")
                          ? { n: "Supported hamstring hinge", d: "60s", h: "Hold the bar with both hands at arm's length and step back. Keeping your back flat and knees almost straight, push your hips backward until you feel a stretch down the back of your thighs." }
                          : eq.includes("bench")
                            ? { n: "Supported hamstring hinge", d: "60s", h: "Put both hands on a bench or ledge and step back. Keeping your back flat and knees almost straight, push your hips backward until the back of your thighs stretches." }
                            : { n: "Standing forward fold", d: "60s", h: "Stand with feet hip-width, bend your knees slightly, and fold forward at the hips, letting your head and arms hang heavy toward the ground. Sway gently." }),
                        show: needsLowerPrep,
                      },
                      {
                        ...(eq.includes("bench")
                          ? { n: "Couch stretch", d: "30–45s / side", h: "Kneel facing away from the bench and place the top of one foot up on its edge behind you, that knee on the ground, other foot planted in front. Tuck your tailbone and lift your chest tall until you feel a deep stretch down the front of the back leg's hip and thigh." }
                          : { n: "Hip flexor stretch", d: "30s / side", h: "Kneel on one knee like a marriage proposal, other foot flat in front. Tuck your tailbone under and shift your whole body slightly forward until you feel a stretch down the front of the hip on the kneeling side." }),
                        show: needsLowerPrep,
                      },
                      { n: "Calf stretch", d: "30s / side, ×2", h: "Hands against a post or wall, step one foot back with the heel down and that leg straight — hold 30s. Then bend that back knee slightly, heel still down, to move the stretch lower into the calf — hold another 30s. Switch legs.", show: needsLowerPrep },
                      {
                        ...(eq.includes("bench")
                          ? { n: "Pigeon stretch (bench)", d: "30–45s / side", h: "Stand facing the bench and lay one shin sideways along the top of it, knee and foot both resting on the bench. Keep your back leg straight behind you and lean your chest gently forward over the front shin until the outside of that hip stretches." }
                          : { n: "Pigeon stretch (floor)", d: "30–45s / side", h: "Sit and cross one ankle over the opposite knee in a figure-4 shape, then hug the bottom knee toward your chest until the outside of the crossed leg's hip stretches." }),
                        show: needsLowerPrep,
                      },
                      { n: "Pancake or butterfly stretch", d: "60s · optional", h: "Sit with your legs spread wide (pancake) or with the soles of your feet pressed together, knees out (butterfly). Keep your back long and lean your chest forward until the inner thighs stretch.", show: needsLowerPrep },
                    ].filter((m) => m.show).map((m, j) => (
                      <div key={j} style={{ marginTop: j === 0 ? 8 : 10 }}>
                        <div style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>
                          {j + 1}. {m.n} <span style={{ color: T.green, fontWeight: 700 }}>— {m.d}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: T.steel, marginTop: 2, lineHeight: 1.45 }}>{m.h}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { setSwaps({}); setAdjs({}); setStep(0); }}
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
                      Learned from your ratings — applied automatically to new workouts.
                    </div>
                    {Object.entries(patternMem).filter(([, v]) => v !== 0).map(([p, v]) => (
                      <div key={p} style={{ fontSize: 13.5, color: T.ink, marginTop: 5 }}>
                        {PATTERNS[p]}: <b style={{ color: v > 0 ? T.green : T.orange }}>{v > 0 ? `+${v}` : v} level{Math.abs(v) > 1 ? "s" : ""}</b>
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
                      {en.cooldownAt != null && <div>Cool-down · finished at {Math.floor(en.cooldownAt / 60)}:{String(en.cooldownAt % 60).padStart(2, "0")}</div>}
                    </div>
                  </div>
                ))}
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

