import { TILE } from './player.js';

const BG_COLOR   = '#1a1a2e';
const GROUND_COL = '#16213e';
const BLOCK_COL  = '#0f3460';
const BLOCK_EDGE = '#1a5276';
const SPIKE_COL  = '#e74c3c';
const SPIKE_EDGE = '#c0392b';
const PLAYER_COL = '#f1c40f';
const PLAYER_EDGE= '#f39c12';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
    this.canvas.width  = 800;
    this.canvas.height = 600;
    this.canvas.style.width  = `${800 * scale}px`;
    this.canvas.style.height = `${600 * scale}px`;
  }

  clear() {
    const { ctx } = this;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, 800, 600);
  }

  drawParallax(cameraX) {
    const { ctx } = this;
    // Layer 1 — slow distant lines
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    const off1 = (cameraX * 0.3) % 80;
    for (let x = -off1; x < 800; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 560);
      ctx.stroke();
    }
    // Layer 2 — slightly faster
    ctx.strokeStyle = '#0f2340';
    const off2 = (cameraX * 0.6) % 120;
    for (let x = -off2; x < 800; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 30, 560);
      ctx.stroke();
    }
  }

  drawObstacles(obstacles, cameraX) {
    const { ctx } = this;
    for (const o of obstacles) {
      const sx = o.x - cameraX;
      if (o.type === 'ground') {
        ctx.fillStyle = GROUND_COL;
        ctx.fillRect(sx, o.y, o.w, o.h);
      } else if (o.type === 'block') {
        ctx.fillStyle = BLOCK_COL;
        ctx.fillRect(sx, o.y, o.w, o.h);
        ctx.strokeStyle = BLOCK_EDGE;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, o.y + 1, o.w - 2, o.h - 2);
      } else if (o.type === 'spike') {
        ctx.fillStyle = SPIKE_COL;
        ctx.strokeStyle = SPIKE_EDGE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, o.y + TILE);
        ctx.lineTo(sx + TILE / 2, o.y);
        ctx.lineTo(sx + TILE, o.y + TILE);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  drawPlayer(player) {
    const { ctx } = this;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((player.angle * Math.PI) / 180);
    ctx.fillStyle = PLAYER_COL;
    ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
    ctx.strokeStyle = PLAYER_EDGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(-player.w / 2 + 1, -player.h / 2 + 1, player.w - 2, player.h - 2);
    // inner detail
    ctx.fillStyle = PLAYER_EDGE;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }

  drawUI(score, state) {
    const { ctx } = this;
    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${Math.floor(score)}%`, 16, 30);
  }

  drawMenu() {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DashGeometry', 400, 220);
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '22px monospace';
    ctx.fillText('Click, Space, or Tap to Play', 400, 290);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#95a5a6';
    ctx.fillText('Avoid spikes. Reach the end.', 400, 340);
    ctx.textAlign = 'left';
  }

  drawDead(score) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('You Died', 400, 230);
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '22px monospace';
    ctx.fillText(`Progress: ${Math.floor(score)}%`, 400, 290);
    ctx.font = '18px monospace';
    ctx.fillText('Click, Space, or Tap to Retry', 400, 340);
    ctx.textAlign = 'left';
  }

  drawWin() {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', 400, 230);
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '22px monospace';
    ctx.fillText('100%', 400, 290);
    ctx.font = '18px monospace';
    ctx.fillText('Click, Space, or Tap to Play Again', 400, 340);
    ctx.textAlign = 'left';
  }
}
