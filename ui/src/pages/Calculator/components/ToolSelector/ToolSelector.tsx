import React from "react";

import { Tools } from "../../../../graphql/__generated__/graphql";
import { ToolSelectorMappings } from "../../utils";
import Selector from "../../../../common/components/Selector";

type ToolSelectorProps = {
    onToolChange: (unit: Tools) => void;
};

const tools = Object.values(Tools);

function ToolSelector({ onToolChange }: ToolSelectorProps) {
    const handleToolChange = (selectedTool?: Tools) => {
        if (selectedTool) onToolChange(selectedTool);
    };

    return (
        <Selector
            items={tools}
            itemToKey={(tool) => tool}
            itemToDisplayText={(tool) => ToolSelectorMappings[tool]}
            labelText="Tools:"
            defaultSelectedItem={tools[3]}
            onSelectedItemChange={handleToolChange}
            palette="secondary"
        />
    );
}

export { ToolSelector };
