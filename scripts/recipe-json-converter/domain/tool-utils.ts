import {
    Item,
    PiplizTools,
    DefaultToolset,
    MachineToolset,
    Recipe,
} from "../types";
import { splitPiplizName } from "./utils";

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

const ToolMap: Readonly<Record<SupportedPiplizTools, DefaultToolset>> = {
    [SupportedPiplizTools.notools]: DefaultToolset.none,
    [SupportedPiplizTools.stonetools]: DefaultToolset.stone,
    [SupportedPiplizTools.coppertools]: DefaultToolset.copper,
    [SupportedPiplizTools.irontools]: DefaultToolset.iron,
    [SupportedPiplizTools.bronzetools]: DefaultToolset.bronze,
    [SupportedPiplizTools.steeltools]: DefaultToolset.steel,
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

const getMinMaxTools = (tools: PiplizTools[]): Item["toolset"] => {
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
        }

        if (ToolModifierValues[maximumTool] < value) {
            maximumTool = supportedTool;
        }
    }

    return {
        type: "default",
        minimumTool: ToolMap[minimumTool],
        maximumTool: ToolMap[maximumTool],
    };
};

const getDefaultMinMaxTools = (creator: string): PiplizTools[] => {
    switch (creator) {
        case "beekeeper":
        case "berryfarmer":
        case "chickenfarmer":
            return [PiplizTools.notools];
        default:
            return [PiplizTools.notools, PiplizTools.steeltools];
    }
};

const getToolset = (
    recipe: Recipe,
    npcToolsetMapping: Map<string, PiplizTools[]>
): Item["toolset"] => {
    const { itemName, creator } = splitPiplizName(recipe.name);
    const tools = npcToolsetMapping.get(creator);
    if (!tools) {
        console.log(
            `Defaulting to default toolset for recipe: ${itemName} from creator: ${creator}`
        );

        const defaultTools = getDefaultMinMaxTools(creator);
        return getMinMaxTools(defaultTools);
    }

    if (tools.includes(PiplizTools.machinetools)) {
        return {
            type: "machine",
            minimumTool: MachineToolset.machine,
            maximumTool: MachineToolset.machine,
        };
    }

    const test = getMinMaxTools(tools);
    if (creator === "fisherman") {
        console.dir(tools);
        console.dir(test);
    }

    return test;
};

export { getToolset, SupportedPiplizTools, UNSUPPORTED_TOOL_ERROR };
