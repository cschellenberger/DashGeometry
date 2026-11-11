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
    this.prevY = this.y;
    this.w = TILE - 2;
    this.h = TILE - 2;
    this.vy = 0;
    this.isGrounded = false;
    this.hasJumped = false;
    this.angle = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.launch();
      return true;
    }

    return false;
  }

  launch(heightMultiplier = 1) {
    // Height = velocity squared / (2 * gravity). Doubling velocity would
    // quadruple height; scale by the square root of the desired height instead.
    this.vy = PLAYER_PHYSICS.JUMP_FORCE * Math.sqrt(heightMultiplier);
    this.isGrounded = false;
    this.hasJumped = true;
  }

  placeAt(y) {
    this.y = y;
    this.prevY = y;
    this.vy = 0;
    this.isGrounded = true;
    this.hasJumped = false;
    this.angle = Math.round(this.angle / 90) * 90;
  }

  update(frameScale = 1) {
    this.prevY = this.y;
    this.vy += GRAVITY * frameScale;
    this.y += this.vy * frameScale;
    this.angle += this.isGrounded ? 0 : PLAYER_PHYSICS.ROTATION_SPEED * frameScale;
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
  get prevBottom() { return this.prevY + this.h; }
}
