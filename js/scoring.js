// Shared by level authoring, collection, and rendering. Orb coordinates are the
// top-left of their circular bounds; sequence numbers are local to each level.
export const ORB_SIZE = 28;
export const ORB_TYPES = {
  cyan: { points: 10, color: '#48dbff' },
  gold: { points: 25, color: '#ffd65a' },
  pink: { points: 50, color: '#ff73d1' },
};

export function validateOrbs(orbs) {
  const ordered = [...orbs].sort((a, b) => a.x - b.x);
  ordered.forEach((orb, index) => {
    if (!Object.hasOwn(ORB_TYPES, orb.kind) ||
        ![orb.x, orb.y, orb.w, orb.h].every(Number.isFinite) ||
        orb.w <= 0 || orb.w !== orb.h) {
      throw new Error(`Orb at x=${orb.x} has invalid bounds or colour.`);
    }
    if (orb.sequence !== index + 1 || (index > 0 && orb.x <= ordered[index - 1].x)) {
      throw new Error('Orbs need unique increasing x positions and consecutive sequence numbers starting at 1.');
    }
  });
}

function touchesOrb(player, cameraX, orb) {
  const radius = orb.w / 2;
  const cx = orb.x + radius;
  const cy = orb.y + radius;
  const nearestX = Math.max(player.left + cameraX, Math.min(cx, player.right + cameraX));
  const nearestY = Math.max(player.top, Math.min(cy, player.bottom));
  return (cx - nearestX) ** 2 + (cy - nearestY) ** 2 <= radius ** 2;
}

export class ScoreSystem {
  constructor(orbs = []) {
    this.orbs = [...orbs].sort((a, b) => a.sequence - b.sequence);
    this.reset();
  }

  reset() {
    this.total = 0;
    this.multiplier = 1;
    this.lastSequence = null;
    this.collected = new Set();
    this.missed = new Set();
  }

  collect(orb) {
    if (!this.orbs.includes(orb) || this.collected.has(orb.sequence) || this.missed.has(orb.sequence)) return 0;
    this.multiplier = this.lastSequence !== null && orb.sequence === this.lastSequence + 1
      ? this.multiplier + 1 : 1;
    const points = ORB_TYPES[orb.kind].points * this.multiplier;
    this.total += points;
    this.lastSequence = orb.sequence;
    this.collected.add(orb.sequence);
    return points;
  }

  pass(worldLeft) {
    for (const orb of this.orbs) {
      if (orb.x + orb.w >= worldLeft || this.collected.has(orb.sequence) || this.missed.has(orb.sequence)) continue;
      this.missed.add(orb.sequence);
      this.multiplier = 1;
      this.lastSequence = null;
    }
  }

  update(player, cameraX) {
    // Process misses first, so an orb collected this frame starts a fresh chain
    // if the previous orb was just passed. No hit-testing along teleport paths.
    this.pass(player.left + cameraX);
    if (!player.hasJumped || player.isGrounded) return;
    for (const orb of this.orbs) {
      if (touchesOrb(player, cameraX, orb)) this.collect(orb);
    }
  }
}
