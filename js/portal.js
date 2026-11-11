import { COLLISION, GAMEPLAY, TILE, WORLD } from './config.js';

export function createPortal({ x, surfaceY, role = 'entrance', id, pairId, targetId, themeKey = null, height = TILE * 3 }) {
  return {
    type: 'portal', id, pairId, role, x,
    y: surfaceY - height, w: TILE, h: height, themeKey,
    ...(targetId ? { targetId } : {}),
  };
}

export function createPortalPair({ idPrefix, entranceX, entranceSurfaceY, exitX, exitSurfaceY,
  entranceThemeKey = 'portalAEntrance', exitThemeKey = 'portalAExit', height = TILE * 3 }) {
  const entranceId = `${idPrefix}-entrance`;
  const exitId = `${idPrefix}-exit`;
  return {
    entrance: createPortal({ x: entranceX, surfaceY: entranceSurfaceY, role: 'entrance',
      id: entranceId, pairId: idPrefix, targetId: exitId, themeKey: entranceThemeKey, height }),
    exit: createPortal({ x: exitX, surfaceY: exitSurfaceY, role: 'exit',
      id: exitId, pairId: idPrefix, themeKey: exitThemeKey, height }),
  };
}

function overlapsTrigger(player, cameraX, portal) {
  const left = portal.x - cameraX + COLLISION.PORTAL_TRIGGER_INSET_X;
  const top = portal.y + COLLISION.PORTAL_TRIGGER_INSET_Y;
  const right = portal.x - cameraX + portal.w - COLLISION.PORTAL_TRIGGER_INSET_X;
  const bottom = portal.y + portal.h - COLLISION.PORTAL_TRIGGER_INSET_Y;
  return player.left < right && player.right > left && player.top < bottom && player.bottom > top;
}

export class PortalSystem {
  constructor(portals = []) {
    this.byId = new Map(portals.map(portal => [portal.id, portal]));
    this.reset();
  }

  reset() {
    this.cooldownFrames = 0;
    this.lockId = null;
  }

  getTarget(id) { return this.byId.get(id) ?? null; }

  beginFrame(frameScale, player, cameraX) {
    this.cooldownFrames = Math.max(0, this.cooldownFrames - frameScale);
    const lockedPortal = this.getTarget(this.lockId);
    if (!lockedPortal || !overlapsTrigger(player, cameraX, lockedPortal)) this.lockId = null;
  }

  destinationFor(portal, player, cameraX) {
    if (portal.role !== 'entrance' || this.cooldownFrames > 0 || this.lockId === portal.id ||
        !overlapsTrigger(player, cameraX, portal)) return null;
    const destination = this.getTarget(portal.targetId);
    if (!destination || destination.role !== 'exit' || destination.pairId !== portal.pairId) {
      throw new Error(`Portal "${portal.id}" is missing a matching exit "${portal.targetId}".`);
    }
    return destination;
  }

  teleport(player, level, destination) {
    level.cameraX = Math.max(0, destination.x - player.x + COLLISION.PORTAL_EXIT_OFFSET_X);
    player.placeAt(destination.y + destination.h - player.h);
    this.cooldownFrames = GAMEPLAY.PORTAL_COOLDOWN_FRAMES;
    this.lockId = destination.id;
  }
}

export function validatePortals(portals, blocks, hazards, rules) {
  const portalIds = new Map();
  const validRoles = new Set(['entrance', 'exit']);

  for (const portal of portals) {
    if (!portal.id) {
      throw new Error('Portal is missing an id.');
    }

    if (![portal.x, portal.y, portal.w, portal.h].every(Number.isFinite) ||
        portal.w <= COLLISION.PORTAL_TRIGGER_INSET_X * 2 ||
        portal.h <= COLLISION.PORTAL_TRIGGER_INSET_Y * 2) {
      throw new Error(`Portal "${portal.id}" has invalid dimensions.`);
    }

    if (portalIds.has(portal.id)) {
      throw new Error(`Portal id "${portal.id}" is duplicated.`);
    }

    if (!validRoles.has(portal.role)) {
      throw new Error(`Portal "${portal.id}" has invalid role "${portal.role}".`);
    }

    portalIds.set(portal.id, portal);
  }

  for (const portal of portals) {
    if (!portal.pairId) {
      throw new Error(`Portal "${portal.id}" is missing a pairId.`);
    }

    if (portal.role === 'entrance') {
      if (!portal.targetId) {
        throw new Error(`Portal "${portal.id}" is missing a targetId.`);
      }

      const target = portalIds.get(portal.targetId);
      if (!target) {
        throw new Error(`Portal "${portal.id}" targets missing portal "${portal.targetId}".`);
      }

      if (target.role !== 'exit') {
        throw new Error(`Portal "${portal.id}" must target an exit portal.`);
      }
      if (target.pairId !== portal.pairId) {
        throw new Error(`Portal "${portal.id}" targets an exit from another pair.`);
      }
    }

    if (portal.role === 'exit' && portal.targetId) {
      throw new Error(`Portal exit "${portal.id}" should not define a targetId.`);
    }

    if (!hasSupportingSurface(portal, blocks)) {
      throw new Error(`Portal "${portal.id}" is not fully supported.`);
    }

    const overlappingHazard = hazards.find(hazard =>
      rangesOverlap(portal.x, portal.x + portal.w, hazard.x, hazard.x + TILE) &&
      rangesOverlap(portal.y, portal.y + portal.h, hazard.y, hazard.y + TILE)
    );

    if (overlappingHazard) {
      throw new Error(`Portal "${portal.id}" overlaps a hazard at x=${overlappingHazard.x}.`);
    }

    if (portal.role === 'exit') {
      const entrances = portals.filter(p => p.role === 'entrance' && p.targetId === portal.id);
      if (entrances.length !== 1) {
        throw new Error(`Portal exit "${portal.id}" needs exactly one paired entrance.`);
      }
      validatePortalExitClearance(portal, hazards, rules);
    }
  }
}

function validatePortalExitClearance(portal, hazards, rules) {
  const clearancePx = rules.portalExitClearanceTiles * TILE;
  const nextHazard = hazards.find(hazard =>
    hazard.x >= portal.x &&
    hazard.x - portal.x < clearancePx
  );

  if (nextHazard) {
    throw new Error(
      `Portal exit "${portal.id}" has only ${nextHazard.x - portal.x}px before hazard at x=${nextHazard.x}.`
    );
  }
}

function hasSupportingSurface(portal, blocks) {
  const supportY = portal.y + portal.h;

  if (supportY === WORLD.GROUND_Y) {
    return true;
  }

  return blocks.some(block =>
    block.y === supportY &&
    block.x <= portal.x &&
    block.x + block.w >= portal.x + (portal.role === 'exit'
      ? Math.max(portal.w, COLLISION.PORTAL_EXIT_OFFSET_X + TILE - 2) : portal.w)
  );
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}
