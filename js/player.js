import { PLAYER_PHYSICS, TILE, WORLD } from './config.js';

export { TILE };
export const GRAVITY = PLAYER_PHYSICS.GRAVITY;

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 120;
    this.y = WORLD.GROUND_Y - TILE;
    this.w = TILE - 2;
    this.h = TILE - 2;
    this.vy = 0;
    this.isGrounded = false;
    this.angle = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = PLAYER_PHYSICS.JUMP_FORCE;
      this.isGrounded = false;
    }
  }

  update() {
    this.vy += GRAVITY;
    this.y += this.vy;
    this.angle += this.isGrounded ? 0 : 4;
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
}
