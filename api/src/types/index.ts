import type {
    DefaultToolset,
    MachineToolset,
    EyeglassesToolset,
    Toolset,
} from "./__generated__/items";

export type {
    Item,
    Items,
    Requirement,
    Requirements,
    OptionalOutput,
} from "./__generated__/items";
export * from "./item";
export type { DefaultToolset, MachineToolset, EyeglassesToolset, Toolset };
export type AvailableTools = {
    default: DefaultToolset;
    machine: boolean;
    eyeglasses: boolean;
};
export type AvailableToolsInput = {
    [K in keyof AvailableTools]?: AvailableTools[K] | undefined;
};
export type ToolsetType = Toolset["type"];
export type AllToolsets = DefaultToolset | MachineToolset | EyeglassesToolset;
