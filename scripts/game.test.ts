import { test } from "node:test";
import assert from "node:assert/strict";
import { newFlight, flap, step, GAP, GROUND } from "../src/game.ts";
import {
  validUsername,
  rankEntries,
  readEntries,
  toCSV,
  ENTRY_PREFIX,
  isEntry,
} from "../src/storage.ts";

test("username is required and constrained, with Unicode names accepted", () => {
  for (const value of [
    "",
    " ",
    "a",
    "abcdefghijklmnopqrs",
    "<script>",
    "frog🐸",
  ])
    assert.equal(validUsername(value), false, value);
  for (const value of [
    "Pepe",
    "  pond legend  ",
    "Élodie",
    "青蛙",
    "pond_01",
    "pepe-2",
  ])
    assert.equal(validUsername(value), true, value);
});
test("flapping gives upward velocity; gravity leads to ground collision", () => {
  const f = newFlight(800, 440);
  flap(f);
  assert.ok(f.velocity < 0);
  for (let i = 0; i < 200; i++) step(f, 1 / 60);
  assert.equal(f.alive, false);
  assert.ok(f.y + 15 >= f.height - GROUND);
});
test("ceiling and pipe collision end a flight", () => {
  const ceiling = newFlight(800, 440);
  ceiling.y = 15;
  step(ceiling, 1 / 60);
  assert.equal(ceiling.alive, false);
  const pipe = newFlight(800, 440);
  pipe.pipes = [{ x: pipe.x, center: 330, passed: false }];
  step(pipe, 1 / 60);
  assert.equal(pipe.alive, false);
});
test("passing a gap awards exactly one point, and no point after collision", () => {
  const f = newFlight(800, 440);
  f.velocity = 0;
  f.pipes = [{ x: f.x - 78, center: f.y, passed: false }];
  step(f, 1 / 60);
  assert.equal(f.score, 1);
  step(f, 1 / 60);
  assert.equal(f.score, 1);
  f.alive = false;
  const y = f.y;
  step(f, 1);
  flap(f);
  assert.equal(f.y, y);
  assert.equal(f.score, 1);
});
test("long frame gaps are bounded", () => {
  const f = newFlight(800, 440);
  step(f, 60);
  assert.ok(f.elapsed <= 1 / 30);
  assert.equal(f.alive, true);
});
test("generated gaps fit the world and remain reachable", () => {
  for (const width of [282, 352, 800]) {
    const f = newFlight(width, 440);
    f.pipes[0].x = width - 200;
    step(f, 1 / 60, () => 1);
    assert.equal(f.pipes.length, 2);
    const next = f.pipes[1];
    assert.ok(next.center - GAP / 2 > 0);
    assert.ok(next.center + GAP / 2 < 440 - GROUND);
    assert.ok(Math.abs(next.center - f.pipes[0].center) <= 75);
  }
});
test("a controlled flight can score on desktop and mobile physics", () => {
  for (const width of [282, 800]) {
    const f = newFlight(width, 440);
    for (let i = 0; i < 2000 && f.alive; i++) {
      const next = f.pipes.find((p) => p.x + 62 >= f.x - 15);
      if (f.y > (next?.center || 207) + 20 && f.velocity > 0) flap(f);
      step(f, 1 / 120, () => 0.5);
    }
    assert.equal(f.alive, true);
    assert.ok(f.score >= 5, `score=${f.score} width=${width}`);
  }
});
const a = {
  id: "a",
  username: "Pepe",
  score: 0,
  date: "2026-10-02T12:00:00.000Z",
  duration: 1.2,
};
const b = { ...a, id: "b", score: 9, date: "2026-10-02T12:01:00.000Z" };
test("ranking retains repeated names and zero scores; ties favor the first run", () => {
  const c = { ...b, id: "c", date: "2026-10-02T12:02:00.000Z" };
  assert.deepEqual(
    rankEntries([a, b, c], "score").map((x) => x.id),
    ["b", "c", "a"],
  );
  assert.deepEqual(
    rankEntries([a, b, c], "recent").map((x) => x.id),
    ["c", "b", "a"],
  );
});
test("storage preserves valid records and flags malformed records", () => {
  const values = new Map([
    [ENTRY_PREFIX + "a", JSON.stringify(a)],
    [ENTRY_PREFIX + "broken", "{"],
    ["unrelated", "{}"],
  ]);
  const storage = {
    length: values.size,
    key: (i: number) => [...values.keys()][i],
    getItem: (k: string) => values.get(k),
  };
  const result = readEntries(storage as Storage);
  assert.deepEqual(result.entries, [a]);
  assert.equal(result.damaged, true);
});
test("invalid stored records cannot enter the table", () => {
  assert.equal(isEntry(a), true);
  for (const bad of [
    null,
    {},
    { ...a, score: -1 },
    { ...a, score: 1.2 },
    { ...a, date: "bad" },
    { ...a, duration: Infinity },
    { ...a, username: "<script>" },
  ])
    assert.equal(isEntry(bad), false);
});
test("CSV includes every run, escapes cells, and guards formula-like names", () => {
  const csv = toCSV([a, b, { ...a, username: "-pond", id: "c" }]);
  assert.equal(csv.split("\r\n").length, 4);
  assert.ok(csv.includes('"\'-pond"'));
  assert.ok(csv.includes('"Pepe",0,'));
});
