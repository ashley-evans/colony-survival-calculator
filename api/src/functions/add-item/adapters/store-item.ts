import type { StoreItemPort } from "../interfaces/store-item-port";

const storeItem: StoreItemPort = async (items) => {
    console.dir(items);
    return true;
};

export { storeItem };
