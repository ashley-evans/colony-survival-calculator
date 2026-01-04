import Ajv from "ajv";

import ItemsSchema from "../../../json/schemas/items.json";
import ToolsetSchema from "../../../json/schemas/toolset.json";
import { Items } from "../../../types";
import { storeItem } from "../adapters/store-item";
import type { AddItemPrimaryPort } from "../interfaces/add-item-primary-port";
import { ToolModifierValues } from "../../../common";

const ajv = new Ajv();
ajv.addKeyword("tsEnumNames");
const validateItems = ajv.addSchema(ToolsetSchema).compile<Items>(ItemsSchema);

function parseItems(input: string): Items {
    try {
        const parsed = JSON.parse(input);
        if (validateItems(parsed)) {
            return parsed;
        } else {
            throw validateItems.errors;
        }
    } catch (ex) {
        const errorContent =
            ex instanceof Error ? ex.message : JSON.stringify(ex);

        throw `Validation Error: ${errorContent}`;
    }
}

function validateRequirements(items: Items): void {
    const itemMap = new Set<string>(items.map((item) => item.id));
    for (const item of items) {
        for (const requirement of item.requires) {
            if (!itemMap.has(requirement.id)) {
                throw new Error(
                    `Missing requirement: ${requirement.id} in ${item.id}`,
                );
            }
        }
    }
}

function validateOptionalOutputs(items: Items): void {
    const itemMap = new Set<string>(items.map((item) => item.id));
    for (const item of items) {
        if (!item.optionalOutputs) {
            continue;
        }

        for (const optionalOutput of item.optionalOutputs) {
            if (!itemMap.has(optionalOutput.id)) {
                throw new Error(
                    `Missing optional output: ${optionalOutput.id} in ${item.id}`,
                );
            }
        }
    }
}

function validateTools(items: Items): void {
    for (const item of items) {
        if (item.toolset.type === "machine") {
            continue;
        }

        const minToolValue = ToolModifierValues[item.toolset.minimumTool];
        const maxToolValue = ToolModifierValues[item.toolset.maximumTool];
        if (minToolValue > maxToolValue) {
            throw new Error(
                `Invalid item: ${item.id}, minimum tool is better than maximum tool`,
            );
        }
    }
}

function validateCreators(items: Items): void {
    const itemMap = new Map<string, Set<string>>();
    for (const item of items) {
        const creatorSet = itemMap.get(item.id);
        if (!creatorSet) {
            itemMap.set(item.id, new Set([item.creatorID]));
        } else if (creatorSet.has(item.creatorID)) {
            throw new Error(
                `Items provided with same id: ${item.id} and creator: ${item.creatorID}`,
            );
        } else {
            creatorSet.add(item.creatorID);
        }
    }
}

const addItem: AddItemPrimaryPort = async (items) => {
    const parsedItems = parseItems(items);
    validateRequirements(parsedItems);
    validateOptionalOutputs(parsedItems);
    validateTools(parsedItems);
    validateCreators(parsedItems);

    try {
        return await storeItem(parsedItems);
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { addItem };
