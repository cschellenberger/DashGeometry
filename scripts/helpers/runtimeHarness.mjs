// Minimal DOM and canvas stand-ins for deterministic physics tests.
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

export const canvas = {
  getContext() {
    return ctx;
  },
  style: {},
};
