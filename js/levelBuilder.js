import { BOUNCE_PAD, TILE, WORLD } from './config.js';
import { calculateLevelLength, laneY, LEVEL_RULES, validateLevelData } from './levelRules.js';
import { ORB_SIZE } from './scoring.js';
import { createPortal, createPortalPair } from './portal.js';

export class LevelBuilder {
  constructor() {
    this.objects = [
      { type: 'ground', x: -200, y: WORLD.GROUND_Y, w: 99999, h: WORLD.GROUND_H },
    ];
    this.portalCount = 0;
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

  bouncePad(x, options = {}) {
    const pad = {
      type: 'bouncePad',
      x,
      y: options.surfaceY ?? WORLD.GROUND_Y,
      w: options.width ?? BOUNCE_PAD.WIDTH,
      heightMultiplier: options.heightMultiplier ?? BOUNCE_PAD.HEIGHT_MULTIPLIER,
    };
    this.objects.push(pad);
    return pad;
  }

  orb(x, y, kind = 'cyan') {
    const orb = { type: 'orb', x, y, w: ORB_SIZE, h: ORB_SIZE, kind };
    this.objects.push(orb);
    return orb;
  }

  spikeOnBlock(block, offsetTiles = 1) {
    const x = block.x + offsetTiles * TILE;
    const lane = laneFromBlockY(block.y) + 1;
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

  portal(x, supportLane = 0, role = 'entrance', options = {}) {
    const serial = ++this.portalCount;
    const portal = createPortal({
      x, role,
      surfaceY: options.surfaceY ?? (supportLane === 0 ? WORLD.GROUND_Y : laneY(supportLane)),
      id: options.id ?? `portal-${serial}`,
      pairId: options.pairId ?? null,
      targetId: options.targetId,
      themeKey: options.themeKey,
      height: options.height,
    });
    this.objects.push(portal);
    return portal;
  }

  portalPair(options) {
    const serial = ++this.portalCount;
    const { entranceLane = 0, exitLane = 0 } = options;
    const pair = createPortalPair({
      ...options,
      idPrefix: options.idPrefix ?? `portal-pair-${serial}`,
      entranceSurfaceY: options.entranceSurfaceY ?? (entranceLane === 0 ? WORLD.GROUND_Y : laneY(entranceLane)),
      exitSurfaceY: options.exitSurfaceY ?? (exitLane === 0 ? WORLD.GROUND_Y : laneY(exitLane)),
    });
    this.objects.push(pair.entrance, pair.exit);
    return pair;
  }

  build(options = {}) {
    this.objects.filter(o => o.type === 'orb').sort((a, b) => a.x - b.x)
      .forEach((orb, index) => { orb.sequence = index + 1; });
    validateLevelData(this.objects, options.rules);
    return {
      data: this.objects,
      length: calculateLevelLength(this.objects),
    };
  }
}

function laneFromBlockY(y) {
  return Math.round((WORLD.GROUND_Y - y) / TILE) - 1;
}
