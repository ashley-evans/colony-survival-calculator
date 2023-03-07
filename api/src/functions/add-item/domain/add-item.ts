import Ajv from "ajv";

import ItemsSchema from "../../../json/schemas/items.json";
import type { Items } from "../../../types";
import { storeItem } from "../adapters/store-item";
import type { AddItemPrimaryPort } from "../interfaces/add-item-primary-port";

const ajv = new Ajv();
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
        throw `Validation Error: ${ex}`;
    }
}

const addItem: AddItemPrimaryPort = async (items) => {
    const parsedItems = parseItems(items);
    return storeItem(parsedItems);
};

export { addItem };
