import { BOUNCE_PAD, TILE } from './config.js';
import { ORB_TYPES } from './scoring.js';
import { drawSawblade } from './sawblade.js';

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

  clear(theme = {}) {
    const { ctx } = this;
    ctx.fillStyle = theme.background ?? BG_COLOR;
    ctx.fillRect(0, 0, 800, 600);
  }

  drawParallax(cameraX, theme = {}, cameraY = 0) {
    const { ctx } = this;
    // Layer 1 — slow distant lines
    ctx.strokeStyle = theme.parallaxSlow ?? theme.parallaxFar ?? GROUND_COL;
    ctx.lineWidth = 1;
    const off1 = (cameraX * 0.3) % 80;
    for (let x = -off1; x < 800; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, cameraY);
      ctx.lineTo(x, cameraY + 600);
      ctx.stroke();
    }
    // Layer 2 — slightly faster
    ctx.strokeStyle = theme.parallaxFast ?? theme.parallaxNear ?? '#0f2340';
    const off2 = (cameraX * 0.6) % 120;
    for (let x = -off2; x < 800; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, cameraY);
      ctx.lineTo(x + 30, cameraY + 600);
      ctx.stroke();
    }
  }

  drawObstacles(obstacles, cameraX, theme = {}, elapsedFrames = 0) {
    const { ctx } = this;
    for (const o of obstacles) {
      const sx = o.x - cameraX;
      if (o.type === 'ground') {
        ctx.fillStyle = theme.ground ?? GROUND_COL;
        ctx.fillRect(sx, o.y, o.w, o.h);
      } else if (o.type === 'block') {
        ctx.fillStyle = theme.block ?? BLOCK_COL;
        ctx.fillRect(sx, o.y, o.w, o.h);
        ctx.strokeStyle = theme.blockEdge ?? BLOCK_EDGE;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, o.y + 1, o.w - 2, o.h - 2);
        if (o.requiresBounce) {
          ctx.save();
          ctx.fillStyle = theme.bouncePad ?? BOUNCE_PAD.COLOR;
          ctx.fillRect(sx, o.y, o.w, 4);
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText('2x ACCESS', sx + 12, o.y - 10);
          ctx.restore();
        }
      } else if (o.type === 'spike') {
        ctx.fillStyle = theme.spike ?? SPIKE_COL;
        ctx.strokeStyle = theme.spikeEdge ?? SPIKE_EDGE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, o.y + TILE);
        ctx.lineTo(sx + TILE / 2, o.y);
        ctx.lineTo(sx + TILE, o.y + TILE);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (o.type === 'sawblade') {
        drawSawblade(ctx, o, cameraX, elapsedFrames, theme);
      } else if (o.type === 'orb') {
        this.drawOrb(o, cameraX);
      } else if (o.type === 'portal') {
        this.drawPortal(o, cameraX, theme);
      }
    }
    // Draw surface decorations last so platform/ground order cannot hide them.
    for (const pad of obstacles.filter(o => o.type === 'bouncePad')) {
      this.drawBouncePad(pad, cameraX, theme);
    }
  }

  drawPortal(o, cameraX, theme = {}) {
    const { ctx } = this;
    const sx = o.x - cameraX;
    const fallbackColor = o.role === 'entrance' ? '#4deeea' : '#9b5de5';
    const portalColor = (o.themeKey && theme[o.themeKey]) ?? fallbackColor;
    const glowColor = theme.portalGlow ?? 'rgba(77, 238, 234, 0.26)';
    const cx = sx + o.w / 2;
    const cy = o.y + o.h / 2;

    ctx.save();
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy, o.w * 0.58, o.h * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = portalColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, o.w * 0.38, o.h * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, o.w * 0.24, o.h * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawBouncePad(pad, cameraX, theme = {}) {
    const { ctx } = this;
    const x = pad.x - cameraX;
    ctx.save();
    ctx.fillStyle = theme.bouncePad ?? BOUNCE_PAD.COLOR;
    ctx.fillRect(x, pad.y - 8, pad.w, 8);
    ctx.strokeStyle = theme.bouncePadEdge ?? BOUNCE_PAD.EDGE_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, pad.y - 7, pad.w - 2, 6);
    ctx.strokeStyle = theme.bouncePad ?? BOUNCE_PAD.COLOR;
    for (const offset of [18, 28]) {
      ctx.beginPath();
      ctx.moveTo(x + pad.w / 2 - 7, pad.y - offset + 5);
      ctx.lineTo(x + pad.w / 2, pad.y - offset);
      ctx.lineTo(x + pad.w / 2 + 7, pad.y - offset + 5);
      ctx.stroke();
    }
    ctx.fillStyle = theme.bouncePad ?? BOUNCE_PAD.COLOR;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${pad.heightMultiplier}x HEIGHT`, x + pad.w / 2, pad.y - 40);
    ctx.restore();
  }

  drawOrb(orb, cameraX) {
    const { ctx } = this;
    const { color, points } = ORB_TYPES[orb.kind];
    const radius = orb.w / 2;
    const cx = orb.x - cameraX + radius;
    const cy = orb.y + radius;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#151525';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(points, cx, cy + 4);
    ctx.restore();
  }

  drawPlayer(player, theme = {}) {
    const { ctx } = this;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((player.angle * Math.PI) / 180);
    ctx.fillStyle = theme.player ?? PLAYER_COL;
    ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
    ctx.strokeStyle = theme.playerEdge ?? PLAYER_EDGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(-player.w / 2 + 1, -player.h / 2 + 1, player.w - 2, player.h - 2);
    // inner detail
    ctx.fillStyle = theme.playerEdge ?? PLAYER_EDGE;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }

  drawUI(score, levelName, theme = {}, scoring) {
    const { ctx } = this;
    ctx.fillStyle = theme.ui ?? '#ecf0f1';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${Math.floor(score)}%`, 16, 30);
    ctx.fillText(levelName, 16, 56);
    if (scoring) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillText(`Score ${scoring.total} | x${scoring.multiplier}`, 784, 30);
      ctx.font = '14px monospace';
      ctx.fillText(`Orbs ${scoring.collected.size}/${scoring.orbs.length}`, 784, 54);
      ctx.restore();
    }
  }

  drawMenu(levelName, theme = {}, hint) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = theme.player ?? '#f1c40f';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DashGeometry', 400, 220);
    ctx.fillStyle = theme.ui ?? '#ecf0f1';
    ctx.font = '22px monospace';
    ctx.fillText('Click, Space, or Tap to Play', 400, 290);
    ctx.fillText(levelName, 400, 328);
    ctx.font = '14px monospace';
    ctx.fillStyle = theme.muted ?? '#95a5a6';
    ctx.fillText('Avoid hazards. Reach the end.', 400, 370);
    ctx.fillText('Press L to switch levels.', 400, 398);
    ctx.fillText('Jump for orbs: cyan 10 / gold 25 / pink 50', 400, 434);
    ctx.fillText('Collect in order: x1, x2, x3... Miss one to reset.', 400, 458);
    if (hint) ctx.fillText(hint, 400, 486);
    ctx.textAlign = 'left';
  }

  drawDead(score, levelName, theme = {}, scoring) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = theme.danger ?? '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('You Died', 400, 230);
    ctx.fillStyle = theme.ui ?? '#ecf0f1';
    ctx.font = '22px monospace';
    ctx.fillText(`Progress: ${Math.floor(score)}%`, 400, 290);
    ctx.fillText(levelName, 400, 324);
    ctx.font = '18px monospace';
    ctx.fillText('Click, Space, or Tap to Retry', 400, 370);
    ctx.font = '14px monospace';
    ctx.fillStyle = theme.muted ?? '#95a5a6';
    ctx.fillText('Press L to switch levels.', 400, 404);
    if (scoring) ctx.fillText(`Score ${scoring.total} | Orbs ${scoring.collected.size}/${scoring.orbs.length}`, 400, 440);
    ctx.textAlign = 'left';
  }

  drawWin(levelName, theme = {}, scoring) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = theme.success ?? '#2ecc71';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', 400, 230);
    ctx.fillStyle = theme.ui ?? '#ecf0f1';
    ctx.font = '22px monospace';
    ctx.fillText('100%', 400, 290);
    ctx.fillText(levelName, 400, 324);
    ctx.font = '18px monospace';
    ctx.fillText('Click, Space, or Tap to Play Again', 400, 370);
    ctx.font = '14px monospace';
    ctx.fillStyle = theme.muted ?? '#95a5a6';
    ctx.fillText('Press L to switch levels.', 400, 404);
    if (scoring) ctx.fillText(`Score ${scoring.total} | Orbs ${scoring.collected.size}/${scoring.orbs.length}`, 400, 440);
    ctx.textAlign = 'left';
  }
}
