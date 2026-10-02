import { GAP, GROUND, PIPE_WIDTH, type Flight } from "./game";
import pepeUrl from "./assets/pepe.svg";
const pepe = new Image();
pepe.src = pepeUrl;
function cloud(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = "#f8fcf4";
  c.beginPath();
  c.roundRect(x, y + 13 * s, 80 * s, 18 * s, 9 * s);
  c.fill();
  c.beginPath();
  c.arc(x + 25 * s, y + 14 * s, 15 * s, 0, Math.PI * 2);
  c.arc(x + 48 * s, y + 10 * s, 19 * s, 0, Math.PI * 2);
  c.fill();
}
function pipe(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  top: boolean,
) {
  if (h <= 0) return;
  c.fillStyle = "#759e4c";
  c.fillRect(x, y, PIPE_WIDTH, h);
  c.fillStyle = "#aad47a";
  c.fillRect(x + 4, y, 10, h);
  c.fillStyle = "#92bf62";
  c.fillRect(x + 14, y, 32, h);
  c.fillStyle = "#4c7036";
  c.fillRect(x + PIPE_WIDTH - 7, y, 7, h);
  c.strokeStyle = "#456233";
  c.lineWidth = 2;
  c.strokeRect(x, y, PIPE_WIDTH, h);
  const lipY = top ? y + h - 22 : y;
  c.fillStyle = "#8bb55d";
  c.fillRect(x - 5, lipY, PIPE_WIDTH + 10, 22);
  c.strokeRect(x - 5, lipY, PIPE_WIDTH + 10, 22);
  c.fillStyle = "#b9dc86";
  c.fillRect(x - 3, lipY + 2, PIPE_WIDTH + 6, 4);
}
export function draw(
  c: CanvasRenderingContext2D,
  width: number,
  height: number,
  flight?: Flight,
): void {
  c.clearRect(0, 0, width, height);
  c.fillStyle = "#dfede7";
  c.fillRect(0, 0, width, height);
  c.fillStyle = "#f8f2cd";
  c.beginPath();
  c.arc(width * 0.82, 83, 34, 0, 2 * Math.PI);
  c.fill();
  cloud(c, width * 0.06, 65, 0.85);
  cloud(c, width * 0.56, 130, 0.6);
  cloud(c, width * 0.69, 30, 0.8);
  c.fillStyle = "#c3d8ae";
  c.beginPath();
  c.moveTo(0, height - 70);
  for (let x = 0; x <= width + 40; x += 40)
    c.lineTo(x, height - 80 - Math.sin(x / 90) * 24);
  c.lineTo(width, height);
  c.lineTo(0, height);
  c.fill();
  c.fillStyle = "#abc88f";
  for (let x = -20; x < width + 35; x += 38) {
    c.beginPath();
    c.arc(x, height - 43, 36 + 12 * Math.sin(x), Math.PI, 0);
    c.fill();
  }
  const pipes = flight?.pipes ?? [
    { x: width * 0.83, center: height * 0.48 },
    { x: -32, center: height * 0.4 },
  ];
  for (const p of pipes) {
    pipe(c, p.x, 0, p.center - GAP / 2, true);
    pipe(
      c,
      p.x,
      p.center + GAP / 2,
      height - GROUND - p.center - GAP / 2,
      false,
    );
  }
  c.fillStyle = "#6e934c";
  c.fillRect(0, height - GROUND, width, 5);
  c.fillStyle = "#d4deb0";
  c.fillRect(0, height - GROUND + 5, width, GROUND - 5);
  c.fillStyle = "#aec18b";
  const offset = flight ? (flight.elapsed * 138) % 22 : 0;
  for (let x = -22; x < width; x += 22) {
    c.fillRect(x - offset, height - GROUND + 9, 11, 4);
    c.fillRect(x + 8 - offset, height - 10, 3, 3);
  }
  if (flight && pepe.complete) {
    c.save();
    c.translate(flight.x, flight.y);
    c.rotate(Math.max(-0.35, Math.min(0.9, flight.velocity / 650)));
    c.drawImage(pepe, -25, -22, 50, 42);
    c.restore();
  }
}
