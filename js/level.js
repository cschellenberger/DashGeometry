import { DEFAULT_LEVEL_THEME, EMBER_ASCENT_THEME, PLAYER_PHYSICS, TILE } from './config.js';
import { LevelBuilder } from './levelBuilder.js';
import { createLevelRules, LEVEL_RULES } from './levelRules.js';

export { LEVEL_RULES };

export const DEFAULT_LEVEL_ID = 'level-1';
export const EMBER_ASCENT_LEVEL_ID = 'ember-ascent';

const LEVEL_ONE_THEME = {
  ...DEFAULT_LEVEL_THEME,
  parallaxFar: DEFAULT_LEVEL_THEME.parallaxSlow,
  parallaxNear: DEFAULT_LEVEL_THEME.parallaxFast,
  portalEntry: DEFAULT_LEVEL_THEME.portalAEntrance,
  portalExit: DEFAULT_LEVEL_THEME.portalAExit,
  portalGlow: 'rgba(77, 238, 234, 0.26)',
  ui: DEFAULT_LEVEL_THEME.uiText,
  muted: '#95a5a6',
  success: '#2ecc71',
  danger: '#e74c3c',
};

const EMBER_THEME = {
  ...EMBER_ASCENT_THEME,
  parallaxFar: EMBER_ASCENT_THEME.parallaxSlow,
  parallaxNear: EMBER_ASCENT_THEME.parallaxFast,
  portalEntry: EMBER_ASCENT_THEME.portalAEntrance,
  portalExit: EMBER_ASCENT_THEME.portalAExit,
  portalGlow: 'rgba(255, 179, 0, 0.24)',
  ui: EMBER_ASCENT_THEME.uiText,
  muted: '#d7a58b',
  success: '#ffb300',
  danger: EMBER_ASCENT_THEME.spike,
};

// Each entry: { type: 'ground'|'block'|'spike'|'portal', x, y, w?, h? }
function createLevelOne(rules) {
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

  return level.build({ rules });
}

function createEmberAscent(rules) {
  const level = new LevelBuilder();

  // Section 1: warm-up.
  level.spike(TILE * 4, 0);
  level.spike(TILE * 11, 0);
  level.spike(TILE * 18, 0);

  // Section 2: platform introduction.
  const platformA = level.block(TILE * 23, 1, 6);
  level.spikeOnBlock(platformA, 2);
  level.spike(TILE * 32, 0);
  const platformB = level.block(TILE * 38, 1, 4);
  level.spikeOnBlock(platformB, 2);

  // Section 3: Portal A, ground to elevated shelf.
  level.spike(TILE * 43, 0);
  level.portalPair({
    idPrefix: 'ember-a',
    entranceX: TILE * 48,
    entranceLane: 0,
    entranceThemeKey: 'portalAEntrance',
    exitX: TILE * 56,
    exitLane: 2,
    exitThemeKey: 'portalAExit',
  });
  level.block(TILE * 56, 2, 6);

  // Section 4: elevated rhythm after the portal shelf.
  level.spike(TILE * 63, 0);
  level.spike(TILE * 69, 0);
  const platformC = level.block(TILE * 73, 1, 5);
  level.spikeOnBlock(platformC, 2);
  level.spike(TILE * 82, 0);

  // Section 5: staircase climb.
  const stepOne = level.block(TILE * 85, 1, 8);
  level.spikeOnBlock(stepOne, 3);
  const stepTwo = level.block(TILE * 93, 2, 8);
  level.spikeOnBlock(stepTwo, 3);
  level.block(TILE * 103, 3, 8);

  // Section 6: cascade descent.
  const descentA = level.block(TILE * 113, 2, 7);
  level.spikeOnBlock(descentA, 3);
  const descentB = level.block(TILE * 122, 1, 7);
  level.spikeOnBlock(descentB, 3);
  level.spike(TILE * 131, 0);

  // Section 7: Portal B, elevated to ground.
  level.block(TILE * 135, 1, 5);
  level.portalPair({
    idPrefix: 'ember-b',
    entranceX: TILE * 139,
    entranceLane: 1,
    entranceThemeKey: 'portalBEntrance',
    exitX: TILE * 146,
    exitLane: 0,
    exitThemeKey: 'portalBExit',
  });

  // Section 8: final run.
  level.spike(TILE * 153, 0);
  level.spike(TILE * 159, 0);
  level.finishPlatform(TILE * 164, 4);

  return level.build({ rules });
}

function createLevelDefinition({ id, name, speed, theme, rules, build }) {
  const resolvedRules = createLevelRules({ ...rules, speedX: speed });
  const built = build(resolvedRules);

  return {
    id,
    name,
    speed,
    theme,
    data: built.data,
    length: built.length,
    rules: resolvedRules,
  };
}

export const LEVELS = [
  createLevelDefinition({
    id: DEFAULT_LEVEL_ID,
    name: 'DashGeometry',
    speed: PLAYER_PHYSICS.SPEED_X,
    theme: LEVEL_ONE_THEME,
    rules: {
      minSpikeGapX: LEVEL_RULES.MIN_SPIKE_GAP_X,
      portalExitClearanceTiles: LEVEL_RULES.PORTAL_EXIT_CLEARANCE_TILES,
    },
    build: createLevelOne,
  }),
  createLevelDefinition({
    id: EMBER_ASCENT_LEVEL_ID,
    name: 'Ember Ascent',
    speed: PLAYER_PHYSICS.SPEED_X_LEVEL2,
    theme: EMBER_THEME,
    rules: {
      minSpikeGapX: TILE * 5,
      portalExitClearanceTiles: 6,
    },
    build: createEmberAscent,
  }),
];

export const LEVEL_DEFINITIONS = LEVELS;

const defaultLevel = getLevelDefinition(DEFAULT_LEVEL_ID);

export const LEVEL_DATA = defaultLevel.data;
export const LEVEL_LENGTH = defaultLevel.length;

export function getLevelDefinition(levelId = DEFAULT_LEVEL_ID) {
  if (typeof levelId === 'number') {
    return LEVELS[normalizeLevelIndex(levelId)] ?? LEVELS[0];
  }

  return LEVELS.find(level => level.id === levelId) ?? LEVELS.find(level => level.id === DEFAULT_LEVEL_ID);
}

export class Level {
  constructor(levelId = DEFAULT_LEVEL_ID) {
    this.definition = getLevelDefinition(levelId);
    this.id = this.definition.id;
    this.name = this.definition.name;
    this.speed = this.definition.speed;
    this.theme = this.definition.theme;
    this.data = this.definition.data;
    this.length = this.definition.length;
    this.rules = this.definition.rules;
    this.cameraX = 0;
    this.portalsById = new Map(
      this.data
        .filter(object => object.type === 'portal')
        .map(object => [object.id, object])
    );
  }

  getVisible() {
    return this.data.filter(o =>
      (o.x + (o.w || TILE)) >= this.cameraX - 100 &&
      o.x <= this.cameraX + 900
    );
  }

  getPortalTarget(targetId) {
    return this.portalsById.get(targetId) ?? null;
  }

  update(frameScale = 1) {
    this.cameraX += this.speed * frameScale;
  }

  get complete() {
    return this.cameraX >= this.length;
  }
}

function normalizeLevelIndex(levelIndex) {
  const levelCount = LEVELS.length;
  return ((levelIndex % levelCount) + levelCount) % levelCount;
}
