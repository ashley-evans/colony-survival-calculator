import { AvailableTools } from "../../../graphql/__generated__/graphql";

const ToolSelectorMappings: Readonly<Record<AvailableTools, string>> = {
    [AvailableTools.None]: "None",
    [AvailableTools.Stone]: "Stone",
    [AvailableTools.Copper]: "Copper",
    [AvailableTools.Iron]: "Iron",
    [AvailableTools.Bronze]: "Bronze",
    [AvailableTools.Steel]: "Steel",
};

export { ToolSelectorMappings };
