import { DEFAULT_LEVEL_THEME, PLAYER_PHYSICS, WORLD } from '../config.js';
import { LevelBuilder } from '../levelBuilder.js';

export const CLOCKWORK_HEIGHTS_LEVEL_ID = 'clockwork-heights';
export const CLOCKWORK_SEED = 0xC10C2026;

// Seeded variation keeps retries learnable and authored routes reproducible.
function choices(seed) {
  let state = seed >>> 0;
  return values => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return values[(state >>> 16) % values.length];
  };
}

export function buildClockworkHeights(rules, seed = CLOCKWORK_SEED) {
  const level = new LevelBuilder();
  const pick = choices(seed);
  let x = 400;
  let lane = 0;

  function ledge(index, { hazard = true } = {}) {
    const platform = level.block(x, lane, pick([9, 10, 12, 14]));
    const hasSaw = hazard && index % 2 === 0;
    level.orb(x + 220, platform.y - 160, hasSaw ? 'gold' : 'cyan');
    if (hasSaw) {
      level.sawblade(x + 240, { surfaceY: platform.y, spin: index % 4 === 0 ? 1 : -1 });
    }
    x += platform.w + pick([32, 48, 64]);
    return platform;
  }

  for (let index = 0; index < 8; index++) {
    ledge(index);
    lane += pick([0, 1, 2, 2]);
  }

  // Highest approach so far. A six-tile (240px) rise beats the normal jump's
  // theoretical ~150px maximum, but fits comfortably inside the 2x boost.
  const launch = level.block(x, lane, 12);
  launch.id = 'clockwork-launch';
  level.orb(launch.x + 320, launch.y - 160, 'cyan');
  level.bouncePad(launch.x + launch.w - 80, { surfaceY: launch.y });
  x += launch.w + 32;
  lane += 6;
  const summit = level.block(x, lane, 10);
  summit.id = 'clockwork-summit';
  summit.requiresBounce = true;
  level.orb(summit.x + 32, summit.y - 60, 'pink');
  level.orb(summit.x + 220, summit.y - 160, 'pink');

  x += summit.w + 48;
  const ceilingLane = lane - 1;
  lane -= 2;
  let finalShelf;
  for (let index = 0; index < 8; index++) {
    finalShelf = ledge(index);
    lane = Math.max(1, Math.min(ceilingLane, lane + pick([-2, -1, 0, 1])));
  }

  // A supported portal returns the player to the ground for the final run.
  level.portalPair({
    idPrefix: 'clockwork-home',
    entranceX: finalShelf.x + finalShelf.w - 60,
    entranceSurfaceY: finalShelf.y,
    exitX: x + 400,
    exitSurfaceY: WORLD.GROUND_Y,
  });
  const finalSawX = x + 800;
  level.sawblade(finalSawX);
  level.orb(finalSawX - 20, WORLD.GROUND_Y - 160, 'gold');
  level.finishPlatform(finalSawX + 360, 8);

  return level.build({ rules });
}

export const CLOCKWORK_HEIGHTS = {
  id: CLOCKWORK_HEIGHTS_LEVEL_ID,
  name: 'Clockwork Heights',
  hint: 'Land on the green pad to reach the 2x ACCESS ledge.',
  speed: PLAYER_PHYSICS.SPEED_X,
  verticalCamera: true,
  theme: {
    ...DEFAULT_LEVEL_THEME,
    background: '#211827', ground: '#342739',
    parallaxSlow: '#32243c', parallaxFast: '#402e45',
    block: '#584352', blockEdge: '#c09175',
    player: '#ffe5ad', playerEdge: '#e5a148',
    portalAEntrance: '#af9dff', portalAExit: '#48dbff',
    portalGlow: 'rgba(175, 157, 255, 0.24)',
    ui: '#fff1e4', muted: '#cfb5c3', success: '#63ff8c', danger: '#ff956c',
  },
  build: buildClockworkHeights,
};
