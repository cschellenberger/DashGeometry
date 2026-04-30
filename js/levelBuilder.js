import { TILE, WORLD } from './config.js';
import { calculateLevelLength, laneY, LEVEL_RULES, validateLevelData } from './levelRules.js';

export class LevelBuilder {
  constructor() {
    this.objects = [
      { type: 'ground', x: -200, y: WORLD.GROUND_Y, w: 99999, h: WORLD.GROUND_H },
    ];
  }

  block(x, lane = 0, tilesWide = 1) {
    const block = { type: 'block', x, y: laneY(lane), w: TILE * tilesWide, h: TILE };
    this.objects.push(block);
    return block;
  }

  spike(x, lane = 0) {
    const spike = { type: 'spike', x, y: laneY(lane) };
    this.objects.push(spike);
    return spike;
  }

  spikeOnBlock(block, offsetTiles = 1) {
    const x = block.x + offsetTiles * TILE;
    const lane = Math.round((WORLD.GROUND_Y - block.y) / TILE);
    return this.spike(x, lane);
  }

  staircase(startX, startLane, steps, options = {}) {
    const platformTiles = options.platformTiles ?? LEVEL_RULES.STAIR_PLATFORM_W / TILE;
    const gap = options.gap ?? LEVEL_RULES.STAIR_STEP_GAP_X;
    const blocks = [];
    let x = startX;

    for (let step = 0; step < steps; step++) {
      const block = this.block(x, startLane + step, platformTiles);
      blocks.push(block);
      x += block.w + gap;
    }

    return { blocks, nextX: x };
  }

  cascade(startX, startLane, steps, options = {}) {
    const platformTiles = options.platformTiles ?? LEVEL_RULES.STAIR_PLATFORM_W / TILE;
    const gap = options.gap ?? LEVEL_RULES.STAIR_STEP_GAP_X;
    const blocks = [];
    let x = startX;

    for (let step = 0; step < steps; step++) {
      const block = this.block(x, startLane - step, platformTiles);
      blocks.push(block);
      x += block.w + gap;
    }

    return { blocks, nextX: x };
  }

  singleSpikeRhythm(startX, count, gapTiles, lane = 0) {
    let x = startX;

    for (let i = 0; i < count; i++) {
      this.spike(x, lane);
      x += gapTiles * TILE;
    }

    return { nextX: x };
  }

  finishPlatform(x, tilesWide = 4) {
    const block = this.block(x, 0, tilesWide);
    return { block, nextX: block.x + block.w };
  }

  build() {
    validateLevelData(this.objects);
    return {
      data: this.objects,
      length: calculateLevelLength(this.objects),
    };
  }
}
