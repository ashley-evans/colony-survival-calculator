import { AvailableDefaultTools } from "../../../graphql/__generated__/graphql";

const ToolSelectorI18NKeyMapping: Readonly<
    Record<AvailableDefaultTools, string>
> = {
    [AvailableDefaultTools.None]: "none",
    [AvailableDefaultTools.Stone]: "stone",
    [AvailableDefaultTools.Copper]: "copper",
    [AvailableDefaultTools.Iron]: "iron",
    [AvailableDefaultTools.Bronze]: "bronze",
    [AvailableDefaultTools.Steel]: "steel",
};

export { ToolSelectorI18NKeyMapping };
