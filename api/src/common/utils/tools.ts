import { ToolModifierValues } from "..";
import {
    AllToolsets,
    AvailableTools,
    DefaultToolset,
    EyeglassesToolset,
    Item,
    MachineToolset,
} from "../../types";
import { groupItemsByID } from "./items";

type RequiredToolFields = Pick<Item, "id" | "toolset">;
type MinimumTools = {
    minimumDefault: DefaultToolset;
    needsMachineTools: boolean;
    needsEyeglasses: boolean;
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
    let minimumDefault: DefaultToolset | undefined;
    let needsMachineTools = false;
    let needsEyeglasses = false;
    for (const { toolset } of group) {
        if (toolset.type === "machine") {
            needsMachineTools = true;
            continue;
        }

        if (toolset.type === "eyeglasses") {
            needsEyeglasses = true;
            continue;
        }

        minimumDefault = minimumDefault
            ? getLowestDefaultTool(minimumDefault, toolset.minimumTool)
            : toolset.minimumTool;
    }

    return {
        minimumDefault: minimumDefault ?? ("none" as DefaultToolset),
        needsMachineTools,
        needsEyeglasses,
    };
}

function getMinimumToolRequired(items: RequiredToolFields[]): MinimumTools {
    let minimumDefault = "none" as DefaultToolset;
    let needsMachineTools = false;
    let needsEyeglasses = false;
    const grouped = groupItemsByID(items);
    for (const group of Array.from(grouped.values())) {
        const groupMin = getMinimumToolWithinGroup(group);
        if (groupMin.needsMachineTools) {
            needsMachineTools = true;
        }

        if (groupMin.needsEyeglasses) {
            needsEyeglasses = true;
        }

        minimumDefault = getHighestDefaultTool(
            minimumDefault,
            groupMin.minimumDefault,
        );
    }

    return { minimumDefault, needsMachineTools, needsEyeglasses };
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
    item,
}: {
    available: AvailableTools;
    item: Pick<Item, "toolset">;
}) {
    if (item.toolset.type === "machine") {
        return available.machine;
    }

    if (item.toolset.type === "eyeglasses") {
        if (
            item.toolset.minimumTool === "eyeglasses" &&
            !available.eyeglasses
        ) {
            return false;
        }

        return true;
    }

    return isAvailableDefaultToolSufficient(
        item.toolset.minimumTool,
        available.default,
    );
}

function hasMinimumRequiredTools(
    items: RequiredToolFields[],
    availableTools: AvailableTools,
): { hasRequired: true } | { hasRequired: false; requiredTool: AllToolsets } {
    const { minimumDefault, needsMachineTools, needsEyeglasses } =
        getMinimumToolRequired(items);
    if (needsMachineTools && !availableTools.machine) {
        return {
            hasRequired: false,
            requiredTool: "machine" as MachineToolset,
        };
    } else if (needsEyeglasses && !availableTools.eyeglasses) {
        return {
            hasRequired: false,
            requiredTool: "eyeglasses" as EyeglassesToolset,
        };
    } else if (
        !isAvailableDefaultToolSufficient(
            minimumDefault,
            availableTools.default,
        )
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
