# Colony Survival Recipe Converter

## Requirements

Requires the following Colony Survival files to be placed in a single folder for reading:

-   `toolsets.json`
-   `generateblocks.json`
-   All `recipes_*.json` files
-   `types.json`
-   `growables.json`

This can be found in Colony Survival's steam folder.

### Known limitations

The following amendments must be made to the Colony Survival files before executing the script:

Berry farmer recipe needs to be manually updated as does not follow same naming convention as other recipes

-   Update: `gather` to `berry`
-   Update creator: `berry` to `berryfarmer`

Engineer's elevator recipe needs to be manually updated to align result type and name:

-   Update: `elevatorstation` to `elevator`

Grinder's flour pot recipe needs to be manually duplicated to have:

-   One entry for: `potflour` (1), with optional output `straw` (1)
-   One entry for: `straw` (1), with optional output `potflour` (1)

Job block crafter's copper anvil recipe needs to be manually updated to align result type and name:

-   Update: `anvil` to `copperanvil`

Advanced job block crafter's bookcase recipe needs to be manually updated to align result type and name:

-   Update: `bookcasefilled` to `bookcase`

Potter's empty pot recipe needs to be manually updated to align result type and name:

-   Update: `emptypot` to `potempty`

Stone mason's stone bricks recipe needs to be manually updated to remove duplicate;

-   Remove entry with name: `stonebricksnew`

Tanner's process recipe needs to be manually duplicated to have:

-   One entry for: `skin` (3), with optional output `rawmeat` (1)
-   One entry for: `rawmeat` (1), with optional output `skin` (3)

Tinkerer's recipe's needs to be updated to:

-   Only include one planks recipe, remove entry for: `plankstiaga`
-   Only include one tinkerer table recipe, remove entry for: `tinkerertabletaiga`
-   Align result type and name for: slinger jobs:
    -   Update: `slingday` to: `guardslingerdayjob`
    -   Update: `slingnight` to: `guardslingernightjob`
-   Only include one splitting stump recipe, remove entry for: `splittingstumptaiga`

Woodcutters' recipe's needs to be updated to:

-   Only include one planks recipe, remove entry for: `plankstiaga`

Mineable items file (`types.json`) needs to be updated to only include one stone rubble mining recipe, remove entry for `darkstone`

## Running the script

To produce a converted JSON list applicable for use by the backend, execute the following command:

```bash
yarn convert -i INSERT_PATH_TO_COLONY_SURVIVAL_FILES_FOLDER -o items.json
```
