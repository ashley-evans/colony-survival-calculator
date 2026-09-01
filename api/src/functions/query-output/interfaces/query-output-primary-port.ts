import { OutputUnit } from "../../../common";
import { AvailableToolsInput } from "../../../types";

type QueryOutputInput = {
    id: string;
    workers: number;
    unit: OutputUnit;
    availableTools?: AvailableToolsInput;
    creatorID?: string;
};

interface QueryOutputPrimaryPort {
    (input: QueryOutputInput): Promise<number>;
}

export { QueryOutputPrimaryPort, QueryOutputInput };
