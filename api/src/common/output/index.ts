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
    maxAvailableDefaultTool: DefaultToolset,
    maxAvailableEyeglasses: GlassesToolset
): number {
    const getModifier = ({ toolset }: Pick<Item, "toolset">) => {
        switch (toolset.type) {
            case "machine":
                return ToolModifierValues["machine"];
            case "glasses":
                return getMaxToolModifier(
                    toolset.maximumTool,
                    maxAvailableEyeglasses
                );
            case "default":
                return getMaxToolModifier(
                    toolset.maximumTool,
                    maxAvailableDefaultTool
                );
        }
    };

    const modifier = getModifier(item);
    return item.output / (item.createTime / modifier);
}

export { OutputUnit, OutputUnitSecondMappings, calculateOutput };
