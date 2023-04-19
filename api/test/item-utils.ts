import { Item, Requirement, Requirements, Tools } from "../src/types";

function createRequirements(name: string, amount: number): Requirement {
    return {
        name,
        amount,
    };
}

function createItem(
    name: string,
    createTime: number,
    output: number,
    requirements: Requirements,
    minimumTool: Tools,
    maximumTool: Tools
): Item;
function createItem(
    name: string,
    createTime: number,
    output: number,
    requirements: Requirements,
    minimumTool: Tools,
    maximumTool: Tools,
    width: number,
    height: number
): Item;
function createItem(
    name: string,
    createTime: number,
    output: number,
    requirements: Requirements,
    minimumTool: Tools = Tools.none,
    maximumTool: Tools = Tools.none,
    width?: number,
    height?: number
): Item {
    return {
        name,
        createTime,
        output,
        requires: requirements,
        ...(width && height ? { size: { width, height } } : {}),
        minimumTool,
        maximumTool,
    };
}

export { createItem, createRequirements };
