export const TILE = 40;

export const WORLD = {
  GROUND_Y: 560,
  GROUND_H: 40,
  FALL_DEATH_Y: 650,
};

export const PLAYER_PHYSICS = {
  GRAVITY: 0.58,
  JUMP_FORCE: -13.2,
  SPEED_X: 3.2,
  SPEED_X_LEVEL2: 3.6,
  ROTATION_SPEED: 4,
};

export const COLLISION = {
  PLAYER_MARGIN: 8,
  SPIKE_INSET_FRONT: 8,
  SPIKE_INSET_BACK: 14,
  SPIKE_INSET_TOP: 8,
  LANDING_TOLERANCE: 2,
  PORTAL_TRIGGER_INSET_X: 6,
  PORTAL_TRIGGER_INSET_Y: 6,
  PORTAL_EXIT_OFFSET_X: Math.round(TILE * 0.7),
};

export const GAMEPLAY = {
  TARGET_FRAME_MS: 1000 / 60,
  MAX_FRAME_SCALE: 2,
  JUMP_BUFFER_FRAMES: 6,
  PORTAL_COOLDOWN_FRAMES: 16,
};

export const DEFAULT_LEVEL_THEME = {
  background: '#1a1a2e',
  parallaxSlow: '#16213e',
  parallaxFast: '#0f2340',
  ground: '#16213e',
  block: '#0f3460',
  blockEdge: '#1a5276',
  spike: '#e74c3c',
  spikeEdge: '#c0392b',
  player: '#f1c40f',
  playerEdge: '#f39c12',
  portalAEntrance: '#4deeea',
  portalAExit: '#9b5de5',
  portalBEntrance: '#4deeea',
  portalBExit: '#9b5de5',
  uiText: '#ecf0f1',
  overlay: 'rgba(0,0,0,0.65)',
};

export const EMBER_ASCENT_THEME = {
  background: '#1a0a00',
  parallaxSlow: '#2d0f00',
  parallaxFast: '#1f0800',
  ground: '#1c1008',
  block: '#3b1f0a',
  blockEdge: '#6b3a15',
  spike: '#ff6b35',
  spikeEdge: '#cc4a15',
  player: '#00e5ff',
  playerEdge: '#00b8cc',
  portalAEntrance: '#ffb300',
  portalAExit: '#00e5ff',
  portalBEntrance: '#9c27b0',
  portalBExit: '#ff8f00',
  uiText: '#fbe9e7',
  overlay: 'rgba(0,0,0,0.65)',
};
