import React from "react";

import { Tools } from "../../../../graphql/__generated__/graphql";

const ToolSelectorMappings: Readonly<Record<Tools, string>> = {
    [Tools.None]: "None",
    [Tools.Stone]: "Stone",
    [Tools.Copper]: "Copper",
    [Tools.Iron]: "Iron",
    [Tools.Bronze]: "Bronze",
    [Tools.Steel]: "Steel",
};

function ToolSelector() {
    return (
        <>
            <label htmlFor="tool-select">Tools:</label>
            <select id="tool-select" defaultValue={Tools.None}>
                {Object.values(Tools).map((tool) => (
                    <option key={tool} value={tool}>
                        {ToolSelectorMappings[tool]}
                    </option>
                ))}
            </select>
        </>
    );
}

export { ToolSelector };
