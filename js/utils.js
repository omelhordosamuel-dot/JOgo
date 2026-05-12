window.GP = window.GP || {};

GP.Utils = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  },

  normalize(x, y) {
    const length = Math.hypot(x, y);
    if (!length) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  },

  pointInEllipse(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  },

  pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  },

  circleRectCollision(x, y, r, rect) {
    const nx = this.clamp(x, rect.x, rect.x + rect.w);
    const ny = this.clamp(y, rect.y, rect.y + rect.h);
    return this.dist(x, y, nx, ny) < r;
  },

  pickWeighted(items) {
    const total = items.reduce((sum, item) => sum + item.chance, 0);
    let roll = Math.random() * total;

    for (const item of items) {
      roll -= item.chance;
      if (roll <= 0) return item;
    }

    return items[items.length - 1];
  },

  roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};
