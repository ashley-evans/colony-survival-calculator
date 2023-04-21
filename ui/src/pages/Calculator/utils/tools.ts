import { Tools } from "../../../graphql/__generated__/graphql";

const ToolSelectorMappings: Readonly<Record<Tools, string>> = {
    [Tools.None]: "None",
    [Tools.Stone]: "Stone",
    [Tools.Copper]: "Copper",
    [Tools.Iron]: "Iron",
    [Tools.Bronze]: "Bronze",
    [Tools.Steel]: "Steel",
};

export { ToolSelectorMappings };
