import { Tools } from "../../../types";

enum OutputUnit {
    GAME_DAYS = "GAME_DAYS",
    MINUTES = "MINUTES",
}

interface QueryOutputPrimaryPort {
    (input: {
        name: string;
        workers: number;
        unit: OutputUnit;
        maxAvailableTool?: Tools;
        creator?: string;
    }): Promise<number>;
}

export { OutputUnit, QueryOutputPrimaryPort };
