import { getMaxToolModifier } from "..";
import { AvailableTools, TranslatedItem } from "../../types";

enum OutputUnit {
    SECONDS = "SECONDS",
    MINUTES = "MINUTES",
    GAME_DAYS = "GAME_DAYS",
}

const OutputUnitSecondMappings: Readonly<Record<OutputUnit, number>> = {
    [OutputUnit.SECONDS]: 1,
    [OutputUnit.MINUTES]: 60,
    [OutputUnit.GAME_DAYS]: 444,
};
function calculateOutput(
    item: Pick<TranslatedItem, "toolset" | "createTime" | "output">,
    availableTools: AvailableTools,
): number {
    const modifier = getMaxToolModifier(item, availableTools);

    return item.output / (item.createTime / modifier);
}

export { OutputUnit, OutputUnitSecondMappings, calculateOutput };
