import { Tools } from "../../../types";

enum OutputUnit {
    GAME_DAYS = "GAME_DAYS",
    MINUTES = "MINUTES",
}

interface QueryOutputPrimaryPort {
    (
        name: string,
        workers: number,
        unit: OutputUnit,
        maxAvailableTool?: Tools
    ): Promise<number>;
}

export { OutputUnit, QueryOutputPrimaryPort };
