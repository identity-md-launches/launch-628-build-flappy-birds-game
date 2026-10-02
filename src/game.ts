export type Pipe = { x: number; center: number; passed: boolean };
export type Flight = {
  width: number;
  height: number;
  x: number;
  y: number;
  velocity: number;
  score: number;
  elapsed: number;
  spawn: number;
  pipes: Pipe[];
  alive: boolean;
};
export const RADIUS = 15;
export const PIPE_WIDTH = 62;
export const GAP = 160;
export const GROUND = 38;
export function newFlight(width: number, height: number): Flight {
  return {
    width,
    height,
    x: Math.min(170, width * 0.27),
    y: height * 0.43,
    velocity: -260,
    score: 0,
    elapsed: 0,
    spawn: 0,
    pipes: [{ x: width + 60, center: height * 0.47, passed: false }],
    alive: true,
  };
}
export function flap(flight: Flight): void {
  if (flight.alive) flight.velocity = -285;
}
export function step(
  flight: Flight,
  delta: number,
  random: () => number = Math.random,
): void {
  if (!flight.alive) return;
  const dt = Math.min(delta, 1 / 30);
  flight.elapsed += dt;
  flight.velocity += 850 * dt;
  flight.y += flight.velocity * dt;
  const speed = Math.min(185, 138 + flight.score * 1.4);
  for (const pipe of flight.pipes) {
    pipe.x -= speed * dt;
    if (
      flight.x + RADIUS > pipe.x - 4 &&
      flight.x - RADIUS < pipe.x + PIPE_WIDTH + 4 &&
      (flight.y - RADIUS < pipe.center - GAP / 2 ||
        flight.y + RADIUS > pipe.center + GAP / 2)
    )
      flight.alive = false;
    if (
      !pipe.passed &&
      pipe.x + PIPE_WIDTH < flight.x - RADIUS &&
      flight.alive
    ) {
      pipe.passed = true;
      flight.score++;
    }
  }
  if (flight.y - RADIUS <= 0 || flight.y + RADIUS >= flight.height - GROUND)
    flight.alive = false;
  const last = flight.pipes.at(-1);
  if (last && last.x < flight.width - 190) {
    const min = GAP / 2 + 48;
    const max = flight.height - GROUND - GAP / 2 - 48;
    const desired = min + random() * (max - min);
    const center = Math.max(
      last.center - 75,
      Math.min(last.center + 75, desired),
    );
    flight.pipes.push({ x: last.x + 240, center, passed: false });
  }
  flight.pipes = flight.pipes.filter((pipe) => pipe.x > -PIPE_WIDTH - 10);
}
