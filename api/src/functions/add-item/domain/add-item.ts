import Ajv from "ajv";

import ItemsSchema from "../../../json/schemas/items.json";
import { Items } from "../../../types";
import { storeItem } from "../adapters/store-item";
import type { AddItemPrimaryPort } from "../interfaces/add-item-primary-port";
import { ToolModifierValues } from "../../../common/modifiers";

const ajv = new Ajv();
ajv.addKeyword("tsEnumNames");
const validateItems = ajv.compile<Items>(ItemsSchema);

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
    const itemMap = new Set<string>(items.map((item) => item.name));
    for (const item of items) {
        for (const requirement of item.requires) {
            if (!itemMap.has(requirement.name)) {
                throw new Error(
                    `Missing requirement: ${requirement.name} in ${item.name}`
                );
            }
        }
    }
}

function validateTools(items: Items): void {
    for (const item of items) {
        ToolModifierValues;
        const minToolValue = ToolModifierValues[item.minimumTool];
        const maxToolValue = ToolModifierValues[item.maximumTool];
        if (minToolValue > maxToolValue) {
            throw new Error(
                `Invalid item: ${item.name}, minimum tool is better than maximum tool`
            );
        }
    }
}

const addItem: AddItemPrimaryPort = async (items) => {
    const parsedItems = parseItems(items);
    validateRequirements(parsedItems);
    validateTools(parsedItems);

    try {
        return await storeItem(parsedItems);
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};

export { addItem };
