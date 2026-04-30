export default class InputHandler {
  constructor() {
    this.jumpRequested = false;

    this.handleKeyDown = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        this.jumpRequested = true;
      }
    };

    this.handleMouseDown = () => {
      this.jumpRequested = true;
    };

    this.handleTouchStart = () => {
      this.jumpRequested = true;
    };

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('touchstart', this.handleTouchStart);
  }

  consumeJump() {
    const shouldJump = this.jumpRequested;
    this.jumpRequested = false;
    return shouldJump;
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('touchstart', this.handleTouchStart);
  }
}
