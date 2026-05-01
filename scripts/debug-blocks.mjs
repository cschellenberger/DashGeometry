import { LEVELS } from '../js/level.js';

const l2 = LEVELS[1];
const blocks = l2.data.filter(o => o.type === 'block').sort((a, b) => a.x - b.x);
const TILE = 40, GROUND_Y = 560;

console.log('Ember Ascent blocks:');
for (const b of blocks) {
  const lane = Math.round((GROUND_Y - b.y) / TILE) - 1;
  console.log(`  lane+${lane}  x=${b.x}  end=${b.x + b.w}  w=${b.w}`);
}
