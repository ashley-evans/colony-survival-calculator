import { ToolModifierValues } from "..";
import { AllToolsets, DefaultToolset, Item, MachineToolset } from "../../types";
import { groupItemsByID } from "./items";

type RequiredToolFields = Pick<Item, "id" | "toolset">;
type MinimumTools = {
    minimumDefault: DefaultToolset;
    needsMachineTools: boolean;
};

function getHighestDefaultTool(
    a: DefaultToolset,
    b: DefaultToolset,
): DefaultToolset {
    return ToolModifierValues[a] > ToolModifierValues[b] ? a : b;
}

function getLowestDefaultTool(
    a: DefaultToolset,
    b: DefaultToolset,
): DefaultToolset {
    return ToolModifierValues[a] < ToolModifierValues[b] ? a : b;
}

function getMinimumToolWithinGroup(group: RequiredToolFields[]): MinimumTools {
    if (group.length === 1) {
        const item = group[0] as RequiredToolFields;
        return item.toolset.type === "machine"
            ? {
                  needsMachineTools: true,
                  minimumDefault: "none" as DefaultToolset,
              }
            : {
                  needsMachineTools: false,
                  minimumDefault: item.toolset.minimumTool,
              };
    }

    let minimumDefault = "steel" as DefaultToolset;
    let needsMachineTools = false;
    for (const { toolset } of group) {
        if (toolset.type === "machine") {
            needsMachineTools = true;
            continue;
        }

        minimumDefault = getLowestDefaultTool(
            minimumDefault,
            toolset.minimumTool,
        );
    }

    return { minimumDefault, needsMachineTools };
}

function getMinimumToolRequired(items: RequiredToolFields[]): MinimumTools {
    let minimumDefault = "none" as DefaultToolset;
    let needsMachineTools = false;

    const grouped = groupItemsByID(items);
    for (const group of Array.from(grouped.values())) {
        const groupMin = getMinimumToolWithinGroup(group);
        if (groupMin.needsMachineTools) {
            needsMachineTools = true;
        }

        minimumDefault = getHighestDefaultTool(
            minimumDefault,
            groupMin.minimumDefault,
        );
    }

    return { minimumDefault, needsMachineTools };
}

function isAvailableDefaultToolSufficient(
    minimum: DefaultToolset,
    available: DefaultToolset,
): boolean {
    const minimumToolModifier = ToolModifierValues[minimum];
    const availableToolModifier = ToolModifierValues[available];
    return availableToolModifier >= minimumToolModifier;
}

function isAvailableToolSufficient({
    available,
    hasMachineTools,
    hasEyeglasses,
    item,
}: {
    available: DefaultToolset;
    hasMachineTools: boolean;
    hasEyeglasses: boolean;
    item: Pick<Item, "toolset">;
}) {
    if (item.toolset.type === "machine") {
        return hasMachineTools;
    }

    if (item.toolset.type === "eyeglasses") {
        if (item.toolset.minimumTool === "eyeglasses" && !hasEyeglasses) {
            return false;
        }

        return true;
    }

    return isAvailableDefaultToolSufficient(
        item.toolset.minimumTool,
        available,
    );
}

function hasMinimumRequiredTools(
    items: RequiredToolFields[],
    maxAvailableTool: DefaultToolset,
    hasMachineTools: boolean,
): { hasRequired: true } | { hasRequired: false; requiredTool: AllToolsets } {
    const { minimumDefault, needsMachineTools } = getMinimumToolRequired(items);
    if (needsMachineTools && !hasMachineTools) {
        return {
            hasRequired: false,
            requiredTool: "machine" as MachineToolset,
        };
    } else if (
        !isAvailableDefaultToolSufficient(minimumDefault, maxAvailableTool)
    ) {
        return { hasRequired: false, requiredTool: minimumDefault };
    }

    return { hasRequired: true };
}

export {
    getMinimumToolRequired,
    isAvailableDefaultToolSufficient,
    isAvailableToolSufficient,
    hasMinimumRequiredTools,
};
