import { DEFAULT_LEVEL_THEME, PLAYER_PHYSICS, TILE, WORLD } from '../config.js';
import { LevelBuilder } from '../levelBuilder.js';

export const SKYWARD_TERRACES_LEVEL_ID = 'skyward-terraces';

function buildSkywardTerraces(rules) {
  const level = new LevelBuilder();

  // Long terraces give room to settle after each climb, then jump for rewards.
  const terrace = (x, lane, { tiles = 12, bounce = false, spike = false } = {}) => {
    const platform = level.block(x, lane, tiles);
    if (bounce) {
      level.bouncePad(x + 240, { surfaceY: platform.y });
      level.orb(x + 180, platform.y - 160, 'cyan');
      level.orb(x + 340, platform.y - 320, 'pink');
    } else {
      level.orb(x + 220, platform.y - 160, spike ? 'gold' : 'cyan');
      if (spike) level.spikeOnBlock(platform, 6);
    }
    return platform;
  };

  // First climb, then a gentler descent to the first portal.
  terrace(400, 0, { bounce: true });
  terrace(920, 1, { spike: true });
  terrace(1440, 2);
  terrace(1960, 1, { spike: true });
  const entryShelf = terrace(2480, 0);

  // Jump over the entrance to take the stepping-stone route instead.
  // No orbs in the teleport gap, so taking the portal can preserve a streak.
  level.block(3000, 1, 7);
  const upperShelf = terrace(3320, 3, { tiles: 15, bounce: true });
  level.portalPair({
    idPrefix: 'terraces-rise',
    height: TILE * 2,
    entranceX: 2840, entranceSurfaceY: entryShelf.y,
    exitX: 3360, exitSurfaceY: upperShelf.y,
  });

  terrace(3960, 2);
  terrace(4480, 1, { spike: true });
  terrace(5000, 0);
  const returnShelf = terrace(5520, 1);
  level.block(6040, 0, 6);
  level.portalPair({
    idPrefix: 'terraces-return',
    height: TILE * 2,
    entranceX: 5880, entranceSurfaceY: returnShelf.y,
    entranceThemeKey: 'portalBEntrance',
    exitX: 6440, exitSurfaceY: WORLD.GROUND_Y,
    exitThemeKey: 'portalBExit',
  });

  // Final four-stage climb and broad descending platforms.
  terrace(6800, 0);
  terrace(7320, 1);
  terrace(7840, 2, { bounce: true });
  terrace(8360, 3);
  terrace(8880, 2);
  terrace(9400, 1, { spike: true });
  terrace(9920, 0);
  terrace(10440, 0);

  return level.build({ rules });
}

export const SKYWARD_TERRACES = {
  id: SKYWARD_TERRACES_LEVEL_ID,
  name: 'Skyward Terraces',
  hint: 'Take portals, or jump over them to explore more platforms.',
  speed: PLAYER_PHYSICS.SPEED_X,
  theme: {
    ...DEFAULT_LEVEL_THEME,
    background: '#0c182b',
    parallaxSlow: '#142e43',
    parallaxFast: '#173c50',
    ground: '#142c3c',
    block: '#24516b',
    blockEdge: '#69b5cc',
    player: '#fff0b0',
    playerEdge: '#e7b65b',
    portalAEntrance: '#48dbff', portalAExit: '#a791ff',
    portalBEntrance: '#ffa95a', portalBExit: '#ff73d1',
    portalGlow: 'rgba(130, 190, 255, 0.22)',
    ui: '#edf8ff', muted: '#a5c6d6', success: '#63ff8c', danger: '#ff856e',
  },
  build: buildSkywardTerraces,
};
