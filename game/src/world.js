// The kitchen itself: orders, grill, chopping board, plate and hand. No drawing here,
// no input here — just the rules, so the same code drives real play and the staged
// screenshot scenes. Time advances in fixed steps; every action is one `doAction` call.
import {
  BURN_SECONDS,
  CHOP_SECONDS,
  COOK_SECONDS,
  COMBO_WINDOW,
  HEARTS,
  INGREDIENT_BY_ID,
  LAYOUT,
  MAX_ORDERS,
  PATIENCE_SECONDS,
  RECIPES,
  RECIPE_BY_ID,
  SHIFT_SECONDS,
  SPAWN_FIRST,
  SPAWN_LAST,
} from './config.js';
import { pick } from './random.js';

export const EVENT_SERVED = 1;
export const EVENT_MISSED = 2;
export const EVENT_OVER = 4;

/** 'empty' | 'cooking' | 'cooked' | 'burnt' for a grill slot. */
export function grillStatus(slot) {
  if (!slot) return 'empty';
  if (slot.t >= BURN_SECONDS) return 'burnt';
  if (slot.t >= COOK_SECONDS) return 'cooked';
  return 'cooking';
}

/** 'empty' | 'chopping' | 'chopped' for the chopping board. */
export function boardStatus(slot) {
  if (!slot) return 'empty';
  return slot.t >= CHOP_SECONDS ? 'chopped' : 'chopping';
}

function countOf(list, id) {
  let count = 0;
  for (const entry of list) if (entry === id) count += 1;
  return count;
}

/** Does any open ticket still need one more of this ingredient on the plate? */
function ticketNeeds(state, id) {
  for (const order of state.orders) {
    const recipe = RECIPE_BY_ID[order.recipeId];
    if (countOf(recipe.items, id) > countOf(state.plate, id)) return true;
  }
  return false;
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

export function createWorld(random) {
  const state = {
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    missed: 0,
    hearts: HEARTS,
    combo: 0,
    comboTimer: 0,
    level: 1,
    orders: [],
    grill: [null, null],
    boardSlot: null,
    plate: [],
    hand: null,
    popups: [],
    over: false,
    overReason: '',
    spawnTimer: SPAWN_FIRST,
    nextUid: 1,
  };

  function popup(text, x, y, color) {
    state.popups.push({ text, x, y, ttl: 1.6, color: color ?? '#fff3df' });
    if (state.popups.length > 6) state.popups.shift();
  }

  function spawnOrder(recipeId) {
    const recipe = recipeId ? RECIPE_BY_ID[recipeId] : pick(random, RECIPES);
    state.orders.push({
      uid: state.nextUid,
      recipeId: recipe.id,
      patience: PATIENCE_SECONDS,
      maxPatience: PATIENCE_SECONDS,
    });
    state.nextUid += 1;
  }

  function reset() {
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.coins = 0;
    state.served = 0;
    state.missed = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.comboTimer = 0;
    state.level = 1;
    state.orders = [];
    state.grill = [null, null];
    state.boardSlot = null;
    state.plate = [];
    state.hand = null;
    state.popups = [];
    state.over = false;
    state.overReason = '';
    state.spawnTimer = SPAWN_FIRST;
    state.nextUid = 1;
    spawnOrder();
    spawnOrder();
  }

  function step(dt) {
    if (state.over) return 0;
    let events = 0;
    state.timeLeft -= dt;
    state.elapsed += dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      state.overReason = 'shift';
      return EVENT_OVER;
    }
    state.level = 1 + Math.floor(state.elapsed / 45);

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
      state.spawnTimer = SPAWN_FIRST + (SPAWN_LAST - SPAWN_FIRST) * progress;
    }

    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.missed += 1;
        state.hearts -= 1;
        state.combo = 0;
        state.comboTimer = 0;
        popup('Ticket walked out!', LAYOUT.orderBoard.x + 140, LAYOUT.orderBoard.y + 46, '#ff9a8a');
        events |= EVENT_MISSED;
        if (state.hearts <= 0) {
          state.over = true;
          state.overReason = 'hearts';
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    for (const slot of state.grill) if (slot) slot.t += dt;
    if (state.boardSlot) state.boardSlot.t += dt;

    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    for (let index = state.popups.length - 1; index >= 0; index -= 1) {
      state.popups[index].ttl -= dt;
      if (state.popups[index].ttl <= 0) state.popups.splice(index, 1);
    }
    return events;
  }

  /**
   * One player action. `action` is { kind: 'bin', id } | { kind: 'grill', slot } |
   * { kind: 'board' } | { kind: 'plate' } | { kind: 'serve' } | { kind: 'trash' }.
   * Returns true when the action did something.
   */
  function doAction(action) {
    if (state.over) return false;
    const hand = state.hand;

    if (action.kind === 'bin') {
      if (hand) {
        popup('Hands full!', LAYOUT.bins.x + 80, LAYOUT.bins.y + 28, '#ff9a8a');
        return false;
      }
      const ingredient = INGREDIENT_BY_ID[action.id];
      if (!ingredient) return false;
      const prep = action.id === 'patty' || action.id === 'lettuce' || action.id === 'tomato' ? 'raw' : 'ready';
      state.hand = { id: action.id, prep };
      return true;
    }

    if (action.kind === 'grill') {
      const slot = state.grill[action.slot];
      if (hand && hand.id === 'patty' && hand.prep === 'raw' && !slot) {
        state.grill[action.slot] = { item: 'patty', t: 0 };
        state.hand = null;
        return true;
      }
      if (!hand && slot) {
        const status = grillStatus(slot);
        if (status === 'cooking') {
          popup('Still cooking…', LAYOUT.grill.x + 144, LAYOUT.grill.y + 30, '#ff9a8a');
          return false;
        }
        state.hand = { id: 'patty', prep: status === 'cooked' ? 'cooked' : 'burnt' };
        state.grill[action.slot] = null;
        return true;
      }
      return false;
    }

    if (action.kind === 'board') {
      const slot = state.boardSlot;
      if (hand && (hand.id === 'lettuce' || hand.id === 'tomato') && hand.prep === 'raw' && !slot) {
        state.boardSlot = { item: hand.id, t: 0 };
        state.hand = null;
        return true;
      }
      if (!hand && slot && boardStatus(slot) === 'chopped') {
        state.hand = { id: slot.item, prep: 'chopped' };
        state.boardSlot = null;
        return true;
      }
      if (!hand && slot) {
        popup('Still chopping…', LAYOUT.chopBoard.x + 172, LAYOUT.chopBoard.y + 30, '#ff9a8a');
        return false;
      }
      return false;
    }

    if (action.kind === 'plate') {
      if (!hand) return false;
      if (hand.prep === 'raw') {
        popup(hand.id === 'patty' ? 'Grill it first!' : 'Chop it first!', LAYOUT.plate.x + 144, LAYOUT.plate.y + 30, '#ff9a8a');
        return false;
      }
      if (hand.prep === 'burnt') {
        popup('Burnt! Bin it.', LAYOUT.plate.x + 144, LAYOUT.plate.y + 30, '#ff9a8a');
        return false;
      }
      if (!ticketNeeds(state, hand.id)) {
        popup('No ticket needs that', LAYOUT.plate.x + 144, LAYOUT.plate.y + 30, '#ff9a8a');
        return false;
      }
      state.plate.push(hand.id);
      state.hand = null;
      return true;
    }

    if (action.kind === 'serve') {
      const order = matchingTicket(state);
      if (!order) {
        popup('Plate does not match a ticket', LAYOUT.serve.x + 172, LAYOUT.serve.y + 30, '#ff9a8a');
        return false;
      }
      const recipe = RECIPE_BY_ID[order.recipeId];
      const fraction = Math.max(0, order.patience / order.maxPatience);
      const base = recipe.reward + 4 + Math.round(8 * fraction);
      state.combo = state.comboTimer > 0 ? Math.min(3, state.combo + 1) : 1;
      state.comboTimer = COMBO_WINDOW;
      const earned = base * state.combo;
      state.coins += earned;
      state.served += 1;
      state.orders.splice(state.orders.indexOf(order), 1);
      state.plate = [];
      popup(`Served! +${earned}${state.combo > 1 ? `  x${state.combo} combo` : ''}`, LAYOUT.serve.x + 172, LAYOUT.serve.y + 90, '#7bc043');
      return true;
    }

    if (action.kind === 'trash') {
      if (!hand) return false;
      state.hand = null;
      popup('Tossed', LAYOUT.trash.x + 85, LAYOUT.trash.y + 38, '#c9a67a');
      return true;
    }

    return false;
  }

  return { state, reset, step, doAction, spawnOrder };
}
