import type { Items } from "../../../types";

interface StoreItemPort {
    (items: Items): Promise<boolean>;
}

export { StoreItemPort };
