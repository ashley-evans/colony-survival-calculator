# Colonist Movement & Access

Reference for how colonists move and what they can reach. Derived from Colony
Survival **0.18.0.0**, dedicated-server assembly, cross-checked against `baseconfig/`
and `settings/server.json`.

## How this was derived

The real pathfinding lives in the **server** assembly; the client only carries the
data structures. Decompiled with [ilspycmd](https://github.com/icsharpcode/ILSpy):

```bash
ilspycmd -p -o ./decompiled/Assembly-CSharp-server \
  -r "./colonyserver.app/Contents/Resources/Data/Managed" \
  "./colonyserver.app/Contents/Resources/Data/Managed/Assembly-CSharp.dll"
```

File references below are paths inside that output.

---

## 1. Speed

```
speed (blocks/sec) = 2.3 × terrainMultiplier
```

Base speed is `2.3`, from `NPC/NPCTypeStandardSettings.cs:12`. No `"npcType": "worker"`
entry in `npctypes.json` overrides it, so every colonist uses it. (Monsters set their
own, 1.7–2.0.)

The multiplier comes from a 6-slot lookup table indexed by the **destination** block's
`movementCost` (`AI/PathFinder.cs:694`, `ItemTypesServer.cs:446`):

```
index = clamp(4 − movementCost, 0, 5)      # no movementCost key → index 4
```

| `movementCost` | index | multiplier | blocks/sec | typical blocks                                             |
| -------------- | ----- | ---------- | ---------- | ---------------------------------------------------------- |
| 4              | 0     | 0.588×     | 1.35       | **bed**, water                                             |
| 3              | 1     | 0.769×     | 1.77       | —                                                          |
| 2              | 2     | 0.833×     | 1.92       | crate, crops, sand, snow, leaves                           |
| 1              | 3     | 0.909×     | 2.09       | **dirt, grass**, stone, ore                                |
| _(unset)_      | 4     | 1.0×       | 2.30       | most blocks                                                |
| −1             | 5     | 1.25×      | **2.88**   | **planks, bricks, stonebricks, woodfloor, straw, plaster** |

Two practical consequences:

- **Paving matters.** Bare dirt/grass is 2.09; any crafted floor is 2.88 — 38% faster.
- **A bed is the slowest ground in the game.** It is walkable (§3) but `movementCost: 4`
  makes crossing one **2.13× slower** than plank flooring. Never route through a dormitory.

Applied per path step in `NPC/GoalJob.cs:167` via `NPCBase.SetCooldownWalking`:
`seconds = stepDistance / (2.3 × multiplier)`.

To list every block that overrides the default, scan `baseconfig/*.json` for
`movementCost` — it appears on 116 blocks; everything else is 1.0×.

## 2. Diagonals

Colonists walk diagonally. A diagonal step costs distance **1.42** vs 1.0 orthogonal
(`AI/PathFinder.cs:1437`), and takes proportionally longer — so _speed_ is identical
either way. It is still the faster way to cover off-axis ground: one diagonal (1.42)
beats two orthogonal steps (2.0) by ~29%.

**Corner-cutting is not allowed.** Each diagonal connection depends on both flanking
orthogonals (`AI/ENavMeshNodeConnection.cs`):

```csharp
DiagonalForwardRight             = 0x1000,
DiagonalForwardRightDependencies = RightForward | ForwardForward,
```

`AI/NavMeshBaker.cs:322` bakes the diagonal only when both dependencies are present
_and_ the target is standable. A colonist cannot slip diagonally between two blocked
cells — relevant whenever sources are packed tightly.

## 3. Whether a block can be walked on

Decided by `pathingImpact`, not `movementCost`. Default when absent is _not_ walkable —
it falls back to `isSolid`, which itself defaults to `true` (`ItemTypesServer.cs:368`, `:421`).

| Property               | Test               | Meaning                       |
| ---------------------- | ------------------ | ----------------------------- |
| `IsAsAir`              | `(v & 0x10) == 0`  | walk through                  |
| `IsAsStandableSolid`   | `(v & 0x18) == 16` | walk **on top**, one level up |
| `IsAsUnstandableSolid` | `(v & 8) == 8`     | blocks                        |

| Block                            | `isSolid` | `pathingImpact`      | Result                    |
| -------------------------------- | --------- | -------------------- | ------------------------- |
| Crate                            | _(true)_  | _(none)_             | stood on top of           |
| Bed / `bedend`                   | false     | _(none)_             | walked through, at 0.588× |
| Grocery Store, Tool Shop         | false     | `AsUntouchableSolid` | **blocks**                |
| `npcblockerair`                  | false     | `AsUntouchableSolid` | **blocks** (invisible)    |
| Bookcase, scroll shelf, wisteria | false     | `AsUntouchableSolid` | **blocks**                |

`npcshop2` and `toolshop2` each auto-place four `npcblockerair` cells, which is why
those shops reserve a **2×3** footprint rather than the 2×1 they appear to occupy.

## 4. Where a colonist may stand to _use_ something

Reaching a block and using it are different questions.
`AI/NavMeshBaker.cs:686` enumerates exactly which nodes are granted a landmark:

```csharp
if (type.AllowsTopAccess)           → localPosition + (0,1,0)
if (type.AllowsNeighbourAccess)     → the four orthogonal cells, same level
if (type.AllowsLowNeighbourAccess)  → the four orthogonal cells, one level BELOW
```

**Corners never appear in that list. There is no diagonal access to anything.**

| Landmark                           | Self  | Neighbour | Low neighbour | Top | Stand where                |
| ---------------------------------- | ----- | --------- | ------------- | --- | -------------------------- |
| Crate                              | ✗     | ✓         | ✓             | ✗   | orthogonally beside        |
| Grocery Store / Tool Shop          | ✗     | ✓         | ✗             | ✗   | orthogonally beside        |
| Bed, Banner                        | **✓** | ✗         | ✗             | ✗   | on it                      |
| Bookcase / scroll shelf / wisteria | ✗     | ✓         | ✓             | ✗   | beside, or one level below |

Two traps:

- **A crate between a desk and its shelves wastes a ground tile.** Colonists walk over
  it, which puts them one level _up_, and everything worth using is `AllowTopAccess = false`.
- **A rotatable workstation has exactly one standing cell.** `GetJobLocation` returns the
  single cell in front with `AllowStandingAtOffset = false`
  (`Jobs.Implementations.Researcher/ResearcherSettings.cs:93`). Build over it, or ring the
  desk on all four sides, and the job silently stops working.

## 5. Notes

- Turning is **free** — server-side direction is set instantly (`NPC/NPCBase.cs:808`);
  the 270°/sec rotation is client-side cosmetics only.
- `SetCooldownWalking` uses the **destination** block's smoothness, not the one being
  stood on.
- The _routing_ cost table (`PathingImpactMovementCostLUT`) is separate from the _speed_
  table above: it biases which path is chosen, not how fast it is walked. Doors add a
  flat surcharge to routing only.
- All values are the shipped `baseconfig/` defaults; mods may patch `npctypes.json` or
  per-block `movementCost`.
