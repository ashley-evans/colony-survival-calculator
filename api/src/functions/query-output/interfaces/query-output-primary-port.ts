import { OutputUnit } from "../../../common";
import { DefaultToolset } from "../../../types";

interface QueryOutputPrimaryPort {
    (input: {
        id: string;
        workers: number;
        unit: OutputUnit;
        maxAvailableTool?: DefaultToolset;
        hasMachineTools?: boolean;
        creatorID?: string;
    }): Promise<number>;
}

export { QueryOutputPrimaryPort };
