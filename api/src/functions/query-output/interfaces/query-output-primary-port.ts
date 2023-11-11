import { OutputUnit } from "../../../common";
import { DefaultToolset } from "../../../types";

interface QueryOutputPrimaryPort {
    (input: {
        name: string;
        workers: number;
        unit: OutputUnit;
        maxAvailableTool?: DefaultToolset;
        hasMachineTools?: boolean;
        hasEyeglasses?: boolean;
        creator?: string;
    }): Promise<number>;
}

export { QueryOutputPrimaryPort };
