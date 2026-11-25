# Sizzle & Serve — a fast kitchen game

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/museshiro/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/museshiro/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

Entry for the [best cooking game bounty on make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137).

## The game

You run a tiny burger kitchen on a 150-second shift. Tickets land on the order
board with a patience bar; cook each one before the customer walks out.

- **Grab** an ingredient from the bins (click, or keys 1–6).
- **Grill** the patty — cooked is perfect, leave it too long and it burns.
- **Chop** lettuce and tomato on the chopping board.
- **Stack** the plate to match a ticket, then **ring the bell** to serve.
- Serve fast for a tip; serve again within 8 seconds to build a combo.
- A missed ticket costs a heart. Three walk-outs, or the end of the shift, ends the run.

Four recipes on the menu — Classic Burger, Cheese Melt, Garden Stack, Double
Trouble — and the tickets speed up as the shift wears on.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Plain static files under `game/` — no build step, no network, desktop Chrome.
`main.ts` (Node 22, standard library only) hands the game in: it copies `game/`
and `screenshots/` to `/output` and writes `/output/dossier.json` with the
vendored `vendor/makefun-game.ts` library.
