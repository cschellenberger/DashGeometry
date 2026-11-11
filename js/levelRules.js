import { PLAYER_PHYSICS, TILE, WORLD } from './config.js';
import { validateOrbs } from './scoring.js';
import { validatePortals } from './portal.js';
import { validateSawblades } from './sawblade.js';

const FIRST_LEVEL_COMFORT_RATIO = 0.65;

export const LEVEL_RULES = {
  MIN_SPIKE_GAP_X: Math.ceil(comfortableJumpDistance(0, 1.08) / TILE) * TILE,
  FIRST_LEVEL_SPIKE_GAP_TILES: 8,
  STAIR_PLATFORM_W: TILE * 9,
  STAIR_STEP_GAP_X: TILE,
  ELEVATED_PLATFORM_TILES: 14,
  MAX_ELEVATED_SPIKES_PER_PLATFORM: 1,
  FINISH_BUFFER_X: TILE * 8,
  PORTAL_EXIT_CLEARANCE_TILES: 6,
};

export function laneY(lane) {
  return WORLD.GROUND_Y - TILE * (lane + 1);
}

export function jumpTimeForHeight(heightDelta) {
  const { GRAVITY, JUMP_FORCE } = PLAYER_PHYSICS;
  const a = 0.5 * GRAVITY;
  const b = JUMP_FORCE;
  const c = -heightDelta;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null;

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
  return Math.max(t1, t2);
}

export function jumpDistanceForHeight(heightDelta, speedX = PLAYER_PHYSICS.SPEED_X) {
  const time = jumpTimeForHeight(heightDelta);
  return time === null ? null : time * speedX;
}

export function comfortableJumpDistance(heightDelta, ratio = FIRST_LEVEL_COMFORT_RATIO, speedX = PLAYER_PHYSICS.SPEED_X) {
  const maxDistance = jumpDistanceForHeight(heightDelta, speedX);
  return maxDistance === null ? null : Math.floor(maxDistance * ratio);
}

export function stairGapForHeight(heightDelta, speedX = PLAYER_PHYSICS.SPEED_X) {
  const comfortable = comfortableJumpDistance(heightDelta, FIRST_LEVEL_COMFORT_RATIO, speedX);
  return Math.min(LEVEL_RULES.STAIR_STEP_GAP_X, Math.max(0, comfortable ?? 0));
}

export function calculateLevelLength(levelData) {
  const lastX = levelData
    .filter(o => o.type !== 'ground')
    .reduce((max, o) => Math.max(max, o.x + (o.w ?? TILE)), 0);

  return lastX + LEVEL_RULES.FINISH_BUFFER_X;
}

export function createLevelRules(options = {}) {
  return {
    minSpikeGapX: options.minSpikeGapX ?? LEVEL_RULES.MIN_SPIKE_GAP_X,
    portalExitClearanceTiles: options.portalExitClearanceTiles ?? LEVEL_RULES.PORTAL_EXIT_CLEARANCE_TILES,
    maxElevatedSpikesPerPlatform: options.maxElevatedSpikesPerPlatform ?? LEVEL_RULES.MAX_ELEVATED_SPIKES_PER_PLATFORM,
    speedX: options.speedX ?? PLAYER_PHYSICS.SPEED_X,
  };
}

export function validateLevelData(levelData, options = {}) {
  validateOrbs(levelData.filter(o => o.type === 'orb'));
  const rules = createLevelRules(options);
  const spikes = levelData.filter(o => o.type === 'spike');
  const blocks = levelData.filter(o => o.type === 'block');
  const portals = levelData.filter(o => o.type === 'portal');
  const bouncePads = levelData.filter(o => o.type === 'bouncePad');
  const saws = levelData.filter(o => o.type === 'sawblade');
  const hazards = [...spikes, ...saws];

  validateSawblades(saws, levelData.filter(o => o.type === 'ground' || o.type === 'block'));
  validateBouncePads(bouncePads, levelData.filter(o => o.type === 'ground' || o.type === 'block'));
  validateBlockOverlaps(blocks);
  validateJumpableBlockGaps(blocks, rules);
  validatePortals(portals, blocks, hazards, rules);

  for (const saw of saws) {
    if (hazards.some(other => other !== saw && other.y === saw.y && Math.abs(other.x - saw.x) < rules.minSpikeGapX)) {
      throw new Error(`Sawblade at x=${saw.x} is too close to another hazard.`);
    }
  }

  for (const spike of spikes) {
    const sameLaneSpike = spikes.find(other =>
      other !== spike &&
      other.y === spike.y &&
      other.x > spike.x &&
      other.x - spike.x < rules.minSpikeGapX
    );

    if (sameLaneSpike) {
      throw new Error(`Spikes at x=${spike.x} and x=${sameLaneSpike.x} are too close.`);
    }

    if (spike.y < laneY(0) && !hasSupportingBlock(spike, blocks)) {
      throw new Error(`Elevated spike at x=${spike.x}, y=${spike.y} is not fully supported.`);
    }
  }

  for (const block of blocks.filter(o => o.y < laneY(0))) {
    const supportedSpikes = spikes.filter(spike => isSpikeSupportedByBlock(spike, block));

    if (supportedSpikes.length > rules.maxElevatedSpikesPerPlatform) {
      throw new Error(`Elevated platform at x=${block.x}, y=${block.y} has too many spikes.`);
    }
  }
}

function validateBouncePads(pads, surfaces) {
  for (const pad of pads) {
    if (![pad.x, pad.y, pad.w, pad.heightMultiplier].every(Number.isFinite) ||
        pad.w <= 0 || pad.heightMultiplier <= 1) {
      throw new Error(`Bounce pad at x=${pad.x} needs finite dimensions, positive width and a height multiplier above 1.`);
    }
    if (!surfaces.some(surface =>
      surface.y === pad.y && surface.x <= pad.x && surface.x + surface.w >= pad.x + pad.w
    )) {
      throw new Error(`Bounce pad at x=${pad.x} is not fully supported.`);
    }
  }
}

function validateBlockOverlaps(blocks) {
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const first = blocks[i];
      const second = blocks[j];

      if (first.y !== second.y) continue;
      if (rangesOverlap(first.x, first.x + first.w, second.x, second.x + second.w)) {
        throw new Error(`Blocks at x=${first.x} and x=${second.x} overlap on lane y=${first.y}.`);
      }
    }
  }
}

function validateJumpableBlockGaps(blocks, rules) {
  const sorted = [...blocks].sort((a, b) => a.x - b.x);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const currentLane = laneForY(current.y);
    const nextLane = laneForY(next.y);
    const laneDelta = Math.abs(nextLane - currentLane);

    if (laneDelta !== 1) continue;

    const gap = next.x - (current.x + current.w);
    if (gap < 0) continue;
    if (gap > TILE * 4) continue;

    const startTopY = current.y;
    const targetTopY = next.y;
    const comfortable = comfortableJumpDistance(targetTopY - startTopY, FIRST_LEVEL_COMFORT_RATIO, rules.speedX);

    if (comfortable !== null && gap > comfortable) {
      throw new Error(
        `Gap from block at x=${current.x} to x=${next.x} is ${gap}px, above comfortable jump ${comfortable}px.`
      );
    }
  }
}

function hasSupportingBlock(spike, blocks) {
  return blocks.some(block => isSpikeSupportedByBlock(spike, block));
}

function isSpikeSupportedByBlock(spike, block) {
  const spikeLeft = spike.x;
  const spikeRight = spike.x + TILE;
  const spikeBaseY = spike.y + TILE;

  return (
    block.y === spikeBaseY &&
    block.x <= spikeLeft &&
    block.x + block.w >= spikeRight
  );
}

function laneForY(y) {
  return Math.round((WORLD.GROUND_Y - y) / TILE) - 1;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}
