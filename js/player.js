export const TILE = 40;
export const GRAVITY = 0.65;
const JUMP_FORCE = -12.5;

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 120;
    this.y = 560 - TILE;
    this.w = TILE - 2;
    this.h = TILE - 2;
    this.vy = 0;
    this.isGrounded = false;
    this.angle = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = JUMP_FORCE;
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
