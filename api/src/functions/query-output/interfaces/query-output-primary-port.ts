import { OutputUnit } from "../../../common/output";
import { Tools } from "../../../types";

interface QueryOutputPrimaryPort {
    (input: {
        name: string;
        workers: number;
        unit: OutputUnit;
        maxAvailableTool?: Tools;
        creator?: string;
    }): Promise<number>;
}

export { QueryOutputPrimaryPort };
