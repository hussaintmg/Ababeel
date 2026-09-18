/**
 * LIFO Overlay Stack.
 * Ensures that hitting Escape dismisses only the topmost active modal,
 * drawer, dropdown, or overlay, never dismissing multiple layers at once.
 */

class OverlayStack {
  constructor() {
    this.stack = [];
  }

  /**
   * Push an overlay onto the top of the stack.
   * @param {string} id Unique identifier for the overlay
   * @param {Function} dismissFn Function called when Escape dismisses this overlay
   */
  push(id, dismissFn) {
    if (!id) return;
    // Remove if already present to bring it to the top
    this.stack = this.stack.filter((item) => item.id !== id);
    this.stack.push({ id, dismissFn });
  }

  /**
   * Pop an overlay from the stack by its ID.
   * @param {string} id Unique identifier
   */
  pop(id) {
    if (!id) return;
    this.stack = this.stack.filter((item) => item.id !== id);
  }

  /**
   * Dismiss the topmost overlay.
   * @returns {boolean} True if an overlay was dismissed, false if stack was empty.
   */
  dismissTop() {
    if (this.stack.length === 0) return false;
    const top = this.stack.pop();
    if (top && typeof top.dismissFn === "function") {
      try {
        top.dismissFn();
      } catch (err) {
        console.error(`Error dismissing overlay ${top.id}:`, err);
      }
      return true;
    }
    return false;
  }

  /**
   * Returns the count of currently open overlays.
   */
  getCount() {
    return this.stack.length;
  }

  /**
   * Returns true if there is at least one active overlay.
   */
  hasOverlays() {
    return this.stack.length > 0;
  }

  /**
   * Clear all overlays (e.g. on route change).
   */
  clear() {
    this.stack = [];
  }
}

export const overlayStack = new OverlayStack();
