// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules
// forward from a fresh world with a fixed script of the same actions a player makes
// (grab, grill, chop, stack, serve), so every frame is what a short game really looks
// like and the same seed always gives the same frame. The end scene then stages the
// last seconds of a shift — clock at 9 seconds, one ticket about to walk out — on top
// of the game that was really played to get there.
import { STEP } from './config.js';
import { SCREEN_PLAY } from './render.js';

function runScript(world, actions, untilSeconds) {
  const sorted = [...actions].sort((a, b) => a.at - b.at);
  let index = 0;
  let elapsed = 0;
  function play(action) {
    // A spawn is staging, not a player move: it goes straight to the world.
    if (action.kind === 'spawn') world.spawnOrder(action.recipeId);
    else world.doAction(action);
  }
  while (elapsed < untilSeconds) {
    while (index < sorted.length && sorted[index].at <= elapsed) {
      play(sorted[index].act);
      index += 1;
    }
    world.step(STEP);
    elapsed += STEP;
  }
  while (index < sorted.length && sorted[index].at <= untilSeconds) {
    play(sorted[index].act);
    index += 1;
  }
}

/** Serve the Classic: bun, chopped lettuce, grilled patty, chopped tomato, ring the bell. */
const SERVE_CLASSIC = [
  { at: 0.2, act: { kind: 'bin', id: 'patty' } },
  { at: 0.3, act: { kind: 'grill', slot: 0 } },
  { at: 0.4, act: { kind: 'bin', id: 'lettuce' } },
  { at: 0.5, act: { kind: 'board' } },
  { at: 4.6, act: { kind: 'board' } },
  { at: 4.8, act: { kind: 'plate' } },
  { at: 5.0, act: { kind: 'bin', id: 'bun' } },
  { at: 5.2, act: { kind: 'plate' } },
  { at: 6.4, act: { kind: 'grill', slot: 0 } },
  { at: 6.6, act: { kind: 'plate' } },
  { at: 6.8, act: { kind: 'bin', id: 'tomato' } },
  { at: 7.0, act: { kind: 'board' } },
  { at: 10.2, act: { kind: 'board' } },
  { at: 10.4, act: { kind: 'plate' } },
  { at: 10.6, act: { kind: 'serve' } },
];

/** Keep cooking after the first serve: start the Garden Stack on the plate. */
const BUILD_GARDEN = [
  { at: 11.0, act: { kind: 'bin', id: 'bun' } },
  { at: 11.2, act: { kind: 'plate' } },
  { at: 11.4, act: { kind: 'bin', id: 'lettuce' } },
  { at: 11.6, act: { kind: 'board' } },
  { at: 14.8, act: { kind: 'board' } },
  { at: 15.0, act: { kind: 'plate' } },
  { at: 15.2, act: { kind: 'bin', id: 'cheese' } },
  { at: 15.4, act: { kind: 'plate' } },
  { at: 15.6, act: { kind: 'spawn', recipeId: 'double' } },
  { at: 23.0, act: { kind: 'bin', id: 'patty' } },
  { at: 23.2, act: { kind: 'grill', slot: 1 } },
  { at: 26.0, act: { kind: 'bin', id: 'patty' } },
  { at: 26.2, act: { kind: 'grill', slot: 0 } },
  { at: 27.0, act: { kind: 'bin', id: 'tomato' } },
  { at: 27.2, act: { kind: 'board' } },
];

function setTickets(world, recipeIds) {
  world.state.orders = [];
  for (const recipeId of recipeIds) world.spawnOrder(recipeId);
}

/**
 * Set `world` to the named scene and return the screen to draw over it, the best
 * score to show and, for the end scene, a hand hovering over the plate.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    setTickets(world, ['classic', 'melt', 'garden']);
    runScript(world, SERVE_CLASSIC.slice(0, 8), 6);
    return { screen: SCREEN_PLAY, best: 0, mouse: null };
  }

  setTickets(world, ['classic', 'melt', 'garden']);
  runScript(world, [...SERVE_CLASSIC, ...BUILD_GARDEN], 30);
  if (name !== 'end') {
    return { screen: SCREEN_PLAY, best: world.state.coins, mouse: null };
  }

  // Finish the Garden Stack, serve it, then stage the final rush: 9 seconds left,
  // one ticket about to walk out, and a finished Double Trouble on the plate with
  // the serve window glowing green, ready to ring.
  runScript(world, [
    { at: 0.4, act: { kind: 'board' } },
    { at: 0.6, act: { kind: 'plate' } },
    { at: 0.8, act: { kind: 'serve' } },
  ], 1);
  world.state.timeLeft = 9;
  setTickets(world, ['double', 'melt']);
  world.state.orders[0].patience = 8;
  world.state.orders[0].maxPatience = 45;
  world.state.orders[1].patience = 22;
  world.state.grill = [{ item: 'patty', t: 5.5 }, null];
  world.state.boardSlot = null;
  // The Double Trouble is finished on the plate, so the serve window glows green:
  // the one frame in the set where a plate is ready to serve.
  world.state.plate = ['bun', 'patty', 'patty', 'cheese'];
  world.state.hand = null;
  world.state.popups = [{ text: 'Final rush!', x: 1084, y: 345, ttl: 1.6, color: '#f7c948' }];
  return { screen: SCREEN_PLAY, best: world.state.coins, mouse: null };
}
