import "./style.css";
import pepeUrl from "./assets/pepe.svg";
import { newFlight, flap, step, type Flight } from "./game";
import { draw } from "./draw";
import {
  ENTRY_PREFIX,
  USER_KEY,
  isEntry,
  readEntries,
  rankEntries,
  validUsername,
  toCSV,
  type Entry,
} from "./storage";

const paths: Record<string, string> = {
  trophy:
    '<path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v6m-4 1h8"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  sound:
    '<path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m0-6-6 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  down: '<path d="M12 3v12m-5-5 5 5 5-5M5 15v5h14v-5"/>',
  pointer: '<path d="m5 3 14 10-7 1-3 7L5 3Z"/>',
  pipes: '<path d="M5 2v7H3v4h7V9H8V2m8 20v-7h-2v-4h7v4h-2v7"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  change: '<path d="M4 8h15l-4-4m5 12H5l4 4"/>',
};
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

$("#app").innerHTML = `
  <a class="skip-link" href="#game-heading">Skip to game</a>
  <header class="site-header wrap">
    <a href="./" class="brand" aria-label="Flappy Pepe home"><span class="brand-mark"><img src="${pepeUrl}" alt="" width="42" height="35"></span><span>flappy<span class="brand-pepe">pepe</span><span class="brand-dot">.</span></span></a>
    <div class="header-right"><span class="arcade-tag">A little internet arcade</span><a class="help-link" href="#how-to">How to play <span aria-hidden="true">↗</span></a><button class="icon-button" id="sound" aria-label="Enable sound" aria-pressed="false">${icon("mute")}</button></div>
  </header>
  <main class="wrap">
    <section class="intro" aria-labelledby="game-heading">
      <div><p class="eyebrow"><span></span> No wings. Just vibes.</p><h1 id="game-heading" tabindex="-1">Flap. Fall. <span>Repeat.</span></h1><p class="intro-copy">The internet’s favorite frog has a new bad idea. Help him fly.</p></div>
      <div class="edition"><span class="edition-star" aria-hidden="true">✳</span><span>Easy to play.<br>Hard to leave.</span></div>
    </section>
    <div class="arcade-layout">
      <section class="game-card" aria-label="Flappy Pepe game">
        <div class="game-toolbar"><div class="pond-label"><span class="status-dot"></span><span>The pond</span><span class="level">01</span></div><div class="scoreboard"><span>Score <strong id="score">00</strong></span><span class="best">${icon("trophy")} Best <strong id="best">00</strong></span><button class="icon-button small" id="pause" aria-label="Pause game" disabled>${icon("pause")}</button></div></div>
        <div class="game-stage" id="stage">
          <canvas id="canvas" aria-hidden="true"></canvas>
          <button id="flap" class="flap-surface" aria-label="Flap: press Space, Arrow Up, or tap" aria-describedby="game-controls" hidden></button>
          <div class="game-overlay" id="overlay"></div>
          <span class="scene-label" aria-hidden="true">PEPE AIRLINES · EST. JUST NOW</span>
        </div>
        <div class="game-controls" id="game-controls"><span><kbd>Space</kbd> <span class="or">/</span> Click <span class="or">/</span> Tap to flap</span><span><kbd>P</kbd> to pause</span></div>
        <div class="player-bar"><span class="player-info"><span class="avatar"><img src="${pepeUrl}" width="24" height="20" alt=""></span><span id="player-label">Your next obsession starts here.</span></span><button class="text-button" id="change-player" hidden>${icon("change")} Change player</button></div>
      </section>
      <aside class="leaderboard" aria-labelledby="leaderboard-heading">
        <div class="board-heading"><div class="trophy-box">${icon("trophy")}</div><div><h2 id="leaderboard-heading">Pond legends</h2><p>Every flight counts.</p></div><span class="local-badge">Local</span></div>
        <div class="board-controls"><label for="sort" class="sr-only">Sort leaderboard</label><select id="sort"><option value="score">Highest scores</option><option value="recent">Latest flights</option></select><span id="entry-count">0 entries</span></div>
        <div id="board-content"></div>
        <div class="pagination" id="pagination" hidden><button id="previous" class="icon-button" aria-label="Previous leaderboard page">←</button><span id="page-count"></span><button id="next" class="icon-button" aria-label="Next leaderboard page">→</button></div>
        <div class="board-footer"><p>Saved in this browser. Every player.<br>Every attempt. Even the embarrassing ones.</p><button class="text-button" id="download" disabled>${icon("down")} Export all scores</button></div>
      </aside>
    </div>
    <p class="storage-notice" id="storage-notice" role="status" hidden></p>
    <section class="how-to" id="how-to" aria-labelledby="how-heading"><div class="how-title"><p class="eyebrow">Flight school</p><h2 id="how-heading">Three rules.<br>Infinite retries.</h2></div><div class="instruction"><span class="instruction-icon">${icon("pointer")}</span><h3>01 <span>Find your rhythm</span></h3><p>Press Space, click, or tap the game to keep Pepe in the air.</p></div><div class="instruction"><span class="instruction-icon">${icon("pipes")}</span><h3>02 <span>Mind the gap</span></h3><p>Clear the pipes. Each pair is a point. The ground is not your friend.</p></div><div class="instruction"><span class="instruction-icon">${icon("spark")}</span><h3>03 <span>Become a pond legend</span></h3><p>Beat your best. Every finished run earns a spot on the board.</p></div></section>
  </main>
  <footer class="site-footer wrap"><span>Small frog. Big dreams.</span><span>Made for <strong>one more try.</strong> <span class="footer-frog" aria-hidden="true">✳</span></span></footer>
  <div id="announcer" class="sr-only" role="status" aria-live="polite"></div>
`;

type State = "welcome" | "playing" | "paused" | "over";
let state: State = "welcome";
let currentUser = "";
let rememberedUser = "";
let entries: Entry[] = [];
let page = 0;
let flight: Flight | undefined;
let sound = false;
let audio: AudioContext | undefined;
let frame = 0;
let lastTime = 0;
let lastScore = 0;
let latestEntry: Entry | undefined;
const canvas = $<HTMLCanvasElement>("#canvas");
const context = canvas.getContext("2d")!;
const stage = $("#stage");
const overlay = $("#overlay");
const flapButton = $<HTMLButtonElement>("#flap");
const pauseButton = $<HTMLButtonElement>("#pause");
const sortSelect = $<HTMLSelectElement>("#sort");

function announce(message: string) {
  $("#announcer").textContent = message;
}
function warning(message: string) {
  const notice = $("#storage-notice");
  notice.hidden = false;
  notice.textContent = message;
}
try {
  const loaded = readEntries(localStorage);
  entries = loaded.entries;
  rememberedUser = localStorage.getItem(USER_KEY) || "";
  if (loaded.damaged)
    warning(
      "Some saved scores could not be read. Valid scores are still here; export them to keep a backup.",
    );
} catch {
  warning(
    "Browser storage is unavailable. Scores will last for this visit only. Export all scores before leaving.",
  );
}

function beep(frequency: number, duration = 0.07) {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => {});
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.65,
      audio.currentTime + duration,
    );
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {
    sound = false;
    updateSound();
    warning(
      "Sound is unavailable in this browser. You can keep playing with sound off.",
    );
  }
}
function updateSound() {
  const button = $("#sound");
  button.innerHTML = icon(sound ? "sound" : "mute");
  button.setAttribute("aria-label", sound ? "Disable sound" : "Enable sound");
  button.setAttribute("aria-pressed", String(sound));
}
$("#sound").addEventListener("click", () => {
  sound = !sound;
  updateSound();
  beep(520);
});
function personalBest() {
  return entries
    .filter((e) => e.username === currentUser)
    .reduce((best, e) => Math.max(best, e.score), 0);
}
function updateScores() {
  $("#score").textContent = String(flight?.score || 0).padStart(2, "0");
  $("#best").textContent = String(personalBest()).padStart(2, "0");
}
function paint() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(w * ratio) ||
    canvas.height !== Math.round(h * ratio)
  ) {
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
  }
  context.setTransform(
    (ratio * w) / (flight?.width || w),
    0,
    0,
    (ratio * h) / (flight?.height || h),
    0,
    0,
  );
  draw(
    context,
    flight?.width || w,
    flight?.height || h,
    state === "welcome" ? undefined : flight,
  );
}
new ResizeObserver(paint).observe(stage);
function welcome(focus = false) {
  state = "welcome";
  flight = undefined;
  overlay.hidden = false;
  flapButton.hidden = true;
  pauseButton.disabled = true;
  $("#change-player").hidden = true;
  overlay.innerHTML = `<form class="welcome-panel" id="username-form" novalidate><div class="hero-pepe"><img src="${pepeUrl}" alt="Pepe, your very underqualified pilot" width="108" height="90"><span class="pepe-spark" aria-hidden="true">✧</span></div><p class="panel-kicker">Meet your new co-pilot</p><h2>Ready for takeoff?</h2><p class="panel-copy">Pick a name. Make the leaderboard.</p><div class="username-field"><label for="username">Your username</label><input id="username" name="username" type="text" autocomplete="nickname" maxlength="18" placeholder="e.g. pondlegend" aria-describedby="username-hint username-error" required><p class="field-hint" id="username-hint">2–18 letters, numbers, spaces, _ or -</p><p class="field-error" id="username-error" aria-live="polite"></p></div><button class="primary-button" type="submit">Start flying ${icon("arrow")}</button></form>`;
  const input = $<HTMLInputElement>("#username");
  input.value = currentUser || rememberedUser;
  input.addEventListener("input", () => {
    if (validUsername(input.value)) {
      input.removeAttribute("aria-invalid");
      $("#username-error").textContent = "";
    }
  });
  $("#username-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!validUsername(name)) {
      input.setAttribute("aria-invalid", "true");
      $("#username-error").textContent =
        "Use 2–18 letters, numbers, spaces, _ or -.";
      input.focus();
      return;
    }
    currentUser = name;
    try {
      localStorage.setItem(USER_KEY, name);
    } catch {
      /* Run persistence displays an actionable warning. */
    }
    $("#player-label").textContent = `Flying as ${currentUser}`;
    start();
  });
  updateScores();
  paint();
  if (focus) input.focus();
}
function start() {
  if (!currentUser) return;
  cancelAnimationFrame(frame);
  flight = newFlight(stage.clientWidth, stage.clientHeight);
  state = "playing";
  lastScore = 0;
  overlay.hidden = true;
  flapButton.hidden = false;
  pauseButton.disabled = false;
  pauseButton.setAttribute("aria-label", "Pause game");
  pauseButton.innerHTML = icon("pause");
  $("#change-player").hidden = true;
  updateScores();
  renderBoard();
  flapButton.focus({ preventScroll: true });
  lastTime = performance.now();
  announce(
    `Flight started for ${currentUser}. Press Space or Arrow Up to flap. P to pause.`,
  );
  frame = requestAnimationFrame(tick);
}
function tick(time: number) {
  if (state !== "playing" || !flight) return;
  step(flight, (time - lastTime) / 1000);
  lastTime = time;
  if (flight.score !== lastScore) {
    lastScore = flight.score;
    updateScores();
    beep(780);
  }
  paint();
  if (!flight.alive) finish();
  else frame = requestAnimationFrame(tick);
}
function finish() {
  if (state !== "playing" || !flight) return;
  const previousBest = personalBest();
  state = "over";
  beep(150, 0.18);
  pauseButton.disabled = true;
  flapButton.hidden = true;
  latestEntry = {
    id: crypto.randomUUID(),
    username: currentUser,
    score: flight.score,
    date: new Date().toISOString(),
    duration: flight.elapsed,
  };
  entries.push(latestEntry);
  let saved = true;
  try {
    localStorage.setItem(
      ENTRY_PREFIX + latestEntry.id,
      JSON.stringify(latestEntry),
    );
  } catch {
    saved = false;
    warning(
      "This run could not be saved to your browser. It is still on this board. Export all scores before leaving to keep it.",
    );
  }
  page = 0;
  updateScores();
  renderBoard();
  overlay.hidden = false;
  $("#change-player").hidden = false;
  overlay.innerHTML = `<div class="result-panel"><img src="${pepeUrl}" width="85" height="71" alt=""><p class="panel-kicker">${flight.score > previousBest ? "A new personal best" : "A very grounded performance"}</p><h2>One more try?</h2><div class="result-score"><strong>${flight.score}</strong><span>${flight.score === 1 ? "pipe cleared" : "pipes cleared"}</span></div><p class="panel-copy">${saved ? "Flight recorded. Your legend is growing." : "Flight kept for this visit. Export to save it."}</p><button class="primary-button" id="retry">Play again ${icon("arrow")}</button></div>`;
  $("#retry").addEventListener("click", start);
  $("#retry").focus({ preventScroll: true });
  announce(
    `Game over. ${flight.score} points. ${saved ? "Score saved to this browser." : "Score could not be saved; export to keep it."}`,
  );
}
function pause() {
  if (state !== "playing") return;
  state = "paused";
  cancelAnimationFrame(frame);
  overlay.hidden = false;
  flapButton.hidden = true;
  pauseButton.setAttribute("aria-label", "Resume game");
  pauseButton.innerHTML = icon("play");
  overlay.innerHTML = `<div class="result-panel pause-panel"><span class="pause-illustration">${icon("pause")}</span><p class="panel-kicker">A little breather</p><h2>Holding that thought.</h2><p class="panel-copy">Your flight is right where you left it.</p><button class="primary-button" id="resume">Resume flying ${icon("play")}</button></div>`;
  $("#resume").addEventListener("click", resume);
  $("#resume").focus({ preventScroll: true });
  announce("Game paused. Resume when you are ready.");
}
function resume() {
  if (state !== "paused") return;
  state = "playing";
  overlay.hidden = true;
  flapButton.hidden = false;
  pauseButton.innerHTML = icon("pause");
  pauseButton.setAttribute("aria-label", "Pause game");
  flapButton.focus({ preventScroll: true });
  lastTime = performance.now();
  frame = requestAnimationFrame(tick);
  announce("Flight resumed.");
}
function doFlap() {
  if (state === "playing" && flight) {
    flap(flight);
    beep(450);
  }
}
flapButton.addEventListener("pointerdown", (e) => {
  if (e.button === 0) {
    e.preventDefault();
    flapButton.focus({ preventScroll: true });
    doFlap();
  }
});
flapButton.addEventListener("click", (e) => {
  if (e.detail === 0) doFlap();
});
flapButton.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (!e.repeat) doFlap();
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLSelectElement
  )
    return;
  if (
    (e.code === "KeyP" || e.code === "Escape") &&
    !e.repeat &&
    (state === "playing" || state === "paused")
  ) {
    e.preventDefault();
    if (state === "playing") pause();
    else resume();
  }
});
pauseButton.addEventListener("click", () =>
  state === "playing" ? pause() : resume(),
);
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
$("#change-player").addEventListener("click", () => welcome(true));

function renderBoard() {
  const sorted = rankEntries(entries, sortSelect.value);
  const totalPages = Math.max(1, Math.ceil(entries.length / 5));
  page = Math.min(page, totalPages - 1);
  $("#entry-count").textContent =
    `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
  $<HTMLButtonElement>("#download").disabled = !entries.length;
  $("#pagination").hidden = totalPages <= 1;
  $("#page-count").textContent = `${page + 1} of ${totalPages}`;
  $<HTMLButtonElement>("#previous").disabled = page === 0;
  $<HTMLButtonElement>("#next").disabled = page === totalPages - 1;
  if (!entries.length) {
    $("#board-content").innerHTML =
      `<div class="board-empty"><div class="podium" aria-hidden="true"><span>2</span><span>${icon("trophy")}1</span><span>3</span></div><h3>The pond is quiet.</h3><p>Your first flight could be legendary.<br> Or three seconds long. Both count.</p><span class="empty-caption">Your name goes here ${icon("arrow")}</span></div>`;
    return;
  }
  $("#board-content").innerHTML =
    `<table><caption class="sr-only">Every completed run in this browser, sorted by ${sortSelect.value === "recent" ? "latest flight" : "highest score"}</caption><thead><tr><th scope="col">#</th><th scope="col">Pilot</th><th scope="col">Score</th></tr></thead><tbody>${sorted
      .slice(page * 5, page * 5 + 5)
      .map((entry, i) => {
        const rank = page * 5 + i + 1;
        const date = new Date(entry.date);
        return `<tr class="${entry.id === latestEntry?.id ? "latest-row" : ""}"><td><span class="rank ${rank === 1 && sortSelect.value === "score" ? "rank-first" : ""}">${rank.toString().padStart(2, "0")}</span></td><td><div class="pilot-name"><bdi>${escape(entry.username)}</bdi>${entry.username === currentUser ? '<span class="you-label">you</span>' : ""}</div><time datetime="${escape(entry.date)}" title="${escape(date.toLocaleString())}">${escape(date.toLocaleDateString(undefined, { month: "short", day: "numeric" }))} · ${escape(date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))}</time></td><td class="entry-score">${entry.score}</td></tr>`;
      })
      .join("")}</tbody></table>`;
}
sortSelect.addEventListener("change", () => {
  page = 0;
  renderBoard();
  announce(`Leaderboard sorted by ${sortSelect.selectedOptions[0].text}.`);
});
$("#previous").addEventListener("click", () => {
  page--;
  renderBoard();
  announce(`Leaderboard page ${page + 1}.`);
});
$("#next").addEventListener("click", () => {
  page++;
  renderBoard();
  announce(`Leaderboard page ${page + 1}.`);
});
$("#download").addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + toCSV(entries)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "flappy-pepe-scores.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(`Exported ${entries.length} scores.`);
});
window.addEventListener("storage", (event) => {
  if (event.key?.startsWith(ENTRY_PREFIX) && event.newValue) {
    try {
      const value: unknown = JSON.parse(event.newValue);
      if (isEntry(value) && !entries.some((e) => e.id === value.id)) {
        entries.push(value);
        renderBoard();
        updateScores();
      }
    } catch {
      /* Ignore invalid records from other tabs. */
    }
  }
});
welcome();
renderBoard();
