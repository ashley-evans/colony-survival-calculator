import { ToolModifierValues, getMaxToolModifier } from "..";
import { DefaultToolset, GlassesToolset, Item } from "../../types";

enum OutputUnit {
    SECONDS = "SECONDS",
    MINUTES = "MINUTES",
    GAME_DAYS = "GAME_DAYS",
}

const OutputUnitSecondMappings: Readonly<Record<OutputUnit, number>> = {
    [OutputUnit.SECONDS]: 1,
    [OutputUnit.MINUTES]: 60,
    [OutputUnit.GAME_DAYS]: 435,
};

function calculateOutput(
    item: Pick<Item, "toolset" | "createTime" | "output">,
    maxAvailableTool: DefaultToolset | GlassesToolset
): number {
    const modifier =
        item.toolset.type === "machine"
            ? ToolModifierValues["machine"]
            : getMaxToolModifier(item.toolset.maximumTool, maxAvailableTool);

    return item.output / (item.createTime / modifier);
}

export { OutputUnit, OutputUnitSecondMappings, calculateOutput };
