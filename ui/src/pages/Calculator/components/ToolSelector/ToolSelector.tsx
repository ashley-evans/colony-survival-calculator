import React from "react";

import { AvailableTools } from "../../../../graphql/__generated__/graphql";
import { ToolSelectorMappings } from "../../utils";
import { Selector } from "../../../../common/components";

type ToolSelectorProps = {
    onToolChange: (unit: AvailableTools) => void;
    defaultTool?: AvailableTools;
    className?: string;
};

const tools = Object.values(AvailableTools);

function ToolSelector({
    onToolChange,
    defaultTool,
    className,
}: ToolSelectorProps) {
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
            className={className}
        />
    );
}

export { ToolSelector };
