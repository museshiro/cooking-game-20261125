// Every tuning number, colour and layout rect in one place. The kitchen is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts this long; when the clock hits zero the results screen shows. */
export const SHIFT_SECONDS = 150;

export const HEARTS = 3;

/** Seconds a raw patty needs on the grill before it is cooked, and before it burns. */
export const COOK_SECONDS = 6;
export const BURN_SECONDS = 12;

/** Seconds on the chopping board before lettuce or tomato is chopped. */
export const CHOP_SECONDS = 3;

/** Seconds an order waits before the customer walks out. */
export const PATIENCE_SECONDS = 45;

/** Orders arrive this often at first, faster as the shift wears on. */
export const SPAWN_FIRST = 11;
export const SPAWN_LAST = 6.5;

/** Serving again within this many seconds of the last serve keeps the combo alive. */
export const COMBO_WINDOW = 8;

/** At most this many tickets can wait on the order board at once. */
export const MAX_ORDERS = 4;

/** The ingredients. A patty must be grilled, lettuce and tomato must be chopped;
 *  bun, cheese and sauce go on the plate as they are. */
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8a85c', dark: '#b97f36' },
  { id: 'patty', name: 'Patty', key: '2', color: '#8a4b2d', dark: '#5d2f1a' },
  { id: 'lettuce', name: 'Lettuce', key: '3', color: '#7bc043', dark: '#4e8a26' },
  { id: 'tomato', name: 'Tomato', key: '4', color: '#e2483d', dark: '#a92c24' },
  { id: 'cheese', name: 'Cheese', key: '5', color: '#f7c948', dark: '#d9a41f' },
  { id: 'sauce', name: 'Sauce', key: '6', color: '#f08a1d', dark: '#b95f0b' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

/** The menu: each recipe is the exact multiset of ingredients one ticket asks for. */
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty', 'lettuce', 'tomato'], reward: 16 },
  { id: 'melt', name: 'Cheese Melt', items: ['bun', 'patty', 'cheese', 'sauce'], reward: 18 },
  { id: 'garden', name: 'Garden Stack', items: ['bun', 'lettuce', 'tomato', 'cheese'], reward: 14 },
  { id: 'double', name: 'Double Trouble', items: ['bun', 'patty', 'patty', 'cheese'], reward: 22 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));

/** Where everything sits in the kitchen, in logical pixels. */
export const LAYOUT = {
  hud: { x: 0, y: 0, width: 1280, height: 56 },
  orderBoard: { x: 24, y: 64, width: 1232, height: 92 },
  ticket: { width: 292, height: 84, gap: 12 },
  bins: { x: 24, y: 176, width: 170, height: 56, gapX: 8, gapY: 8, cols: 3 },
  menu: { x: 24, y: 330, width: 526, height: 230 },
  grill: { x: 592, y: 176, width: 288, height: 154 },
  grillSlot: { width: 128, height: 96, gap: 16 },
  chopBoard: { x: 912, y: 176, width: 344, height: 154 },
  plate: { x: 592, y: 360, width: 288, height: 200 },
  serve: { x: 912, y: 360, width: 344, height: 200 },
  trash: { x: 24, y: 600, width: 170, height: 76 },
  hints: { x: 210, y: 600, width: 1046, height: 76 },
};

export const PALETTE = {
  backdrop: '#241a12',
  wall: '#3a2a1c',
  wallTrim: '#54381f',
  floor: '#2e2115',
  floorLine: '#3d2d1d',
  counter: '#7a5230',
  counterTop: '#a06b3f',
  counterEdge: '#5d3a1e',
  steel: '#9aa5ad',
  steelDark: '#6e7a83',
  grill: '#3c3f45',
  board: '#d9b380',
  plate: '#f4f1e6',
  paper: '#fff8e7',
  paperEdge: '#e0cfa8',
  ink: '#2b2118',
  text: '#fff3df',
  muted: '#c9a67a',
  gold: '#f7c948',
  red: '#e2483d',
  green: '#7bc043',
  panel: '#2f2115',
  panelEdge: '#57402a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
