import { ToolModifierValues } from "..";
import {
    AllToolsets,
    DefaultToolset,
    GlassesToolset,
    Item,
    MachineToolset,
} from "../../types";
import { groupItemsByName } from "./items";

type RequiredToolFields = Pick<Item, "name" | "toolset">;
type MinimumTools = {
    minimumDefault: DefaultToolset;
    minimumEyeglasses: GlassesToolset;
    needsMachineTools: boolean;
};

function getHighestToolWithRangeTool(
    a: DefaultToolset,
    b: DefaultToolset
): DefaultToolset;
function getHighestToolWithRangeTool(
    a: GlassesToolset,
    b: GlassesToolset
): GlassesToolset;
function getHighestToolWithRangeTool(
    a: DefaultToolset | GlassesToolset,
    b: DefaultToolset | GlassesToolset
): DefaultToolset | GlassesToolset {
    return ToolModifierValues[a] > ToolModifierValues[b] ? a : b;
}

function getLowestToolWithRangeTool(
    a: DefaultToolset,
    b: DefaultToolset
): DefaultToolset;
function getLowestToolWithRangeTool(
    a: GlassesToolset,
    b: GlassesToolset
): GlassesToolset;
function getLowestToolWithRangeTool(
    a: DefaultToolset | GlassesToolset,
    b: DefaultToolset | GlassesToolset
): DefaultToolset | GlassesToolset {
    return ToolModifierValues[a] < ToolModifierValues[b] ? a : b;
}

function getMinimumToolWithinGroup(group: RequiredToolFields[]): MinimumTools {
    if (group.length === 1) {
        const item = group[0] as RequiredToolFields;

        switch (item.toolset.type) {
            case "machine":
                return {
                    needsMachineTools: true,
                    minimumDefault: DefaultToolset.none,
                    minimumEyeglasses: GlassesToolset.no_glasses,
                };
            case "glasses":
                return {
                    needsMachineTools: false,
                    minimumDefault: DefaultToolset.none,
                    minimumEyeglasses: item.toolset.minimumTool,
                };
            case "default":
                return {
                    needsMachineTools: false,
                    minimumDefault: item.toolset.minimumTool,
                    minimumEyeglasses: GlassesToolset.no_glasses,
                };
        }
    }

    let minimumDefault = DefaultToolset.steel;
    let minimumEyeglasses = GlassesToolset.glasses;
    let needsMachineTools = false;
    for (const { toolset } of group) {
        switch (toolset.type) {
            case "machine":
                needsMachineTools = true;
                break;
            case "glasses":
                minimumEyeglasses = getLowestToolWithRangeTool(
                    minimumEyeglasses,
                    toolset.minimumTool
                );
                break;
            case "default":
                minimumDefault = getLowestToolWithRangeTool(
                    minimumDefault,
                    toolset.minimumTool
                );
        }
    }

    return { minimumDefault, minimumEyeglasses, needsMachineTools };
}

function getMinimumToolRequired(items: RequiredToolFields[]): MinimumTools {
    let minimumDefault = DefaultToolset.none;
    let minimumEyeglasses = GlassesToolset.no_glasses;
    let needsMachineTools = false;

    const grouped = groupItemsByName(items);
    for (const group of Array.from(grouped.values())) {
        const groupMin = getMinimumToolWithinGroup(group);
        if (groupMin.needsMachineTools) {
            needsMachineTools = true;
        }

        minimumEyeglasses = getHighestToolWithRangeTool(
            minimumEyeglasses,
            groupMin.minimumEyeglasses
        );

        minimumDefault = getHighestToolWithRangeTool(
            minimumDefault,
            groupMin.minimumDefault
        );
    }

    return { minimumDefault, minimumEyeglasses, needsMachineTools };
}

function isAvailableToolWithRangeSufficient(
    minimum: DefaultToolset | GlassesToolset,
    available: DefaultToolset | GlassesToolset
): boolean {
    const minimumToolModifier = ToolModifierValues[minimum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier >= minimumToolModifier;
}

function isAvailableToolSufficient(
    available: DefaultToolset,
    hasMachineTools: boolean,
    hasEyeglasses: boolean,
    item: Pick<Item, "toolset">
) {
    switch (item.toolset.type) {
        case "machine":
            return hasMachineTools;
        case "glasses":
            return isAvailableToolWithRangeSufficient(
                item.toolset.minimumTool,
                hasEyeglasses
                    ? GlassesToolset.glasses
                    : GlassesToolset.no_glasses
            );
        case "default":
            return isAvailableToolWithRangeSufficient(
                item.toolset.minimumTool,
                available
            );
    }
}

function hasMinimumRequiredTools(
    items: RequiredToolFields[],
    maxAvailableTool: DefaultToolset,
    hasMachineTools: boolean
): { hasRequired: true } | { hasRequired: false; requiredTool: AllToolsets } {
    const { minimumDefault, needsMachineTools } = getMinimumToolRequired(items);
    if (needsMachineTools && !hasMachineTools) {
        return { hasRequired: false, requiredTool: MachineToolset.machine };
    } else if (
        !isAvailableToolWithRangeSufficient(minimumDefault, maxAvailableTool)
    ) {
        return { hasRequired: false, requiredTool: minimumDefault };
    }

    return { hasRequired: true };
}

export {
    getMinimumToolRequired,
    isAvailableToolWithRangeSufficient,
    isAvailableToolSufficient,
    hasMinimumRequiredTools,
};
