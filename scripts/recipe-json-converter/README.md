# Colony Survival Recipe Converter

## Requirements

Requires the following Colony Survival files to be placed in a folder for reading:

- `toolsets.json`
- All `generateblocks*.json`
- All `recipes_*.json` files
- All localisation files
    - Keep in a nested folder
- `types.json`
- `growables.json`

This can be found in Colony Survival's steam folder.

## Known limitations (new)

The following amendments must be made to the Colony Survival files before executing the script:

Remove `modInfo.json` from localisation files if present
Rename `ua-UA.json` localisation file to `uk-UA.json`

Artist's recipe's needs to be updated to:

- Rename all usages of `sign` to `signitem`

Berry farmer recipe's need to be updated to:

- Update: `gather` to `berry`
- Update creator: `berry` to `berryfarmer`

Composter's recipe's need to be updated to:

- Replace all usages of `leavestemperate` with `leaves`

Coppersmith's recipe's need to be updated to:

- Align result type and names for failsafe recipe:
    - Update `failsafe3` to `failsafe`

Engineer's recipe's needs to be updated to:

- Align result type and names for lantern recipe:
    - Including updating `lanternitem` result to `lantern`
- Align result type and names for elevator recipe:
    - Update `elevatorstation` to `elevator`
- Align result type and names for shaped charge recipe:
    - Update `bombshaped` to `bombshapedchargedown`
- Align result type and names for diagonal shaped charge recipe:
    - Update `bombshapedstair` to `bombshapedchargestair`

Grinder's flour pot recipe needs to be manually duplicated to have:

- One entry for: `potflour` (1), with optional output `straw` (1)
- One entry for: `straw` (1), with optional output `potflour` (1)

Job block crafter's recipes need to be updated to:

- Align result type and names for merchant hub recipe:
    - Update `merchanthub2` to `merchanthub`
- Align result type and names for tool shop recipe:
    - Update `toolshop2` to `toolshop`
- Align result type and names for grocery store recipe:
    - Update `npcshop2` to `npcshop`
- Align result type and names for copper anvil recipe recipe:
    - Update: `anvil` to `copperanvil`

Advanced job block crafter's recipes need to be updated to:

- Replace all usages of `leavestemperate` with `leaves`
- Align result type and name for bookcase recipe:
    - Update: `bookcase` to `bookcasefilled`

Potter's recipes need to be updated to:

- Align result type and name for empty pot recipe:
    - Update: `emptypot` to `potempty`

Stone mason's recipes need to be updated to:

- Align result type and names for grey quarter block recipe:
    - Update `quarterblockgreyitem` to `quarterblockgrey`

Tailor's recipe's need to be updated to:

- Rename all creator names from `tailorshop` to `tailor`

Tanner's process recipe needs to be manually duplicated to have:

- One entry for: `skin` (3), with optional output `rawmeat` (1)
- One entry for: `rawmeat` (1), with optional output `skin` (3)

Tinkerer's recipe's needs to be updated to:

- Only include one planks recipe:
    - Remove entry for `plankstiaga`
    - Rename `logtemperate` requirement to `log`
- Only include one tinkerer table recipe:
    - Remove entry for: `tinkerertabletaiga`
    - Rename `logtemperate` requirement to `log`
- Align result type and name for: slinger jobs:
    - Update: `slingday` to: `guardslingerdayjob`
    - Update: `slingnight` to: `guardslingernightjob`
- Only include one splitting stump recipe:
    - Remove entry for: `splittingstumptaiga`
    - Rename `logtemperate` requirement to `log`

Woodcutters' recipe's needs to be updated to:

- Only include one planks recipe:
    - Remove entry for: `plankstiaga`
- Rename all references to `logtemperate` to `log`
- Align result type and names for dark brown quarter block recipe:
    - Update `quarterblockbrowndarkitem` to `quarterblockbrowndark`
- Align result type and names for light brown quarter block recipe:
    - Update `quarterblockbrownlightitem` to `quarterblockbrownlight`

Mineable items file (`types.json`) needs to be updated to:

- Only include one stone rubble mining recipe, remove entry for `darkstone`

### Known limitations

## Running the script

To produce a converted JSON list applicable for use by the backend, execute the following command:

```bash
yarn convert -i INSERT_PATH_TO_COLONY_SURVIVAL_FILES_FOLDER -o items.json
```
