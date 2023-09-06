import { APITools, Item, PiplizTools } from "../types";

const UNSUPPORTED_TOOL_ERROR = new Error("Toolset contains invalid tool");

enum SupportedPiplizTools {
    steeltools = PiplizTools.steeltools,
    bronzetools = PiplizTools.bronzetools,
    irontools = PiplizTools.irontools,
    coppertools = PiplizTools.coppertools,
    stonetools = PiplizTools.stonetools,
    notools = PiplizTools.notools,
}

const ToolModifierValues: Readonly<Record<SupportedPiplizTools, number>> = {
    [SupportedPiplizTools.notools]: 1,
    [SupportedPiplizTools.stonetools]: 2,
    [SupportedPiplizTools.coppertools]: 4,
    [SupportedPiplizTools.irontools]: 5.3,
    [SupportedPiplizTools.bronzetools]: 6.15,
    [SupportedPiplizTools.steeltools]: 8,
};

const ToolMap: Readonly<Record<SupportedPiplizTools, APITools>> = {
    [SupportedPiplizTools.notools]: APITools.none,
    [SupportedPiplizTools.stonetools]: APITools.stone,
    [SupportedPiplizTools.coppertools]: APITools.copper,
    [SupportedPiplizTools.irontools]: APITools.iron,
    [SupportedPiplizTools.bronzetools]: APITools.bronze,
    [SupportedPiplizTools.steeltools]: APITools.steel,
};

const mapPiplizTool = (tool: PiplizTools): SupportedPiplizTools | null => {
    switch (tool) {
        case PiplizTools.steeltools:
            return SupportedPiplizTools.steeltools;
        case PiplizTools.bronzetools:
            return SupportedPiplizTools.bronzetools;
        case PiplizTools.irontools:
            return SupportedPiplizTools.irontools;
        case PiplizTools.coppertools:
            return SupportedPiplizTools.coppertools;
        case PiplizTools.stonetools:
            return SupportedPiplizTools.stonetools;
        case PiplizTools.notools:
            return SupportedPiplizTools.notools;
        default:
            return null; // Tool is not supported
    }
};

const getMinMaxTools = (
    tools: PiplizTools[]
): Pick<Item, "minimumTool" | "maximumTool"> => {
    let minimumTool = SupportedPiplizTools.steeltools;
    let maximumTool = SupportedPiplizTools.notools;
    for (const tool of tools) {
        const supportedTool = mapPiplizTool(tool);
        if (!supportedTool) {
            throw UNSUPPORTED_TOOL_ERROR;
        }

        const value = ToolModifierValues[supportedTool];
        if (ToolModifierValues[minimumTool] > value) {
            minimumTool = supportedTool;
        } else if (ToolModifierValues[maximumTool] < value) {
            maximumTool = supportedTool;
        }
    }

    return {
        minimumTool: ToolMap[minimumTool],
        maximumTool: ToolMap[maximumTool],
    };
};

export { getMinMaxTools, SupportedPiplizTools, UNSUPPORTED_TOOL_ERROR };
