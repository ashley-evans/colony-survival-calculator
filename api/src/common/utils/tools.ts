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

function getMinimumDefaultTool(items: RequiredToolFields[]): DefaultToolset {
    if (items.every(({ toolset }) => toolset.type !== "default")) {
        return DefaultToolset.none;
    }

    return items.reduce((acc, current) => {
        if (current.toolset.type === "default") {
            acc = getLowestToolWithRangeTool(acc, current.toolset.minimumTool);
        }
        return acc;
    }, DefaultToolset.steel as DefaultToolset);
}

function getMinimumEyeglassesTool(items: RequiredToolFields[]): GlassesToolset {
    if (items.every(({ toolset }) => toolset.type !== "glasses")) {
        return GlassesToolset.no_glasses;
    }

    return items.reduce((acc, current) => {
        if (current.toolset.type === "glasses") {
            acc = getLowestToolWithRangeTool(acc, current.toolset.minimumTool);
        }
        return acc;
    }, GlassesToolset.glasses as GlassesToolset);
}

function getMachineToolsRequired(items: RequiredToolFields[]): boolean {
    return items.some(({ toolset }) => toolset.type === "machine");
}

function getMinimumToolWithinGroup(items: RequiredToolFields[]): MinimumTools {
    return {
        minimumDefault: getMinimumDefaultTool(items),
        minimumEyeglasses: getMinimumEyeglassesTool(items),
        needsMachineTools: getMachineToolsRequired(items),
    };
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
    minimum: DefaultToolset,
    available: DefaultToolset
): boolean;
function isAvailableToolWithRangeSufficient(
    minimum: GlassesToolset,
    available: GlassesToolset
): boolean;
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
    hasMachineTools: boolean,
    hasEyeglasses: boolean
): { hasRequired: true } | { hasRequired: false; requiredTool: AllToolsets } {
    const { minimumDefault, needsMachineTools, minimumEyeglasses } =
        getMinimumToolRequired(items);
    if (!isAvailableToolWithRangeSufficient(minimumDefault, maxAvailableTool)) {
        return { hasRequired: false, requiredTool: minimumDefault };
    }

    if (needsMachineTools && !hasMachineTools) {
        return { hasRequired: false, requiredTool: MachineToolset.machine };
    }

    if (
        !isAvailableToolWithRangeSufficient(
            minimumEyeglasses,
            hasEyeglasses ? GlassesToolset.glasses : GlassesToolset.no_glasses
        )
    ) {
        return { hasRequired: false, requiredTool: minimumEyeglasses };
    }

    return { hasRequired: true };
}

export {
    getMinimumToolRequired,
    isAvailableToolWithRangeSufficient,
    isAvailableToolSufficient,
    hasMinimumRequiredTools,
    MinimumTools,
};
