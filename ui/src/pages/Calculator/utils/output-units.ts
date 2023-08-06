import { OutputUnit } from "../../../graphql/__generated__/graphql";

const OutputUnitDisplayMappings: Readonly<Record<OutputUnit, string>> = {
    [OutputUnit.Seconds]: "second",
    [OutputUnit.Minutes]: "minute",
    [OutputUnit.GameDays]: "game day",
};

const OutputUnitSelectorMappings: Readonly<Record<OutputUnit, string>> = {
    [OutputUnit.Seconds]: "Seconds",
    [OutputUnit.Minutes]: "Minutes",
    [OutputUnit.GameDays]: "Game days",
};

export { OutputUnitDisplayMappings, OutputUnitSelectorMappings };
