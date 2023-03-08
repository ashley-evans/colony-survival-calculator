import type { Item, Requirement, Requirements } from "../src/types";

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
    requirements: Requirements
): Item;
function createItem(
    name: string,
    createTime: number,
    output: number,
    requirements: Requirements,
    width: number,
    height: number
): Item;
function createItem(
    name: string,
    createTime: number,
    output: number,
    requirements: Requirements,
    width?: number,
    height?: number
): Item {
    return {
        name,
        createTime,
        output,
        requires: requirements,
        ...(width && height ? { size: { width, height } } : {}),
    };
}

export { createItem, createRequirements };
