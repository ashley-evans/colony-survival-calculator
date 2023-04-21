import { Tools } from "../../types";

const ToolModifierValues: Readonly<Record<Tools, number>> = {
    [Tools.none]: 1,
    [Tools.stone]: 2,
    [Tools.copper]: 4,
    [Tools.iron]: 5.3,
    [Tools.bronze]: 6.15,
    [Tools.steel]: 8,
};

export { ToolModifierValues };
