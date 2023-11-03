import {
    DefaultToolset,
    GlassesToolset,
    MachineToolset,
} from "./generated/items";

export type AllToolsets = DefaultToolset | MachineToolset | GlassesToolset;
export * from "./generated/items";
