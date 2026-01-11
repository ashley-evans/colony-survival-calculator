import { AvailableTools } from "../../../graphql/__generated__/graphql";

const ToolSelectorI18NKeyMapping: Readonly<Record<AvailableTools, string>> = {
    [AvailableTools.None]: "none",
    [AvailableTools.Stone]: "stone",
    [AvailableTools.Copper]: "copper",
    [AvailableTools.Iron]: "iron",
    [AvailableTools.Bronze]: "bronze",
    [AvailableTools.Steel]: "steel",
};

export { ToolSelectorI18NKeyMapping };
