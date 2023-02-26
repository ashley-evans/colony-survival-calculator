enum Units {
    MINUTES = "Minutes",
    GAME_DAYS = "Game days",
}

const UnitsArray = Object.values(Units);

const UnitSecondMappings: Readonly<Record<Units, number>> = {
    [Units.MINUTES]: 60,
    [Units.GAME_DAYS]: 720,
};

const UnitDisplayMappings: Readonly<Record<Units, string>> = {
    [Units.MINUTES]: "minute",
    [Units.GAME_DAYS]: "game day",
};

function isUnit(input: string): input is Units {
    return UnitsArray.includes(input as Units);
}

export { Units, UnitSecondMappings, UnitDisplayMappings, isUnit };
