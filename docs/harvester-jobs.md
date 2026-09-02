# Harvester Jobs: Researcher, Scribe, Wisteria Farmer

Reference for the three jobs whose colonist leaves a workstation to visit nearby
sources. Derived from Colony Survival **0.18.0.0**, dedicated-server assembly,
cross-checked against `baseconfig/` and `settings/server.json`.
See [movement.md](movement.md) for speed and access rules, and
[../CALCULATOR_CHANGES.md](../CALCULATOR_CHANGES.md) for the resulting data edits.

## How this was derived

Decompiled with `ilspycmd` (command in [movement.md](movement.md)); file references
are paths inside that output. Cycle times were **verified by simulation**, not
algebra: the state machines in `OnNPCAtJob` were transcribed and run, and layouts were
solved with Dijkstra over a real grid (8-way, 1.42 diagonals, no corner-cutting,
sources as obstacles, orthogonal-only stand cells, nearest-first targeting) —
exhaustively for the crafters, annealing plus hill-climbing for wisteria.

---

## Summary

| Job             | Item             | `createTime` | Output/day | Sources needed                         |
| --------------- | ---------------- | ------------ | ---------- | -------------------------------------- |
| Researcher      | `scientificnote` | **90.1**     | 4.93       | 12 bookcases (14 with eyeglasses)      |
| Scribe          | `tabletwisdom`   | **80.0**     | 5.55       | 13 scroll shelves (15 with eyeglasses) |
| Wisteria Farmer | `wisteriaflower` | **18.5**     | 24.0       | 25 wisteria plants                     |

Naming note: the **Writer** is a plain crafter that never leaves its desk. It makes
bookcases and scroll shelves as placeable items. The jobs that travel are the three above.

## 1. Time constants

At `GameTimeScale: 120`, one game-hour is `3600 / 120` = **30 real seconds**.

| Period               | Bounds                                     | Game-h | Real s  |
| -------------------- | ------------------------------------------ | ------ | ------- |
| **Working day**      | `SleepTimeEnd 4.5` → `SleepTimeStart 19.3` | 14.8   | **444** |
| Daylight             | `DayTimeStart 4.5` → `DayTimeEnd 19.5`     | 15.0   | 450     |
| Full day/night cycle | 24 h                                       | 24.0   | **720** |

Work is gated by `ShouldSleep` (`TimeCycle.cs:317`), not the sun — every job settings
class inherits `ToSleep => TimeCycle.ShouldSleep`
(`Jobs/BlockJobSettingsSpawnableDefault.cs:14`) and `BlockJobInstance.OnNPCUpdate:119`
sends the colonist to bed the moment it flips. Colonists wake at sunrise but stop
0.2 game-hours before sunset, so they work **444** of the 450 daylight seconds.

`SleepTimeStart`/`SleepTimeEnd` are both the `[DefaultValue]` attributes on
`ServerManager.TimeSettings` and this world's `server.json`, so 444 is stock.

## 2. Researcher & Scribe — the charge mechanic

Both are the _same implementation_: `Jobs/BlockJobLoader.cs:149` constructs one
`ResearcherSettings` for any job with the `craftingblockresearcher` behaviour. Same
state machine, same cooldowns; only the recipe and source type differ.

**One shelf visit = one charge = one craft.** The colonist walks to the nearest shelf
with stock, consumes a charge (`BookcasePower++`), returns to the desk, crafts, then
delivers to the crate.

### Shelf regrowth

From `generateblocks_bookcases.json` (and the identical `generateblocks_scrollshelves.json`),
cumulative growth-hours per stage:

```json
"stages": [ {"growthhours": 66},  {"growthhours": 120},
            {"growthhours": 162}, {"growthhours": -1} ]
```

`TryConsumeGrowth` (`BlockEntities.Implementations/Bookcases.cs:100`) subtracts the
stage _width_, so the three charges cost **42, 54, 66** growth-hours — 162 total,
averaging 54 game-h = **1620 real seconds per charge**. Growth accrues on real elapsed
time, so it continues overnight:

```
0.4444 charges per shelf per 24 h cycle   (720 / 1620)
```

That is what sets the source counts: `ceil(crafts_per_day / 0.4444)`.

### Cycle

Recipe cooldowns are 85 s (`recipes_researcher.json`) and 75 s (`recipes_scribe.json`).
Crafts longer than 15 s are split into `Random(8,12)`-second slices, but each slice's
cooldown equals its progress increment, so **chunking is time-neutral**. A part-finished
craft persists on the instance and resumes the next morning.

| Component           | Seconds         | Source                                         |
| ------------------- | --------------- | ---------------------------------------------- |
| Recipe cooldown     | 85 / 75         | recipe JSON — _exact_                          |
| Search + path-found | 0.65            | `SetCooldown(0.3,0.6)` + `(0.1,0.3)` — _exact_ |
| Shelf consume       | 2.25            | `SetCooldown(1.5,3.0)` — _exact_               |
| Crate dump          | 0.30            | `SetCooldown(0.2,0.4)` — _exact_               |
| Crate round trip    | 0.70            | solved layout, paved                           |
| Shelf walk          | **0**           | see below                                      |
| **Cycle**           | **88.9 / 78.9** |                                                |

The solved optimum puts **three shelf columns on the three free orthogonal neighbours
of the desk's standing cell**, with the crate on the fourth. The colonist reaches a
shelf without moving; the crate is the only walking in the cycle. Columns are
base + 4 tall — `ResearcherSettings.OnNPCAtJob` scans `i = 1; i <= 4` above the
landmark — so one ground cell holds **5** shelves.

### Eyeglasses

`craftingspeed: 1.2` applies to the craft step only, and the item carries 7200 s of
tool time (~100 crafts, ~17 working days between Tool Shop visits — immaterial).

**The multiplier only pays off if the shelf count rises with it.** Shelves regrow at a
fixed rate, so a faster colonist drains them sooner: Researcher 12 → 14, Scribe 13 → 15.
Give a Researcher eyeglasses and leave it at 12 bookcases and output does not move —
it becomes shelf-starved instead of craft-limited. The recipe schema cannot express this.

## 3. Wisteria Farmer — direct harvest

A separate implementation (`Jobs.Implementations.Wisteria`) with no recipe, no charge
system and no toolset. It walks to the nearest grown plant, harvests it, and carries
the flower home.

### Harvesting costs 13–18 s

The drop is guaranteed (`"chance": 1`), so the failure branch `SetCooldown(num3)` is
dead code — but that does **not** make `harvestTime` cosmetic. The surviving branch
applies the same value through the indicator call's default argument:

```csharp
// WisteriaSettings.OnNPCAtJob — no second argument
state.SetIndicator(IndicatorState.NewItemIndicator(num3, item.Type));

// NPC/NPCBase.cs:155
public void SetIndicator(IndicatorState state, bool setcooldown = true) {
    if (setcooldown) CooldownTill = state.TimeToShowIndicator.ToTimeStamp();
```

`num3` is `Random(harvestTimeMin, harvestTimeMax)` = **13–18 s, mean 15.5** — about
85% of the cycle. **The harvest action, not travel, is the bottleneck.**

### Regrowth: once per night

`growables.json` registers wisteria as `FirstNightRandom`. `GetRandomGrowthTillNight`
picks a uniform moment between sunset+0.2 h and sunrise−0.2 h and counts down;
`TryAdvanceStage` stops tracking at the final stage. So **a plant yields at most one
flower per day**, and every plant is ripe at dawn.

### Two flowers per crate trip

`ShouldTakeItems` is set only when the inventory was _already_ non-empty before the add,
so the farmer banks one flower, harvests a second, then delivers — halving delivery
overhead.

### Cycle

| Component              | Seconds  | Source                                         |
| ---------------------- | -------- | ---------------------------------------------- |
| Harvest cooldown       | 15.5     | `harvestTimeMin/Max` 13–18 — _exact_           |
| Search + path-found    | 0.45     | `SetCooldown(0.1,0.4)` + `(0.1,0.3)` — _exact_ |
| Crate trip, amortised  | 0.50     | one trip per two flowers, crate adjacent       |
| Walk to plant and back | 1.67     | solved layout, paved                           |
| **Cycle**              | **18.1** |                                                |

**16.1 of those 18.1 seconds (89%) are exact constants**; only the walk is modelled.
The zero-travel ceiling is `444 / 15.95` = **27.8/day**, which no layout can beat.

### Grove size

Output climbs one-for-one with plant count, then **plateaus** — the farmer walks to the
_nearest available_ plant (`TryFindClosestLandmark`), so surplus plants are simply never
visited:

| Plants      | 20   | 22   | 24   | **25**   | 30   | 40   |
| ----------- | ---- | ---- | ---- | -------- | ---- | ---- |
| Flowers/day | 20.0 | 22.0 | 24.0 | **24.5** | 24.5 | 24.5 |

**25 plants is the smallest count that reaches the plateau.** The solved layout is
one-wide corridors fanning out from the workstation with plants lining both sides.

## 4. Per-day overhead

Cycle time is not the whole story. Two costs land once per working day, outside any cycle:

- **The dawn walk from bed.** `ToSleep` flips at 19.3, so the evening walk is after hours
  and free. Only the morning walk costs work time, and it is one-way.
- **One grocery-store round trip.** `NPCBase.CalculateNextNPCShopVisitTime(4.5, 19.3)`
  schedules it at a uniform random moment inside the next working day — exactly one trip
  per day, plus `Random(1,3)` s at the shop.

With sources compact, the bed and shop sit just outside them:

| bed / shop | overhead/day | `wisteriaflower` | `scientificnote` | `tabletwisdom` |
| ---------- | ------------ | ---------------- | ---------------- | -------------- |
| 3 / 4      | 5.8 s        | 18.4             | 90.1             | 80.0           |
| 6 / 7      | 9.0 s        | 18.5             | 90.7             | 80.5           |
| 20 / 20    | 22.9 s       | 19.1             | 93.7             | 83.2           |

This costs **1.3–2.1%** in a tight town, ~5% in a sprawling one. It is systematic and
one-directional — it can only lower output — so omitting it biases every figure the same
way. The headline values include it at tight-town distances.

## 5. Assumptions and limits

- **Best case throughout**: paved walkways at 2.88 blocks/s, crate adjacent, optimal
  source placement, uninterrupted inputs, one colonist per workstation. Bare dirt/grass
  (2.09) costs a few percent more.
- **Output plateaus, it never declines.** Surplus sources are never visited, so building
  past the plateau is wasted — the next colonist needs their own workstation.
- **Standing infrastructure is invisible to the recipe schema.** Shelves and plants are
  one-time placements, not per-craft inputs, so `createTime` silently assumes the player
  has built them. Under-build and real output falls short.
- **Day-to-day variance**: wisteria's harvest is a fresh `uniform(13,18)` roll, giving
  ~±1.6% on the daily total over ~24 harvests. No layout removes that.
- **Not analysed**: the Forester. `log`/`leaves` at 44/day is inferred from a hardcoded
  converter value, not measured.
