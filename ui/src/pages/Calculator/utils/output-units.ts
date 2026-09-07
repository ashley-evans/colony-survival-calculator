import { OutputUnit } from "../../../graphql/__generated__/schema-types";

const OutputUnitI18NKeyMapping: Readonly<Record<OutputUnit, string>> = {
    [OutputUnit.Seconds]: "seconds",
    [OutputUnit.Minutes]: "minutes",
    [OutputUnit.GameDays]: "gameDays",
};

function isOutputUnit(input: string): input is OutputUnit {
    return Object.values(OutputUnit).includes(input as OutputUnit);
}

export { OutputUnitI18NKeyMapping, isOutputUnit };
