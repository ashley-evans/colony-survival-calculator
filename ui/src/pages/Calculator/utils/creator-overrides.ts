import { CreatorOverride } from "../../../graphql/__generated__/schema-types";

function parseCreatorOverrides(overrides: string[]): CreatorOverride[] {
    return overrides.flatMap((override) => {
        const [itemID, creatorID, ...extraParts] = override.split(":");

        return itemID && creatorID && extraParts.length === 0
            ? [{ itemID, creatorID }]
            : [];
    });
}

export { parseCreatorOverrides };
