import { DEFAULT_LEVEL_ID, LEVEL_DATA, LEVEL_LENGTH, LEVEL_RULES, LEVELS, getLevelDefinition } from '../js/level.js';
import { TILE } from '../js/config.js';
import { calculateLevelLength, validateLevelData } from '../js/levelRules.js';

try {
  for (const level of LEVELS) {
    validateLevelData(level.data, level.rules);

    const expectedLength = calculateLevelLength(level.data);
    if (level.length !== expectedLength) {
      throw new Error(`${level.id} length is ${level.length}, expected ${expectedLength}.`);
    }

    const blocks = level.data.filter(o => o.type === 'block').length;
    const spikes = level.data.filter(o => o.type === 'spike').length;
    const portals = level.data.filter(o => o.type === 'portal').length;
    const entrances = level.data.filter(o => o.type === 'portal' && o.role === 'entrance').length;
    const exits = level.data.filter(o => o.type === 'portal' && o.role === 'exit').length;
    const tiles = Math.ceil(level.length / TILE);

    console.log(`${level.name} (${level.id}) validated.`);
    console.log(`Objects: ${level.data.length} total, ${blocks} blocks, ${spikes} spikes, ${portals} portals (${entrances} entrances, ${exits} exits).`);
    console.log(`Length: ${level.length}px (${tiles} tiles).`);
    console.log(`Speed: ${level.speed}px/frame. Min spike gap: ${level.rules.minSpikeGapX}px.`);
  }

  const defaultLevel = getLevelDefinition(DEFAULT_LEVEL_ID);
  const expectedDefaultLength = calculateLevelLength(LEVEL_DATA);
  if (LEVEL_LENGTH !== expectedDefaultLength) {
    throw new Error(`LEVEL_LENGTH is ${LEVEL_LENGTH}, expected ${expectedDefaultLength}.`);
  }

  if (LEVEL_DATA !== defaultLevel.data || LEVEL_LENGTH !== defaultLevel.length) {
    throw new Error('Compatibility exports do not point at the default level.');
  }

  console.log('Level validation passed.');
  console.log(`Minimum same-lane spike gap: ${LEVEL_RULES.MIN_SPIKE_GAP_X}px.`);
} catch (error) {
  console.error('Level validation failed.');
  console.error(error.message);
  process.exitCode = 1;
}
