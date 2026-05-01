globalThis.window = {
  innerWidth: 800,
  innerHeight: 600,
  addEventListener() {},
};

globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
};

const noop = () => {};
const ctx = {
  fillRect: noop,
  strokeRect: noop,
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  closePath: noop,
  fill: noop,
  stroke: noop,
  ellipse: noop,
  save: noop,
  restore: noop,
  translate: noop,
  rotate: noop,
  fillText: noop,
};

const canvas = {
  getContext() {
    return ctx;
  },
  style: {},
};

const { Game } = await import('../js/game.js');

const game = new Game(canvas, { levelId: 'ember-ascent' });
if (game.level.id !== 'ember-ascent') {
  throw new Error(`Expected ember-ascent, got ${game.level.id}.`);
}

const entrance = game.level.data.find(o => o.type === 'portal' && o.role === 'entrance');
if (!entrance) {
  throw new Error('No portal entrance found.');
}

const exit = game.level.getPortalTarget(entrance.targetId);
if (!exit) {
  throw new Error(`No portal exit found for ${entrance.id}.`);
}

game.state = 'playing';
game.level.cameraX = entrance.x - game.player.x;
game.player.y = entrance.y + 10;
game.player.prevY = game.player.y;
game.player.vy = 0;

const cameraBefore = game.level.cameraX;
game._update(1);

if (game.portalLockId !== exit.id) {
  throw new Error(`Expected portal lock ${exit.id}, got ${game.portalLockId}.`);
}

if (game.level.cameraX <= cameraBefore) {
  throw new Error('Portal teleport did not advance the camera.');
}

console.log('Runtime portal smoke passed.');
