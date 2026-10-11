import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const source = readFileSync(new URL("../fitness-corner-generator.jsx", import.meta.url), "utf8");
const match = source.match(/\/\/ BEGIN buildWeekGrid\n([\s\S]*?)\/\/ END buildWeekGrid/);
assert.ok(match, "Helper source markers exist");
const buildWeekGrid = new Function(`${match[1]}\nreturn buildWeekGrid;`)();
const now = Date.parse("2026-10-10T18:00:00.000Z"); // Sunday 02:00 SGT
const empty = buildWeekGrid([], now);
assert.equal(empty.length, 8);
assert.ok(empty.every((row) => row.length === 7));
assert.equal(empty[0][0].dateKey, "2026-08-17");
assert.equal(empty[7][0].dateKey, "2026-10-05");
assert.equal(empty[7][6].dateKey, "2026-10-11");
assert.ok(empty.flat().every((day) => day.sessions.length === 0));
assert.deepEqual(empty.flat().filter((day) => day.isToday).map((day) => day.dateKey), ["2026-10-11"]);
assert.ok(empty.every((row) => new Date(`${row[0].dateKey}T00:00:00Z`).getUTCDay() === 1));
assert.deepEqual(buildWeekGrid([], new Date(now)), empty);
for (const missing of [undefined, null, {}]) assert.deepEqual(buildWeekGrid(missing, now), empty);

const session = (date) => Object.freeze({ date, corner: "Park", focus: "Full body", durationSec: 600 });
const late = session("2026-10-10T15:30:00.000Z"); // Saturday 23:30 SGT
const early = session("2026-10-10T16:30:00.000Z"); // Sunday 00:30 SGT
const second = session("2026-10-10T17:30:00.000Z");
const boundary = session("2026-08-16T16:00:00.000Z");
const old = session("2026-08-16T15:59:59.999Z");
const future = session("2026-10-10T18:00:00.001Z");
const log = Object.freeze([future, second, early, late, boundary, old, null, {}, { date: "invalid" }, { date: null }]);
const grid = buildWeekGrid(log, now);
assert.deepEqual(grid[7][5].sessions, [late]);
assert.deepEqual(grid[7][6].sessions, [early, second]);
assert.equal(grid[7][6].sessions[0], early, "Keep original entry references");
assert.deepEqual(grid[0][0].sessions, [boundary]);
assert.equal(grid.flat().flatMap((day) => day.sessions).length, 4);
assert.equal(log[0], future, "Do not reorder the log");

const monday = buildWeekGrid([], Date.parse("2026-10-11T16:00:00Z"));
assert.equal(monday[7][0].dateKey, "2026-10-12");
assert.ok(monday[7][0].isToday);
assert.ok(!monday[7][0].isFuture);
assert.ok(monday[7].slice(1).every((day) => day.isFuture));
const newYear = buildWeekGrid([], Date.parse("2026-12-31T16:00:00Z"));
assert.equal(newYear[7][0].dateKey, "2026-12-28");
assert.equal(newYear[7][4].dateKey, "2027-01-01");
assert.ok(newYear[7][4].isToday);

if (!process.argv.includes("--timezone-check")) {
  for (const TZ of ["UTC", "Asia/Singapore", "America/Los_Angeles"]) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--timezone-check"], {
      env: { ...process.env, TZ }, encoding: "utf8",
    });
    assert.equal(result.status, 0, `${TZ}: ${result.stderr || result.error || "test failed"}`);
  }
  console.log("Week grid tests passed (UTC, Singapore, Los Angeles).");
}
