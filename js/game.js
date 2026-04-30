import { COLLISION, GAMEPLAY, TILE, WORLD } from './config.js';
import { Player } from './player.js';
import { Level, LEVEL_LENGTH } from './level.js';
import { Renderer } from './renderer.js';
import InputHandler from './input.js';

const STATE = { MENU: 'menu', PLAYING: 'playing', DEAD: 'dead', WIN: 'win' };

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function sign(p1, p2, p3) {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

function pointInTriangle(point, a, b, c) {
  const d1 = sign(point, a, b);
  const d2 = sign(point, b, c);
  const d3 = sign(point, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function lineIntersectsLine(a, b, c, d) {
  const denominator = (d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y);
  if (denominator === 0) return false;

  const ua = ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / denominator;
  const ub = ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) / denominator;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function rectIntersectsTriangle(rect, triangle) {
  const rectPoints = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
  const rectEdges = rectPoints.map((point, i) => [point, rectPoints[(i + 1) % rectPoints.length]]);
  const triangleEdges = triangle.map((point, i) => [point, triangle[(i + 1) % triangle.length]]);

  return (
    rectPoints.some(point => pointInTriangle(point, ...triangle)) ||
    triangle.some(point => aabb(point.x, point.y, 1, 1, rect.x, rect.y, rect.w, rect.h)) ||
    rectEdges.some(([a, b]) => triangleEdges.some(([c, d]) => lineIntersectsLine(a, b, c, d)))
  );
}

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input    = new InputHandler();
    this.player   = new Player();
    this.level    = new Level();
    this.state    = STATE.MENU;
    this.lastTime = 0;
    this.jumpBufferFrames = 0;
    this._loop    = this._loop.bind(this);
  }

  start() {
    requestAnimationFrame(this._loop);
  }

  _loop(ts) {
    requestAnimationFrame(this._loop);
    const frameScale = this._frameScale(ts);
    const jumpStarted = this.input.consumeJumpStart();

    if (jumpStarted) {
      if (this.state === STATE.MENU || this.state === STATE.DEAD || this.state === STATE.WIN) {
        this._restart();
      } else {
        this._queueJump();
      }
    }

    if (this.state === STATE.PLAYING) {
      this._update(frameScale);
    }

    this._render();
  }

  _frameScale(ts) {
    if (!this.lastTime) {
      this.lastTime = ts;
      return 1;
    }

    const elapsed = ts - this.lastTime;
    this.lastTime = ts;
    return Math.min(GAMEPLAY.MAX_FRAME_SCALE, Math.max(0, elapsed / GAMEPLAY.TARGET_FRAME_MS));
  }

  _queueJump() {
    this.jumpBufferFrames = GAMEPLAY.JUMP_BUFFER_FRAMES;
  }

  _restart() {
    this.player = new Player();
    this.level  = new Level();
    this.state  = STATE.PLAYING;
    this.jumpBufferFrames = this.input.isJumpHeld() ? GAMEPLAY.JUMP_BUFFER_FRAMES : 0;
    this.lastTime = 0;
  }

  _update(frameScale) {
    if (this.input.isJumpHeld()) {
      this._queueJump();
    }

    if (this.jumpBufferFrames > 0 && this.player.jump()) {
      this.jumpBufferFrames = 0;
    }

    this.level.update(frameScale);
    this.player.update(frameScale);

    const obs = this.level.getVisible();
    this.player.isGrounded = false;

    for (const o of obs) {
      const ox = o.x - this.level.cameraX;
      const ow = o.w ?? TILE;
      const oh = o.h ?? TILE;

      if (o.type === 'spike') {
        const playerBox = {
          x: this.player.x + COLLISION.PLAYER_MARGIN,
          y: this.player.y + COLLISION.PLAYER_MARGIN,
          w: this.player.w - COLLISION.PLAYER_MARGIN * 2,
          h: this.player.h - COLLISION.PLAYER_MARGIN * 2,
        };
        const spikeTriangle = [
          { x: ox + COLLISION.SPIKE_INSET_FRONT, y: o.y + TILE },
          { x: ox + TILE / 2, y: o.y + COLLISION.SPIKE_INSET_TOP },
          { x: ox + TILE - COLLISION.SPIKE_INSET_BACK, y: o.y + TILE },
        ];

        if (rectIntersectsTriangle(playerBox, spikeTriangle)) {
          this.state = STATE.DEAD;
          return;
        }
        continue;
      }

      // ground / block — AABB
      if (!aabb(this.player.x, this.player.y, this.player.w, this.player.h, ox, o.y, ow, oh)) continue;

      const playerPrevBottom = this.player.prevBottom;
      const landingFromTop   = playerPrevBottom <= o.y + COLLISION.LANDING_TOLERANCE && this.player.vy >= 0;

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
    if (this.player.y > WORLD.FALL_DEATH_Y) {
      this.state = STATE.DEAD;
      return;
    }

    if (this.level.complete) {
      this.state = STATE.WIN;
    }

    this.jumpBufferFrames = Math.max(0, this.jumpBufferFrames - frameScale);
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
