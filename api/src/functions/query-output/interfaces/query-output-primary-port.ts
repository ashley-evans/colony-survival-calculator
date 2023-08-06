import { Tools } from "../../../types";

enum OutputUnit {
    SECONDS = "SECONDS",
    MINUTES = "MINUTES",
    GAME_DAYS = "GAME_DAYS",
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
