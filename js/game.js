import { COLLISION, GAMEPLAY, TILE, WORLD } from './config.js';
import { Player } from './player.js';
import { DEFAULT_LEVEL_ID, Level, LEVEL_DEFINITIONS } from './level.js';
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

function resolveLevelIndex(levelId) {
  const defaultIndex = LEVEL_DEFINITIONS.findIndex(d => d.id === DEFAULT_LEVEL_ID);
  const fallbackIndex = defaultIndex >= 0 ? defaultIndex : 0;

  if (levelId == null) return fallbackIndex;
  const idx = LEVEL_DEFINITIONS.findIndex(d => d.id === levelId);
  return idx >= 0 ? idx : fallbackIndex;
}

export class Game {
  constructor(canvas, { levelId } = {}) {
    this.renderer = new Renderer(canvas);
    this.input    = new InputHandler();
    this.levelIndex = resolveLevelIndex(levelId);
    this.player   = new Player();
    this.level    = new Level(this.levelIndex);
    this.state    = STATE.MENU;
    this.lastTime = 0;
    this.jumpBufferFrames = 0;
    this.portalCooldownFrames = 0;
    this.portalLockId = null;
    this._loop    = this._loop.bind(this);
  }

  start() {
    requestAnimationFrame(this._loop);
  }

  _loop(ts) {
    requestAnimationFrame(this._loop);
    const frameScale = this._frameScale(ts);
    const jumpStarted = this.input.consumeJumpStart();
    const levelSwitchRequested = this.input.consumeLevelSwitch();

    if (levelSwitchRequested && this.state !== STATE.PLAYING) {
      this._cycleLevel();
    }

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
    this.level  = new Level(this.levelIndex);
    this.state  = STATE.PLAYING;
    this.jumpBufferFrames = this.input.isJumpHeld() ? GAMEPLAY.JUMP_BUFFER_FRAMES : 0;
    this.portalCooldownFrames = 0;
    this.portalLockId = null;
    this.lastTime = 0;
  }

  _cycleLevel() {
    this.levelIndex = (this.levelIndex + 1) % LEVEL_DEFINITIONS.length;
    this.player = new Player();
    this.level = new Level(this.levelIndex);
    this.state = STATE.MENU;
    this.jumpBufferFrames = 0;
    this.portalCooldownFrames = 0;
    this.portalLockId = null;
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
    let overlappingPortalId = null;

    for (const o of obs) {
      const ox = o.x - this.level.cameraX;
      const ow = o.w ?? TILE;
      const oh = o.h ?? TILE;

      if (o.type === 'portal') {
        const triggerBox = {
          x: ox + COLLISION.PORTAL_TRIGGER_INSET_X,
          y: o.y + COLLISION.PORTAL_TRIGGER_INSET_Y,
          w: ow - COLLISION.PORTAL_TRIGGER_INSET_X * 2,
          h: oh - COLLISION.PORTAL_TRIGGER_INSET_Y * 2,
        };

        if (!aabb(this.player.x, this.player.y, this.player.w, this.player.h, triggerBox.x, triggerBox.y, triggerBox.w, triggerBox.h)) {
          continue;
        }

        overlappingPortalId = o.id;

        if (o.role === 'entrance' && this.portalCooldownFrames <= 0 && this.portalLockId !== o.id) {
          const destination = this.level.getPortalTarget(o.targetId);

          if (!destination) {
            throw new Error(`Portal "${o.id}" is missing destination "${o.targetId}".`);
          }

          this._teleportToPortal(destination);
          return;
        }

        continue;
      }

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

    if (overlappingPortalId === null) {
      this.portalLockId = null;
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
    this.portalCooldownFrames = Math.max(0, this.portalCooldownFrames - frameScale);
  }

  _teleportToPortal(destination) {
    this.level.cameraX = Math.max(0, destination.x - this.player.x + COLLISION.PORTAL_EXIT_OFFSET_X);
    this.player.placeAt(destination.y + destination.h - this.player.h);
    this.portalCooldownFrames = GAMEPLAY.PORTAL_COOLDOWN_FRAMES;
    this.portalLockId = destination.id;
  }

  _render() {
    const { renderer, player, level, state } = this;
    renderer.clear(level.theme);
    renderer.drawParallax(level.cameraX, level.theme);
    renderer.drawObstacles(level.getVisible(), level.cameraX, level.theme);
    if (state === STATE.PLAYING || state === STATE.DEAD) {
      renderer.drawPlayer(player, level.theme);
    }
    const pct = Math.min(100, (level.cameraX / level.length) * 100);
    if (state === STATE.PLAYING) renderer.drawUI(pct, level.name, level.theme);
    if (state === STATE.MENU)    renderer.drawMenu(level.name, level.theme);
    if (state === STATE.DEAD)    renderer.drawDead(pct, level.name, level.theme);
    if (state === STATE.WIN)     renderer.drawWin(level.name, level.theme);
  }
}
