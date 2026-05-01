export default class InputHandler {
  constructor() {
    this.jumpStarted = false;
    this.jumpHeld = false;
    this.switchLevelRequested = false;
    this.touchListenerOptions = { passive: false };

    this.handleKeyDown = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        if (!event.repeat && !this.jumpHeld) {
          this.jumpStarted = true;
        }
        this.jumpHeld = true;
        event.preventDefault();
      } else if (event.code === 'KeyL' && !event.repeat) {
        this.switchLevelRequested = true;
        event.preventDefault();
      }
    };

    this.handleKeyUp = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        this.jumpHeld = false;
        event.preventDefault();
      }
    };

    this.handleMouseDown = () => {
      if (!this.jumpHeld) {
        this.jumpStarted = true;
      }
      this.jumpHeld = true;
    };

    this.handleMouseUp = () => {
      this.jumpHeld = false;
    };

    this.handleTouchStart = (event) => {
      if (!this.jumpHeld) {
        this.jumpStarted = true;
      }
      this.jumpHeld = true;
      event.preventDefault();
    };

    this.handleTouchEnd = () => {
      this.jumpHeld = false;
    };

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchstart', this.handleTouchStart, this.touchListenerOptions);
    document.addEventListener('touchend', this.handleTouchEnd, this.touchListenerOptions);
    document.addEventListener('touchcancel', this.handleTouchEnd, this.touchListenerOptions);
  }

  consumeJumpStart() {
    const shouldJump = this.jumpStarted;
    this.jumpStarted = false;
    return shouldJump;
  }

  isJumpHeld() {
    return this.jumpHeld;
  }

  consumeLevelSwitch() {
    const shouldSwitch = this.switchLevelRequested;
    this.switchLevelRequested = false;
    return shouldSwitch;
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchstart', this.handleTouchStart, this.touchListenerOptions);
    document.removeEventListener('touchend', this.handleTouchEnd, this.touchListenerOptions);
    document.removeEventListener('touchcancel', this.handleTouchEnd, this.touchListenerOptions);
  }
}
