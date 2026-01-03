const creatorIDMap: Readonly<Record<string, string>> = {
    wheat: "wheatfarmer",
    flax: "flaxfarmer",
    cotton: "cottonfarmer",
    cabbage: "cabbagefarmer",
    alkanet: "alkanetfarmer",
    hollyhock: "hollyhockfarmer",
    wolfsbane: "wolfsbanefarmer",
    barley: "barleyfarmer",
    hemp: "hempfarmer",
    wisteriaflower: "wisteriafarmer",
};

const getCreatorID = (creator: string): string | null => {
    return creatorIDMap[creator] || null;
};

export { getCreatorID };
