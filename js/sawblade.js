import { COLLISION, TILE } from './config.js';

export const SAWBLADE = {
  SIZE: TILE,
  TEETH: 12,
  RADIANS_PER_FRAME: 0.12,
  HITBOX_INSET: 2,
  COLOR: '#f5a65b',
  EDGE_COLOR: '#ffe2bd',
  HUB_COLOR: '#584339',
};

export function createSawblade(x, surfaceY, options = {}) {
  return {
    type: 'sawblade', x, y: surfaceY - SAWBLADE.SIZE,
    w: SAWBLADE.SIZE, h: SAWBLADE.SIZE,
    phase: options.phase ?? 0,
    spin: options.spin ?? 1,
  };
}

export function sawbladeAngle(saw, elapsedFrames) {
  return (saw.phase + elapsedFrames * SAWBLADE.RADIANS_PER_FRAME * saw.spin) % (Math.PI * 2);
}

export function hitsSawblade(player, saw, cameraX) {
  const cx = saw.x - cameraX + saw.w / 2;
  const cy = saw.y + saw.h / 2;
  const margin = COLLISION.PLAYER_MARGIN;
  const closestX = Math.max(player.left + margin, Math.min(cx, player.right - margin));
  const closestY = Math.max(player.top + margin, Math.min(cy, player.bottom - margin));
  const radius = saw.w / 2 - SAWBLADE.HITBOX_INSET;
  return (cx - closestX) ** 2 + (cy - closestY) ** 2 <= radius ** 2;
}

export function validateSawblades(saws, surfaces) {
  for (const saw of saws) {
    if (![saw.x, saw.y, saw.phase, saw.spin].every(Number.isFinite) ||
        saw.w !== TILE || saw.h !== TILE || saw.spin === 0) {
      throw new Error(`Sawblade at x=${saw.x} needs a tile-sized footprint and finite nonzero spin.`);
    }
    if (!surfaces.some(surface => surface.y === saw.y + saw.h &&
      surface.x <= saw.x && surface.x + surface.w >= saw.x + saw.w)) {
      throw new Error(`Sawblade at x=${saw.x} is not fully supported.`);
    }
  }
}

export function drawSawblade(ctx, saw, cameraX, elapsedFrames, theme = {}) {
  ctx.save();
  ctx.translate(saw.x - cameraX + saw.w / 2, saw.y + saw.h / 2);
  ctx.rotate(sawbladeAngle(saw, elapsedFrames));
  // The tooth tips and their stroke remain inside the same 40px spike bounds.
  const outerRadius = saw.w / 2 - 0.5;
  const rootRadius = saw.w * 0.34;
  ctx.fillStyle = theme.sawblade ?? SAWBLADE.COLOR;
  ctx.strokeStyle = theme.sawbladeEdge ?? SAWBLADE.EDGE_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let tooth = 0; tooth < SAWBLADE.TEETH; tooth++) {
    for (const [fraction, radius] of [[0, rootRadius], [0.25, outerRadius], [0.6, outerRadius], [0.75, rootRadius]]) {
      const angle = (tooth + fraction) * Math.PI * 2 / SAWBLADE.TEETH;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (tooth === 0 && fraction === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = theme.sawbladeHub ?? SAWBLADE.HUB_COLOR;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Three dark slots make rotation legible even between similar tooth poses.
  for (let slot = 0; slot < 3; slot++) {
    ctx.rotate(Math.PI * 2 / 3);
    ctx.fillRect(8, -1, 5, 2);
  }
  ctx.restore();
}
