import { EMBER_ASCENT_LEVEL_ID, getLevelDefinition } from '../js/level.js';
import { COLLISION, TILE, WORLD } from '../js/config.js';

const level2 = getLevelDefinition(EMBER_ASCENT_LEVEL_ID);
const portals = level2.data.filter(o => o.type === 'portal');
const entrances = portals.filter(p => p.role === 'entrance');
const exits = portals.filter(p => p.role === 'exit');

const PLAYER_X_SCREEN = 120;
const PLAYER_H = TILE - 2;

let ok = true;

console.log(`=== Portal Smoke Test: ${level2.name} (speed ${level2.speed}) ===`);
console.log(`${entrances.length} portal entrances, ${exits.length} exits\n`);

for (const entrance of entrances) {
  const dest = exits.find(e => e.id === entrance.targetId);
  if (!dest) {
    console.error(`No exit found for ${entrance.id}`);
    ok = false;
    continue;
  }

  const cameraXBefore = entrance.x - PLAYER_X_SCREEN;
  const newCameraX = Math.max(0, dest.x - PLAYER_X_SCREEN + COLLISION.PORTAL_EXIT_OFFSET_X);
  const newPlayerY = dest.y + dest.h - PLAYER_H;
  const surfaceY = dest.y + dest.h;

  console.log(`${entrance.id} -> ${dest.id}`);
  console.log(`  Entrance world x=${entrance.x}  Exit world x=${dest.x}`);
  console.log(`  Camera: ${cameraXBefore} -> ${newCameraX}  (advance +${newCameraX - cameraXBefore}px)`);
  console.log(`  Player Y after teleport: ${newPlayerY}  (surface at y=${surfaceY})`);

  if (newCameraX <= cameraXBefore) {
    console.error('  FAIL: camera did not advance'); ok = false;
  }
  if (surfaceY === WORLD.GROUND_Y) {
    console.log('  Lands on: ground');
  } else {
    console.log(`  Lands on: elevated block at y=${surfaceY}`);
  }
  console.log();
}

if (ok) {
  console.log('All portal teleports look correct.');
} else {
  console.error('One or more checks failed.');
  process.exitCode = 1;
}
