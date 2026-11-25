// Mouse and keyboard in, actions out. Clicks are converted to the kitchen's logical
// coordinates and hit-tested against the stations; the world never sees a pixel.
import { FIELD, INGREDIENTS, LAYOUT } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;

/** The action a click at logical (x, y) means, or null when it hits nothing live. */
export function actionAt(x, y) {
  const bins = LAYOUT.bins;
  for (let index = 0; index < INGREDIENTS.length; index += 1) {
    const col = index % bins.cols;
    const row = Math.floor(index / bins.cols);
    const rect = {
      x: bins.x + col * (bins.width + bins.gapX),
      y: bins.y + row * (bins.height + bins.gapY),
      width: bins.width,
      height: bins.height,
    };
    if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
      return { kind: 'bin', id: INGREDIENTS[index].id };
    }
  }

  const grill = LAYOUT.grill;
  for (let slot = 0; slot < 2; slot += 1) {
    const rect = {
      x: grill.x + 8 + slot * (LAYOUT.grillSlot.width + LAYOUT.grillSlot.gap),
      y: grill.y + 40,
      width: LAYOUT.grillSlot.width,
      height: LAYOUT.grillSlot.height,
    };
    if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
      return { kind: 'grill', slot };
    }
  }

  const board = LAYOUT.chopBoard;
  if (x >= board.x && x < board.x + board.width && y >= board.y && y < board.y + board.height) {
    return { kind: 'board' };
  }
  const plate = LAYOUT.plate;
  if (x >= plate.x && x < plate.x + plate.width && y >= plate.y && y < plate.y + plate.height) {
    return { kind: 'plate' };
  }
  const serve = LAYOUT.serve;
  if (x >= serve.x && x < serve.x + serve.width && y >= serve.y && y < serve.y + serve.height) {
    return { kind: 'serve' };
  }
  const trash = LAYOUT.trash;
  if (x >= trash.x && x < trash.x + trash.width && y >= trash.y && y < trash.y + trash.height) {
    return { kind: 'trash' };
  }
  return null;
}

export function createInput(canvas) {
  const clicks = [];
  const digits = [];
  let actions = 0;
  const mouse = { x: FIELD.width / 2, y: FIELD.height / 2, inside: false };

  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * FIELD.width,
      y: ((clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toField(event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.inside = true;
  });
  canvas.addEventListener('pointerleave', () => {
    mouse.inside = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event.clientX, event.clientY);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.inside = true;
    clicks.push(point);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= String(INGREDIENTS.length)) {
      digits.push(INGREDIENTS[Number(key) - 1].id);
    } else if (key === 's' || key === 'S') {
      actions |= ACTION_SERVE;
    } else if (key === 'p' || key === 'P' || key === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (key === ' ' || key === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    }
  });

  return {
    mouse,
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    takeDigits() {
      return digits.splice(0, digits.length);
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
