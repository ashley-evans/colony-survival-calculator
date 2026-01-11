import { OutputUnit } from "../../../graphql/__generated__/graphql";

const OutputUnitI18NKeyMapping: Readonly<Record<OutputUnit, string>> = {
    [OutputUnit.Seconds]: "seconds",
    [OutputUnit.Minutes]: "minutes",
    [OutputUnit.GameDays]: "gameDays",
};

export { OutputUnitI18NKeyMapping };
