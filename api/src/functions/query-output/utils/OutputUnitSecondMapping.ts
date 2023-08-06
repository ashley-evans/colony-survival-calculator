import { OutputUnit } from "../interfaces/query-output-primary-port";

const OutputUnitSecondMappings: Readonly<Record<OutputUnit, number>> = {
    [OutputUnit.SECONDS]: 1,
    [OutputUnit.MINUTES]: 60,
    [OutputUnit.GAME_DAYS]: 435,
};

export default OutputUnitSecondMappings;
