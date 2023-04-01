import { OutputUnit } from "../../../graphql/__generated__/graphql";

const OutputUnitDisplayMappings: Readonly<Record<OutputUnit, string>> = {
    [OutputUnit.Minutes]: "minute",
    [OutputUnit.GameDays]: "game day",
};

const OutputUnitSelectorMappings: Readonly<Record<OutputUnit, string>> = {
    [OutputUnit.Minutes]: "Minutes",
    [OutputUnit.GameDays]: "Game days",
};

const OutputUnitSelectorReverseMappings: Readonly<Record<string, OutputUnit>> =
    {
        Minutes: OutputUnit.Minutes,
        "Game days": OutputUnit.GameDays,
    };

export {
    OutputUnitDisplayMappings,
    OutputUnitSelectorMappings,
    OutputUnitSelectorReverseMappings,
};
