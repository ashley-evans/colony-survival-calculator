import { OutputUnit } from "../../../common/output";
import { DefaultToolset } from "../../../types";

interface QueryOutputPrimaryPort {
    (input: {
        name: string;
        workers: number;
        unit: OutputUnit;
        maxAvailableTool?: DefaultToolset;
        creator?: string;
    }): Promise<number>;
}

export { QueryOutputPrimaryPort };
