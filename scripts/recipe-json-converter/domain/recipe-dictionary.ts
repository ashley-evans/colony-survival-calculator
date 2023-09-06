const piplizItemNameMap: Readonly<Record<string, string>> = {
    poisondart: "Poison dart",
    gunpowder: "Gunpowder",
};

const getUserFriendlyItemName = (name: string): string | null => {
    return piplizItemNameMap[name] || null;
};

const creatorNameMap: Readonly<Record<string, string>> = {
    alchemist: "Alchemist",
};

const getUserFriendlyCreatorName = (creator: string): string | null => {
    return creatorNameMap[creator] || null;
};

export { getUserFriendlyItemName, getUserFriendlyCreatorName };
