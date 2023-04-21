import React, { FormEvent } from "react";

import { Tools } from "../../../../graphql/__generated__/graphql";
import { ToolSelectorMappings } from "../../utils";

type ToolSelectorProps = {
    onToolChange: (unit: Tools) => void;
};

function ToolSelector({ onToolChange }: ToolSelectorProps) {
    const handleToolChange = (event: FormEvent<HTMLSelectElement>) => {
        const selected = event.currentTarget.value as Tools;
        onToolChange(selected);
    };

    return (
        <>
            <label htmlFor="tool-select">Tools:</label>
            <select
                id="tool-select"
                defaultValue={Tools.None}
                onChange={handleToolChange}
            >
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
