import { PLAYER_PHYSICS, TILE } from './config.js';
import { LevelBuilder } from './levelBuilder.js';
import { LEVEL_RULES } from './levelRules.js';

export { LEVEL_RULES };

// Each entry: { type: 'ground'|'block'|'spike', x, y, w?, h? }
// Level 1 is generated from small motifs so spacing can be tuned through rules.
function createLevelOne() {
  const level = new LevelBuilder();

  // Warm-up: isolated single spikes with long recovery gaps.
  level.singleSpikeRhythm(640, 4, LEVEL_RULES.FIRST_LEVEL_SPIKE_GAP_TILES);

  // First platform reads: low blocks with safe exits.
  level.block(1960, 0, 1);
  level.block(2240, 0, 2);
  level.spike(2520, 0);

  // Intro rhythm: separated spikes with enough room to land and jump again.
  level.singleSpikeRhythm(2920, 2, LEVEL_RULES.FIRST_LEVEL_SPIKE_GAP_TILES);
  level.block(3360, 0, 1);
  level.spike(3680, 0);

  // Long staircase: each platform supports land, settle, and jump timing.
  const climb = level.staircase(4000, 0, 3);

  // Elevated platform: single supported spike at this difficulty level.
  const elevated = level.block(climb.nextX, 2, LEVEL_RULES.ELEVATED_PLATFORM_TILES);
  level.spikeOnBlock(elevated, 5);

  // Cascade back down to the base lane.
  const descent = level.cascade(elevated.x + elevated.w + LEVEL_RULES.STAIR_STEP_GAP_X, 1, 2);

  // Final check: return to the original ground rhythm.
  level.singleSpikeRhythm(descent.nextX + TILE * 2, 2, LEVEL_RULES.FIRST_LEVEL_SPIKE_GAP_TILES);
  level.block(descent.nextX + TILE * 18, 0, 2);
  level.spike(descent.nextX + TILE * 28, 0);

  // Win marker: safe finish platform after the final read.
  level.finishPlatform(descent.nextX + TILE * 38, 4);

  return level.build();
}

const levelOne = createLevelOne();

export const LEVEL_DATA = levelOne.data;
export const LEVEL_LENGTH = levelOne.length;

export class Level {
  constructor() {
    this.cameraX = 0;
    this.speed = PLAYER_PHYSICS.SPEED_X;
  }

  getVisible() {
    return LEVEL_DATA.filter(o =>
      (o.x + (o.w || TILE)) >= this.cameraX - 100 &&
      o.x <= this.cameraX + 900
    );
  }

  update(frameScale = 1) {
    this.cameraX += this.speed * frameScale;
  }

  get complete() {
    return this.cameraX >= LEVEL_LENGTH;
  }
}
