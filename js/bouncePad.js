import { COLLISION } from './config.js';

// Called only when a solid surface catches the player. Pads decorate that
// surface rather than adding a wall that could kill a player running across it.
export function bounceFromLanding(player, pads, cameraX, surfaceY) {
  if (!player.hasJumped || player.vy <= 0) return false;

  const worldLeft = player.left + cameraX;
  const worldRight = player.right + cameraX;
  const pad = pads.find(pad =>
    pad.y === surfaceY &&
    worldLeft < pad.x + pad.w && worldRight > pad.x &&
    player.prevBottom <= pad.y + COLLISION.LANDING_TOLERANCE &&
    player.bottom >= pad.y
  );

  if (!pad) return false;

  player.placeAt(pad.y - player.h);
  player.launch(pad.heightMultiplier);
  return true;
}
