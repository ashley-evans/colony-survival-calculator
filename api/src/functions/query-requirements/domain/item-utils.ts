import { Graph } from "graph-data-structure";

import {
    ToolModifierValues,
    getMaxToolModifier,
    isAvailableToolSufficient,
} from "../../../common/modifiers";
import { Item, Items, Tools } from "../../../types";
import { CreatorOverride } from "../interfaces/query-requirements-primary-port";
import { INTERNAL_SERVER_ERROR } from "./errors";

const ROOT_GRAPH_KEY = "root";

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

function groupItemsByName(items: Items): Map<string, Items> {
    const itemRecipes = new Map<string, Items>();
    for (const item of items) {
        const recipes = itemRecipes.get(item.name) ?? [];
        itemRecipes.set(item.name, [...recipes, item]);
    }

    return itemRecipes;
}

function getUniqueItemKey(item: Pick<Item, "name" | "creator">): string {
    return `${item.name}#${item.creator}`;
}

function splitItems(
    items: Items,
    predicate: (item: Item) => boolean
): [Items, Items] {
    const matching: Items = [];
    const nonMatching: Items = [];
    for (const item of items) {
        if (predicate(item)) {
            matching.push(item);
        } else {
            nonMatching.push(item);
        }
    }

    return [matching, nonMatching];
}

function createItemGraph(
    items: Items,
    recipesMap: Map<string, Items>,
    rootItemName?: string
) {
    const graph = Graph();
    for (const item of items) {
        const itemRecipeKey = getUniqueItemKey(item);
        graph.addNode(itemRecipeKey);

        if (rootItemName === item.name) {
            graph.addNode(ROOT_GRAPH_KEY);
            graph.addEdge(ROOT_GRAPH_KEY, itemRecipeKey);
        }

        for (const requirement of item.requires) {
            const recipes = recipesMap.get(requirement.name);
            if (!recipes) {
                throw new Error(INTERNAL_SERVER_ERROR);
            }

            for (const recipe of recipes) {
                const requirementRecipeKey = getUniqueItemKey(recipe);
                graph.addNode(requirementRecipeKey);
                graph.addEdge(itemRecipeKey, requirementRecipeKey);
                graph.addEdge(requirementRecipeKey, itemRecipeKey);
            }
        }
    }

    return graph;
}

function filterByCreatorOverrides(
    rootItemName: string,
    items: Items,
    overrides: CreatorOverride[]
): Items {
    const itemMap = new Map<string, Item>(
        items.map((item) => [getUniqueItemKey(item), item])
    );
    const recipesMap = groupItemsByName(items);
    const graph = createItemGraph(items, recipesMap, rootItemName);

    const removeUncreatableNodes = (current: string) => {
        const item = itemMap.get(current);
        if (!item) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const adjacent = graph.adjacent(current);
        const adjacentItems = new Set(
            adjacent.map((node) => node.split("#")[0] as string)
        );
        const creatable = item.requires.every(({ name }) =>
            adjacentItems.has(name)
        );
        if (!creatable) {
            graph.removeNode(current);
            adjacent.map((node) => removeUncreatableNodes(node));
        }
    };

    for (const { itemName, creator } of overrides) {
        const [, recipesToIgnore] = splitItems(
            recipesMap.get(itemName) ?? [],
            (item) => item.creator === creator
        );

        for (const ignore of recipesToIgnore) {
            const ignoreKey = getUniqueItemKey(ignore);
            const adjacent = graph.adjacent(ignoreKey);
            graph.removeNode(ignoreKey);
            adjacent.map((node) => removeUncreatableNodes(node));
        }
    }

    const creatableItemSet = new Set<string>(
        graph.depthFirstSearch([ROOT_GRAPH_KEY], false)
    );

    return items.filter((item) => creatableItemSet.has(getUniqueItemKey(item)));
}

function canCreateItem(name: string, items: Items): boolean {
    const recipesMap = groupItemsByName(items);

    const canCreateItem = (name: string): boolean => {
        const recipes = recipesMap.get(name);
        if (!recipes || recipes.length === 0) {
            return false;
        }

        return recipes.some((recipe) => {
            return recipe.requires.every((requirement) =>
                canCreateItem(requirement.name)
            );
        });
    };

    return canCreateItem(name);
}

export {
    calculateCreateTime,
    calculateOutput,
    canCreateItem,
    filterByMinimumTool,
    filterByOptimal,
    filterByCreatorOverrides,
    getLowestRequiredTool,
};
