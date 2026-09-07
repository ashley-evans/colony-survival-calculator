import { Item } from "../../../../graphql/__generated__/schema-types";
import { ItemName } from "./types";

export type CreatorOverrideResponse = Pick<
    Item,
    "id" | "name" | "creatorID" | "creator"
>;

function generateItemCreatorOverridesResponse(
    item: ItemName,
    amount: number,
    creatorOffset = 0,
): CreatorOverrideResponse[] {
    const overrides: CreatorOverrideResponse[] = [];
    for (let i = 0; i < amount; i++) {
        const creatorNum = i + 1 + creatorOffset;
        overrides.push({
            id: item.id,
            name: item.name,
            creatorID: `${item.id}creator${creatorNum}`,
            creator: `${item.name} creator - ${creatorNum}`,
        });
    }

    return overrides;
}

export { generateItemCreatorOverridesResponse };
