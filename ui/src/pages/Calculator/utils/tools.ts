import { AvailableDefaultTools } from "../../../graphql/__generated__/schema-types";

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

function isTool(input: string): input is AvailableDefaultTools {
    return Object.values(AvailableDefaultTools).includes(
        input as AvailableDefaultTools,
    );
}

export { ToolSelectorI18NKeyMapping, isTool };
