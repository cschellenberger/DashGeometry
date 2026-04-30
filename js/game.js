import { Player, TILE, GRAVITY } from './player.js';
import { Level, LEVEL_LENGTH } from './level.js';
import { Renderer } from './renderer.js';
import InputHandler from './input.js';

const STATE = { MENU: 'menu', PLAYING: 'playing', DEAD: 'dead', WIN: 'win' };
const GROUND_Y = 560;

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input    = new InputHandler();
    this.player   = new Player();
    this.level    = new Level();
    this.state    = STATE.MENU;
    this.lastTime = 0;
    this._loop    = this._loop.bind(this);
  }

  start() {
    requestAnimationFrame(this._loop);
  }

  _loop(ts) {
    requestAnimationFrame(this._loop);

    if (this.input.consumeJump()) {
      if (this.state === STATE.MENU || this.state === STATE.DEAD || this.state === STATE.WIN) {
        this._restart();
      } else if (this.state === STATE.PLAYING) {
        this.player.jump();
      }
    }

    if (this.state === STATE.PLAYING) {
      this._update();
    }

    this._render();
  }

  _restart() {
    this.player = new Player();
    this.level  = new Level();
    this.state  = STATE.PLAYING;
  }

  _update() {
    this.level.update();
    this.player.update();

    const obs = this.level.getVisible();
    this.player.isGrounded = false;

    for (const o of obs) {
      const ox = o.x - this.level.cameraX;
      const ow = o.w ?? TILE;
      const oh = o.h ?? TILE;

      if (o.type === 'spike') {
        // Use a forgiving spike box so the rear edge does not punish clean clears.
        const margin = 8;
        const spikeInsetFront = 8;
        const spikeInsetBack = 14;
        const spikeInsetTop = 8;
        if (aabb(
          this.player.x + margin, this.player.y + margin,
          this.player.w - margin * 2, this.player.h - margin * 2,
          ox + spikeInsetFront, o.y + spikeInsetTop,
          TILE - spikeInsetFront - spikeInsetBack, TILE - spikeInsetTop
        )) {
          this.state = STATE.DEAD;
          return;
        }
        continue;
      }

      // ground / block — AABB
      if (!aabb(this.player.x, this.player.y, this.player.w, this.player.h, ox, o.y, ow, oh)) continue;

      const playerPrevBottom = this.player.y + this.player.h - this.player.vy;
      const landingFromTop   = playerPrevBottom <= o.y + 2 && this.player.vy >= 0;

      if (landingFromTop) {
        this.player.y  = o.y - this.player.h;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.angle = Math.round(this.player.angle / 90) * 90;
      } else {
        // side or bottom collision = death
        this.state = STATE.DEAD;
        return;
      }
    }

    // Fell off bottom
    if (this.player.y > 650) {
      this.state = STATE.DEAD;
      return;
    }

    if (this.level.complete) {
      this.state = STATE.WIN;
    }
  }

  _render() {
    const { renderer, player, level, state } = this;
    renderer.clear();
    renderer.drawParallax(level.cameraX);
    renderer.drawObstacles(level.getVisible(), level.cameraX);
    if (state === STATE.PLAYING || state === STATE.DEAD) {
      renderer.drawPlayer(player);
    }
    const pct = Math.min(100, (level.cameraX / LEVEL_LENGTH) * 100);
    if (state === STATE.PLAYING) renderer.drawUI(pct, state);
    if (state === STATE.MENU)    renderer.drawMenu();
    if (state === STATE.DEAD)    renderer.drawDead(pct);
    if (state === STATE.WIN)     renderer.drawWin();
  }
}
