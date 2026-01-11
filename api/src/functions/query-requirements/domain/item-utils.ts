import { Graph, depthFirstSearch } from "graph-data-structure";

import { DefaultToolset, TranslatedItem } from "../../../types";
import { CreatorOverride } from "../interfaces/query-requirements-primary-port";
import { INTERNAL_SERVER_ERROR } from "./errors";
import {
    ToolModifierValues,
    getMaxToolModifier,
    groupItemsByID,
} from "../../../common";

const ROOT_GRAPH_KEY = "root";

function calculateCreateTime(
    { toolset, createTime }: Pick<TranslatedItem, "toolset" | "createTime">,
    availableTool: DefaultToolset,
) {
    if (toolset.type === "machine") {
        return createTime / ToolModifierValues["machine"];
    }

    const toolModifier = getMaxToolModifier(toolset.maximumTool, availableTool);
    return createTime / toolModifier;
}

function getUniqueItemKey(
    item: Pick<TranslatedItem, "id" | "creatorID">,
): string {
    return `${item.id}#${item.creatorID}`;
}

function splitItems(
    items: TranslatedItem[],
    predicate: (item: TranslatedItem) => boolean,
): [TranslatedItem[], TranslatedItem[]] {
    const matching: TranslatedItem[] = [];
    const nonMatching: TranslatedItem[] = [];
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
    items: TranslatedItem[],
    recipesMap: Map<string, TranslatedItem[]>,
    rootItemID?: string,
) {
    const graph = new Graph();
    for (const item of items) {
        const itemRecipeKey = getUniqueItemKey(item);
        graph.addNode(itemRecipeKey);

        if (rootItemID === item.id) {
            graph.addNode(ROOT_GRAPH_KEY);
            graph.addEdge(ROOT_GRAPH_KEY, itemRecipeKey);
        }

        for (const requirement of item.requires) {
            const recipes = recipesMap.get(requirement.id);
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
    rootItemID: string,
    items: TranslatedItem[],
    overrides: CreatorOverride[],
): TranslatedItem[] {
    const itemMap = new Map<string, TranslatedItem>(
        items.map((item) => [getUniqueItemKey(item), item]),
    );
    const recipesMap = groupItemsByID(items);
    const graph = createItemGraph(items, recipesMap, rootItemID);

    const removeUncreatableNodes = (current: string) => {
        const item = itemMap.get(current);
        if (!item) {
            throw new Error(INTERNAL_SERVER_ERROR);
        }

        const adjacent = [...(graph.adjacent(current) || new Set())];
        const adjacentItems = new Set(
            adjacent.map((node) => node.split("#")[0] as string),
        );
        const creatable = item.requires.every(({ id }) =>
            adjacentItems.has(id),
        );
        if (!creatable) {
            graph.removeNode(current);
            adjacent.map((node) => removeUncreatableNodes(node));
        }
    };

    for (const { itemID, creatorID } of overrides) {
        const [, recipesToIgnore] = splitItems(
            recipesMap.get(itemID) ?? [],
            (item) => item.creatorID === creatorID,
        );

        for (const ignore of recipesToIgnore) {
            const ignoreKey = getUniqueItemKey(ignore);
            const adjacent = [...(graph.adjacent(ignoreKey) || new Set())];
            graph.removeNode(ignoreKey);
            adjacent.map((node) => removeUncreatableNodes(node));
        }
    }

    const creatableItemSet = new Set<string>(
        depthFirstSearch(graph, {
            sourceNodes: [ROOT_GRAPH_KEY],
            includeSourceNodes: false,
        }),
    );

    return items.filter((item) => creatableItemSet.has(getUniqueItemKey(item)));
}

function canCreateItem(id: string, items: TranslatedItem[]): boolean {
    const recipesMap = groupItemsByID(items);

    const canCreateItem = (id: string): boolean => {
        const recipes = recipesMap.get(id);
        if (!recipes || recipes.length === 0) {
            return false;
        }

        return recipes.some((recipe) => {
            return recipe.requires.every((requirement) =>
                canCreateItem(requirement.id),
            );
        });
    };

    return canCreateItem(id);
}

export { calculateCreateTime, canCreateItem, filterByCreatorOverrides };
