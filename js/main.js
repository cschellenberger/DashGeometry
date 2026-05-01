import { Game } from './game.js';

const LEVEL_ALIASES = new Map([
  ['violet-bridge', 'ember-ascent'],
  ['jermonji-violet-bridge', 'ember-ascent'],
]);

const canvas = document.getElementById('gameCanvas');

if (!(canvas instanceof HTMLCanvasElement)) {
  console.error('DashGeometry could not start because #gameCanvas is missing.');
  document.body.textContent = 'DashGeometry could not start because the game canvas is missing.';
} else {
  const levelId = getInitialLevelId();
  const game = new Game(canvas, { levelId });
  game.start();
}

function getInitialLevelId() {
  const requestedLevelId = new URLSearchParams(window.location.search).get('level');
  return normalizeLevelId(requestedLevelId);
}

function normalizeLevelId(levelId) {
  const normalized = levelId?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return LEVEL_ALIASES.get(normalized) ?? normalized;
}
