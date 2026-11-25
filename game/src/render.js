// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// kitchen is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Flat shapes and canvas text for the HUD and the panels; every ingredient is
// drawn from circles and rounded rectangles, so the game needs no image files.
import {
  BURN_SECONDS,
  CHOP_SECONDS,
  COOK_SECONDS,
  FIELD,
  FONT,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  LAYOUT,
  PALETTE,
  RECIPES,
  RECIPE_BY_ID,
  SHIFT_SECONDS,
} from './config.js';
import { boardStatus, grillStatus } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function countOf(list, id) {
  let count = 0;
  for (const entry of list) if (entry === id) count += 1;
  return count;
}

/** The open ticket whose recipe exactly matches what is on the plate, if any. */
function matchingTicket(state) {
  for (const order of state.orders) {
    const recipe = RECIPE_BY_ID[order.recipeId];
    if (recipe.items.length !== state.plate.length) continue;
    if (recipe.items.every((id) => countOf(recipe.items, id) === countOf(state.plate, id))) return order;
  }
  return null;
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function text(context, value, x, y, size, color, align, weight) {
  context.fillStyle = color;
  context.font = `${weight ?? 600} ${size}px ${FONT}`;
  context.textAlign = align ?? 'left';
  context.textBaseline = 'middle';
  context.fillText(value, x, y);
}

function circle(context, x, y, radius, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

/** One ingredient, drawn at centre (x, y) with radius r; prep is raw/cooked/chopped/burnt/ready. */
export function drawIngredient(context, id, prep, x, y, r) {
  const item = INGREDIENT_BY_ID[id];
  if (!item) return;
  context.save();
  context.translate(x, y);
  if (id === 'bun') {
    context.fillStyle = '#c98a3e';
    roundRect(context, -r, -r * 0.15, r * 2, r * 0.75, r * 0.3);
    context.fill();
    context.fillStyle = '#f0bd72';
    context.beginPath();
    context.arc(0, -r * 0.1, r * 0.95, Math.PI, 0);
    context.closePath();
    context.fill();
    context.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.45, -0.55], [0.05, -0.75], [0.5, -0.45], [-0.1, -0.35]]) {
      context.beginPath();
      context.ellipse(sx * r, sy * r, r * 0.12, r * 0.07, 0.4, 0, Math.PI * 2);
      context.fill();
    }
  } else if (id === 'patty') {
    if (prep === 'burnt') {
      context.fillStyle = '#1c1512';
      roundRect(context, -r, -r * 0.4, r * 2, r * 0.8, r * 0.3);
      context.fill();
      context.fillStyle = '#3a2c22';
      roundRect(context, -r * 0.7, -r * 0.25, r * 1.4, r * 0.2, r * 0.1);
      context.fill();
    } else if (prep === 'cooked') {
      context.fillStyle = '#6b3a22';
      roundRect(context, -r, -r * 0.4, r * 2, r * 0.8, r * 0.3);
      context.fill();
      context.strokeStyle = '#4a2716';
      context.lineWidth = Math.max(2, r * 0.1);
      for (const offset of [-0.5, 0, 0.5]) {
        context.beginPath();
        context.moveTo((offset - 0.25) * r, -r * 0.4);
        context.lineTo((offset + 0.25) * r, r * 0.4);
        context.stroke();
      }
    } else {
      context.fillStyle = '#a85f43';
      roundRect(context, -r, -r * 0.4, r * 2, r * 0.8, r * 0.3);
      context.fill();
      context.fillStyle = '#c98a6d';
      roundRect(context, -r * 0.7, -r * 0.25, r * 1.4, r * 0.5, r * 0.2);
      context.fill();
    }
  } else if (id === 'lettuce') {
    context.fillStyle = '#4e8a26';
    for (const [ox, oy, or] of [[-0.45, 0.1, 0.6], [0.45, 0.1, 0.6], [0, -0.35, 0.65]]) {
      circle(context, ox * r, oy * r, or * r, '#4e8a26');
    }
    context.fillStyle = '#7bc043';
    for (const [ox, oy, or] of [[-0.3, 0, 0.45], [0.35, -0.05, 0.45], [0, -0.3, 0.5]]) {
      circle(context, ox * r, oy * r, or * r, '#7bc043');
    }
    context.strokeStyle = '#a5d977';
    context.lineWidth = Math.max(1.5, r * 0.08);
    context.beginPath();
    context.moveTo(0, -r * 0.6);
    context.lineTo(0, r * 0.5);
    context.stroke();
  } else if (id === 'tomato') {
    circle(context, 0, 0, r * 0.95, '#e2483d');
    circle(context, 0, 0, r * 0.62, '#f0705f');
    context.fillStyle = '#ffd9c9';
    for (const [sx, sy] of [[-0.3, -0.2], [0.3, 0.15], [0, 0.35]]) {
      circle(context, sx * r, sy * r, r * 0.09, '#ffd9c9');
    }
    context.fillStyle = '#4e8a26';
    context.beginPath();
    context.moveTo(0, -r * 0.95);
    context.lineTo(-r * 0.25, -r * 0.6);
    context.lineTo(r * 0.25, -r * 0.6);
    context.closePath();
    context.fill();
  } else if (id === 'cheese') {
    context.save();
    context.rotate(Math.PI / 4);
    context.fillStyle = '#f7c948';
    roundRect(context, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.2);
    context.fill();
    context.fillStyle = '#d9a41f';
    for (const [hx, hy] of [[-0.35, -0.3], [0.3, 0.25], [0.25, -0.35]]) {
      circle(context, hx * r, hy * r, r * 0.13, '#d9a41f');
    }
    context.restore();
  } else if (id === 'sauce') {
    context.fillStyle = '#f08a1d';
    for (const [ox, oy, or] of [[-0.4, 0.25, 0.5], [0.4, 0.25, 0.5], [0, -0.2, 0.6]]) {
      circle(context, ox * r, oy * r, or * r, '#f08a1d');
    }
    context.fillStyle = '#ffc46b';
    circle(context, -r * 0.2, -r * 0.25, r * 0.2, '#ffc46b');
  }
  context.restore();
}

function panel(context, x, y, width, height, fill, edge) {
  context.fillStyle = fill;
  roundRect(context, x, y, width, height, 10);
  context.fill();
  if (edge) {
    context.strokeStyle = edge;
    context.lineWidth = 2;
    roundRect(context, x, y, width, height, 10);
    context.stroke();
  }
}

function progressBar(context, x, y, width, height, fraction, color, back) {
  context.fillStyle = back ?? '#241a12';
  roundRect(context, x, y, width, height, height / 2);
  context.fill();
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped > 0) {
    context.fillStyle = color;
    roundRect(context, x, y, width * clamped, height, height / 2);
    context.fill();
  }
}

function drawHeart(context, x, y, size, filled) {
  context.fillStyle = filled ? '#e2483d' : '#5d4030';
  context.beginPath();
  context.moveTo(x, y + size * 0.9);
  context.bezierCurveTo(x - size, y + size * 0.1, x - size * 0.5, y - size * 0.7, x, y - size * 0.1);
  context.bezierCurveTo(x + size * 0.5, y - size * 0.7, x + size, y + size * 0.1, x, y + size * 0.9);
  context.fill();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function drawTicket(order, x) {
    const recipe = RECIPE_BY_ID[order.recipeId];
    const ticket = LAYOUT.ticket;
    const boardY = LAYOUT.orderBoard.y;
    const fraction = Math.max(0, order.patience / order.maxPatience);
    const barColor = fraction > 0.5 ? '#7bc043' : fraction > 0.25 ? '#f7c948' : '#e2483d';
    panel(context, x, boardY, ticket.width, ticket.height, PALETTE.paper, PALETTE.paperEdge);
    text(context, recipe.name, x + 14, boardY + 18, 17, PALETTE.ink, 'left', 800);
    text(context, `$${recipe.reward}`, x + ticket.width - 14, boardY + 18, 17, '#8a6d1f', 'right', 800);
    let chipX = x + 26;
    for (const id of recipe.items) {
      drawIngredient(context, id, id === 'patty' ? 'cooked' : id === 'lettuce' || id === 'tomato' ? 'chopped' : 'ready', chipX, boardY + 48, 13);
      chipX += 30;
    }
    progressBar(context, x + 14, boardY + 68, ticket.width - 28, 8, fraction, barColor);
  }

  function drawKitchen(state, mouse) {
    // Wall, floor and the long counter the kitchen sits on.
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, 0, FIELD.width, 168);
    context.fillStyle = PALETTE.wallTrim;
    context.fillRect(0, 160, FIELD.width, 8);
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 168, FIELD.width, FIELD.height - 168);
    context.strokeStyle = PALETTE.floorLine;
    context.lineWidth = 2;
    for (let y = 200; y < FIELD.height; y += 64) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(FIELD.width, y);
      context.stroke();
    }
    // Hanging lamps.
    for (const lampX of [320, 640, 960]) {
      context.strokeStyle = '#1c130c';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(lampX, 0);
      context.lineTo(lampX, 26);
      context.stroke();
      context.fillStyle = '#f7c948';
      context.beginPath();
      context.moveTo(lampX - 22, 34);
      context.lineTo(lampX + 22, 34);
      context.lineTo(lampX + 10, 14);
      context.lineTo(lampX - 10, 14);
      context.closePath();
      context.fill();
    }

    // --- HUD ---
    const hud = LAYOUT.hud;
    context.fillStyle = 'rgba(20, 12, 7, 0.55)';
    context.fillRect(hud.x, hud.y, hud.width, hud.height);
    text(context, 'SIZZLE & SERVE', 24, 30, 26, PALETTE.gold, 'left', 900);
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const timeFraction = state.timeLeft / SHIFT_SECONDS;
    text(context, 'SHIFT', 470, 20, 12, PALETTE.muted, 'left', 700);
    progressBar(context, 470, 30, 260, 14, timeFraction, timeFraction > 0.25 ? '#7bc043' : '#e2483d', '#1c130c');
    text(context, clock, 742, 30, 22, state.timeLeft <= 10 ? '#ff9a8a' : PALETTE.text, 'left', 800);
    text(context, `Coins ${state.coins}`, 830, 30, 20, PALETTE.gold, 'left', 800);
    for (let heart = 0; heart < 3; heart += 1) {
      drawHeart(context, 990 + heart * 30, 30, 11, heart < state.hearts);
    }
    text(context, `Lv ${state.level}`, 1090, 30, 18, PALETTE.text, 'left', 700);
    if (state.combo > 1) {
      context.fillStyle = '#e2483d';
      roundRect(context, 1150, 12, 106, 32, 16);
      context.fill();
      text(context, `COMBO x${state.combo}`, 1203, 29, 16, '#ffffff', 'center', 800);
    }

    // --- Order board ---
    if (state.orders.length === 0) {
      text(context, 'No tickets — a breather!', LAYOUT.orderBoard.x + 12, LAYOUT.orderBoard.y + 44, 18, PALETTE.muted, 'left', 600);
    }
    state.orders.forEach((order, index) => {
      drawTicket(order, LAYOUT.orderBoard.x + index * (LAYOUT.ticket.width + LAYOUT.ticket.gap));
    });

    // --- Ingredient bins ---
    text(context, 'INGREDIENTS — click to grab  ·  keys 1–6', LAYOUT.bins.x, LAYOUT.bins.y - 12, 13, PALETTE.muted, 'left', 800);
    INGREDIENTS.forEach((item, index) => {
      const col = index % LAYOUT.bins.cols;
      const row = Math.floor(index / LAYOUT.bins.cols);
      const x = LAYOUT.bins.x + col * (LAYOUT.bins.width + LAYOUT.bins.gapX);
      const y = LAYOUT.bins.y + row * (LAYOUT.bins.height + LAYOUT.bins.gapY);
      panel(context, x, y, LAYOUT.bins.width, LAYOUT.bins.height, PALETTE.counter, PALETTE.counterEdge);
      context.fillStyle = PALETTE.counterTop;
      context.fillRect(x + 6, y + 6, LAYOUT.bins.width - 12, 8);
      drawIngredient(context, item.id, item.id === 'patty' ? 'raw' : item.id === 'lettuce' || item.id === 'tomato' ? 'raw' : 'ready', x + 30, y + 32, 17);
      text(context, item.name, x + 56, y + 24, 16, PALETTE.text, 'left', 700);
      text(context, `key ${item.key}`, x + 56, y + 42, 12, PALETTE.muted, 'left', 600);
    });

    // --- Menu ---
    const menu = LAYOUT.menu;
    panel(context, menu.x, menu.y, menu.width, menu.height, PALETTE.panel, PALETTE.panelEdge);
    text(context, 'MENU — four tickets, four builds', menu.x + 16, menu.y + 22, 16, PALETTE.gold, 'left', 800);
    RECIPES.forEach((recipe, index) => {
      const y = menu.y + 52 + index * 44;
      text(context, recipe.name, menu.x + 16, y, 16, PALETTE.text, 'left', 700);
      let chipX = menu.x + 200;
      for (const id of recipe.items) {
        drawIngredient(context, id, id === 'patty' ? 'cooked' : id === 'lettuce' || id === 'tomato' ? 'chopped' : 'ready', chipX, y, 11);
        chipX += 28;
      }
      text(context, `$${recipe.reward}`, menu.x + menu.width - 16, y, 16, PALETTE.gold, 'right', 800);
    });

    // --- Grill ---
    const grill = LAYOUT.grill;
    panel(context, grill.x, grill.y, grill.width, grill.height, PALETTE.steelDark, '#4a545e');
    text(context, 'GRILL', grill.x + 14, grill.y + 20, 15, '#eef1f5', 'left', 800);
    state.grill.forEach((slot, index) => {
      const x = grill.x + 8 + index * (LAYOUT.grillSlot.width + LAYOUT.grillSlot.gap);
      const y = grill.y + 40;
      const width = LAYOUT.grillSlot.width;
      const height = LAYOUT.grillSlot.height;
      context.fillStyle = PALETTE.grill;
      roundRect(context, x, y, width, height, 8);
      context.fill();
      if (slot) {
        const status = grillStatus(slot);
        // Flames while it cooks.
        if (status === 'cooking') {
          for (let flame = 0; flame < 3; flame += 1) {
            const flicker = Math.sin(state.elapsed * 9 + flame * 2.1 + index) * 4;
            context.fillStyle = flame % 2 === 0 ? '#f08a1d' : '#f7c948';
            context.beginPath();
            const fx = x + 24 + flame * 40;
            context.moveTo(fx - 12, y + height - 8);
            context.quadraticCurveTo(fx, y + height - 34 - flicker, fx + 12, y + height - 8);
            context.closePath();
            context.fill();
          }
        }
        if (status === 'burnt') {
          context.fillStyle = 'rgba(180, 180, 180, 0.5)';
          for (const [sx, sy, sr] of [[-20, -18, 7], [8, -26, 9], [26, -14, 6]]) {
            circle(context, x + width / 2 + sx, y + 34 + sy, sr, 'rgba(180, 180, 180, 0.5)');
          }
        }
        drawIngredient(context, 'patty', status, x + width / 2, y + height / 2 + 2, 30);
        const fraction = status === 'burnt' ? 1 : Math.min(1, slot.t / COOK_SECONDS);
        progressBar(context, x + 10, y + 8, width - 20, 7, fraction, status === 'burnt' ? '#e2483d' : status === 'cooked' ? '#7bc043' : '#f08a1d');
      } else {
        text(context, 'empty', x + width / 2, y + height / 2, 14, '#7c8894', 'center', 600);
      }
      // The slot's status sits in the strip below it, clear of the flames.
      if (slot) {
        const status = grillStatus(slot);
        text(context, status === 'burnt' ? 'BURNT!' : status === 'cooked' ? 'Cooked — grab it' : 'Cooking…', x + width / 2, grill.y + grill.height - 8, 12, status === 'burnt' ? '#ff9a8a' : '#cfd6dd', 'center', 700);
      }
    });

    // --- Chopping board ---
    const board = LAYOUT.chopBoard;
    panel(context, board.x, board.y, board.width, board.height, PALETTE.counter, PALETTE.counterEdge);
    text(context, 'CHOPPING BOARD', board.x + 14, board.y + 20, 15, PALETTE.text, 'left', 800);
    context.fillStyle = PALETTE.board;
    roundRect(context, board.x + 24, board.y + 40, board.width - 48, 96, 10);
    context.fill();
    context.strokeStyle = '#b98f5f';
    context.lineWidth = 2;
    for (let line = 1; line < 4; line += 1) {
      context.beginPath();
      context.moveTo(board.x + 44, board.y + 40 + line * 22);
      context.lineTo(board.x + board.width - 44, board.y + 40 + line * 22);
      context.stroke();
    }
    const slot = state.boardSlot;
    if (slot) {
      const status = boardStatus(slot);
      drawIngredient(context, slot.item, status === 'chopped' ? 'chopped' : 'raw', board.x + board.width / 2, board.y + 84, 30);
      progressBar(context, board.x + 60, board.y + 108, board.width - 120, 7, Math.min(1, slot.t / CHOP_SECONDS), status === 'chopped' ? '#7bc043' : '#f08a1d');
      text(context, status === 'chopped' ? 'Chopped — grab it' : 'Chopping…', board.x + board.width / 2, board.y + 140, 12, '#cfd6dd', 'center', 700);
    } else {
      text(context, 'drop lettuce or tomato here', board.x + board.width / 2, board.y + 88, 14, '#8a7a68', 'center', 600);
    }

    // --- Assembly plate ---
    const plate = LAYOUT.plate;
    panel(context, plate.x, plate.y, plate.width, plate.height, PALETTE.counter, PALETTE.counterEdge);
    text(context, 'ASSEMBLY PLATE', plate.x + 14, plate.y + 20, 15, PALETTE.text, 'left', 800);
    context.fillStyle = PALETTE.plate;
    context.beginPath();
    context.ellipse(plate.x + plate.width / 2, plate.y + 118, 112, 62, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#d8d2bd';
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(plate.x + plate.width / 2, plate.y + 118, 88, 46, 0, 0, Math.PI * 2);
    context.stroke();
    state.plate.forEach((id, index) => {
      const layerY = plate.y + 138 - index * 13;
      const prep = id === 'patty' ? 'cooked' : id === 'lettuce' || id === 'tomato' ? 'chopped' : 'ready';
      drawIngredient(context, id, prep, plate.x + plate.width / 2, layerY, 26);
    });
    if (state.plate.length === 0) {
      text(context, 'stack the ticket here', plate.x + plate.width / 2, plate.y + 118, 14, '#9a8f7d', 'center', 600);
    }
    const match = matchingTicket(state);
    text(context, match ? `Matches: ${RECIPE_BY_ID[match.recipeId].name} — ring the bell!` : `${state.plate.length} layer${state.plate.length === 1 ? '' : 's'} on the plate`, plate.x + plate.width / 2, plate.y + 184, 13, match ? '#7bc043' : PALETTE.muted, 'center', 700);

    // --- Serve window ---
    const serve = LAYOUT.serve;
    const ready = Boolean(match);
    panel(context, serve.x, serve.y, serve.width, serve.height, ready ? '#2f4a22' : PALETTE.panel, ready ? '#7bc043' : PALETTE.panelEdge);
    text(context, 'SERVE WINDOW', serve.x + 14, serve.y + 20, 15, ready ? '#b8e986' : PALETTE.text, 'left', 800);
    // The bell.
    context.fillStyle = '#f7c948';
    context.beginPath();
    context.arc(serve.x + serve.width / 2, serve.y + 108, 42, Math.PI, 0);
    context.closePath();
    context.fill();
    context.fillStyle = '#d9a41f';
    context.fillRect(serve.x + serve.width / 2 - 52, serve.y + 106, 104, 8);
    circle(context, serve.x + serve.width / 2, serve.y + 60, 7, '#f7c948');
    text(context, ready ? 'READY — click the bell!' : 'ring the bell to serve', serve.x + serve.width / 2, serve.y + 172, 14, ready ? '#b8e986' : PALETTE.muted, 'center', 700);

    // --- Trash and hints ---
    const trash = LAYOUT.trash;
    panel(context, trash.x, trash.y, trash.width, trash.height, '#3a3f45', '#54595f');
    text(context, 'TRASH', trash.x + trash.width / 2, trash.y + 24, 15, '#cfd6dd', 'center', 800);
    text(context, 'burnt food goes here', trash.x + trash.width / 2, trash.y + 52, 12, '#8b93a3', 'center', 600);
    const hints = LAYOUT.hints;
    text(context, 'How to play: grab an ingredient, grill the patty, chop the greens, stack the plate to match a ticket, ring the bell.', hints.x + 8, hints.y + 24, 15, PALETTE.text, 'left', 600);
    text(context, 'Serve fast for a tip — serve again within 8 seconds for a combo. Missed tickets cost a heart.', hints.x + 8, hints.y + 50, 15, PALETTE.muted, 'left', 600);

    // --- Popups ---
    for (const popup of state.popups) {
      const age = 1.6 - popup.ttl;
      context.globalAlpha = Math.max(0, Math.min(1, popup.ttl / 0.6));
      text(context, popup.text, popup.x, popup.y - age * 26, 20, popup.color, 'center', 800);
      context.globalAlpha = 1;
    }

    // --- The hand ---
    if (mouse && mouse.inside && state.hand) {
      context.save();
      context.globalAlpha = 0.35;
      circle(context, mouse.x, mouse.y + 6, 30, '#000000');
      context.globalAlpha = 1;
      drawIngredient(context, state.hand.id, state.hand.prep, mouse.x, mouse.y, 26);
      context.restore();
      const name = INGREDIENT_BY_ID[state.hand.id].name;
      const prepLabel = state.hand.prep === 'raw' ? ' (raw)' : state.hand.prep === 'cooked' ? ' (cooked)' : state.hand.prep === 'chopped' ? ' (chopped)' : state.hand.prep === 'burnt' ? ' (burnt!)' : '';
      const label = name + prepLabel;
      context.fillStyle = 'rgba(20, 12, 7, 0.8)';
      context.font = `700 14px ${FONT}`;
      const labelWidth = context.measureText(label).width;
      roundRect(context, mouse.x - labelWidth / 2 - 10, mouse.y + 32, labelWidth + 20, 24, 12);
      context.fill();
      text(context, label, mouse.x, mouse.y + 44, 14, PALETTE.text, 'center', 700);
    }
  }

  function drawBanner(title, lines, prompt, best) {
    context.fillStyle = 'rgba(20, 12, 7, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    const width = 680;
    const height = 150 + lines.length * 30;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    panel(context, x, y, width, height, PALETTE.panel, PALETTE.panelEdge);
    text(context, title, FIELD.width / 2, y + 44, 40, PALETTE.gold, 'center', 900);
    lines.forEach((line, index) => {
      text(context, line, FIELD.width / 2, y + 92 + index * 30, 18, PALETTE.text, 'center', 600);
    });
    text(context, prompt, FIELD.width / 2, y + height - 34, 18, '#7bc043', 'center', 800);
    if (best > 0) text(context, `Best shift: ${best} coins`, FIELD.width / 2, y + height - 8, 13, PALETTE.muted, 'center', 600);
  }

  function draw(screen, state, best, mouse) {
    resize();
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(-view.x / view.scale, -view.y / view.scale, FIELD.width + (2 * view.x) / view.scale, FIELD.height + (2 * view.y) / view.scale);
    drawKitchen(state, mouse);

    if (screen === SCREEN_TITLE) {
      // A low banner, so the whole kitchen stays visible behind the title.
      context.fillStyle = 'rgba(20, 12, 7, 0.66)';
      context.fillRect(0, 468, FIELD.width, FIELD.height - 468);
      text(context, 'SIZZLE & SERVE', FIELD.width / 2, 522, 52, PALETTE.gold, 'center', 900);
      text(context, 'A fast kitchen game — cook every ticket before patience runs out', FIELD.width / 2, 566, 19, PALETTE.text, 'center', 600);
      text(context, 'Grab ingredients · grill the patty · chop the greens · stack the plate · ring the bell', FIELD.width / 2, 606, 17, PALETTE.muted, 'center', 600);
      text(context, 'Click or press Space to start your shift', FIELD.width / 2, 656, 20, '#7bc043', 'center', 800);
      if (best > 0) text(context, `Best shift: ${best} coins`, FIELD.width / 2, 690, 14, PALETTE.muted, 'center', 600);
    } else if (screen === SCREEN_PAUSED) {
      drawBanner('Paused', ['The grill is holding. The tickets are waiting.'], 'Press P or click to keep cooking', best);
    } else if (screen === SCREEN_OVER) {
      drawBanner('Shift over!', [
        `Served ${state.served} ticket${state.served === 1 ? '' : 's'} · missed ${state.missed}`,
        `Coins earned: ${state.coins}`,
        state.overReason === 'hearts' ? 'Too many walk-outs — the lunch rush won this time.' : 'The clock ran out — the kitchen is yours again tomorrow.',
      ], 'Click or press Space to cook again', best);
    }
  }

  return { draw };
}
