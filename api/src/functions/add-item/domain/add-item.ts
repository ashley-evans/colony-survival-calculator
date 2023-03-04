import type { AddItemPrimaryPort } from "../interfaces/add-item-primary-port";

const addItem: AddItemPrimaryPort = async (items) => {
    console.log(items);
    return true;
};

export { addItem };
