import { PLAYER_PHYSICS, TILE, WORLD } from './config.js';

const FIRST_LEVEL_COMFORT_RATIO = 0.65;

export const LEVEL_RULES = {
  MIN_SPIKE_GAP_X: Math.ceil(comfortableJumpDistance(0, 1.08) / TILE) * TILE,
  FIRST_LEVEL_SPIKE_GAP_TILES: 8,
  STAIR_PLATFORM_W: TILE * 9,
  STAIR_STEP_GAP_X: TILE,
  ELEVATED_PLATFORM_TILES: 14,
  MAX_ELEVATED_SPIKES_PER_PLATFORM: 1,
  FINISH_BUFFER_X: TILE * 8,
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

export function jumpDistanceForHeight(heightDelta) {
  const time = jumpTimeForHeight(heightDelta);
  return time === null ? null : time * PLAYER_PHYSICS.SPEED_X;
}

export function comfortableJumpDistance(heightDelta, ratio = FIRST_LEVEL_COMFORT_RATIO) {
  const maxDistance = jumpDistanceForHeight(heightDelta);
  return maxDistance === null ? null : Math.floor(maxDistance * ratio);
}

export function stairGapForHeight(heightDelta) {
  const comfortable = comfortableJumpDistance(heightDelta);
  return Math.min(LEVEL_RULES.STAIR_STEP_GAP_X, Math.max(0, comfortable ?? 0));
}

export function calculateLevelLength(levelData) {
  const lastX = levelData
    .filter(o => o.type !== 'ground')
    .reduce((max, o) => Math.max(max, o.x + (o.w ?? TILE)), 0);

  return lastX + LEVEL_RULES.FINISH_BUFFER_X;
}

export function validateLevelData(levelData) {
  const spikes = levelData.filter(o => o.type === 'spike');
  const blocks = levelData.filter(o => o.type === 'block');

  for (const spike of spikes) {
    const sameLaneSpike = spikes.find(other =>
      other !== spike &&
      other.y === spike.y &&
      other.x > spike.x &&
      other.x - spike.x < LEVEL_RULES.MIN_SPIKE_GAP_X
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

    if (supportedSpikes.length > LEVEL_RULES.MAX_ELEVATED_SPIKES_PER_PLATFORM) {
      throw new Error(`Elevated platform at x=${block.x}, y=${block.y} has too many spikes.`);
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
