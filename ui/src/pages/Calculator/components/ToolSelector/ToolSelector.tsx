import React from "react";

import { AvailableTools } from "../../../../graphql/__generated__/graphql";
import { ToolSelectorMappings } from "../../utils";
import { Selector } from "../../../../common/components";

type ToolSelectorProps = {
    onToolChange: (unit: AvailableTools) => void;
    defaultTool?: AvailableTools;
};

const tools = Object.values(AvailableTools);

function ToolSelector({ onToolChange, defaultTool }: ToolSelectorProps) {
    const handleToolChange = (selectedTool?: AvailableTools) => {
        if (selectedTool) onToolChange(selectedTool);
    };

    return (
        <Selector
            items={tools}
            itemToKey={(tool) => tool}
            itemToDisplayText={(tool) => ToolSelectorMappings[tool]}
            labelText="Tools:"
            defaultSelectedItem={defaultTool ?? tools[3]}
            onSelectedItemChange={handleToolChange}
            palette="secondary"
        />
    );
}

export { ToolSelector };
