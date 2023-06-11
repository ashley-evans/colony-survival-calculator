import {
    ToolModifierValues,
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { Item, Items, Tools } from "../../../types";

function calculateCreateTime(
    item: Pick<Item, "maximumTool" | "createTime">,
    availableTool: Tools
) {
    const toolModifier = getMaxToolModifier(item.maximumTool, availableTool);
    return item.createTime / toolModifier;
}

function calculateOutput(
    item: Pick<Item, "maximumTool" | "createTime" | "output">,
    maxAvailableTool: Tools
): number {
    return item.output / calculateCreateTime(item, maxAvailableTool);
}

function filterByMinimumTool(items: Items): Items {
    const itemMap = new Map<string, Item>();
    for (const item of items) {
        const currentOptimalItem = itemMap.get(item.name);
        if (!currentOptimalItem) {
            itemMap.set(item.name, item);
            continue;
        }

        if (
            ToolModifierValues[item.minimumTool] <
            ToolModifierValues[currentOptimalItem.minimumTool]
        ) {
            itemMap.set(item.name, item);
        }
    }

    return Array.from(itemMap.values());
}

function filterByOptimal(items: Items, maxAvailableTool: Tools): Items {
    const itemMap = new Map<string, Item>();

    for (const item of items) {
        if (!isAvailableToolSufficient(item.minimumTool, maxAvailableTool)) {
            continue;
        }

        const currentOptimalItem = itemMap.get(item.name);
        if (!currentOptimalItem) {
            itemMap.set(item.name, item);
            continue;
        }

        const currentOptimalOutput = calculateOutput(
            currentOptimalItem,
            maxAvailableTool
        );
        const itemOutput = calculateOutput(item, maxAvailableTool);

        if (itemOutput > currentOptimalOutput) {
            itemMap.set(item.name, item);
        }
    }

    return Array.from(itemMap.values());
}

function getLowestRequiredTool(items: Items): Tools {
    let currentLowestTool = Tools.none;
    for (const item of items) {
        if (
            ToolModifierValues[item.minimumTool] >
            ToolModifierValues[currentLowestTool]
        ) {
            currentLowestTool = item.minimumTool;
        }
    }

    return currentLowestTool;
}

export {
    calculateCreateTime,
    calculateOutput,
    filterByMinimumTool,
    filterByOptimal,
    getLowestRequiredTool,
};
