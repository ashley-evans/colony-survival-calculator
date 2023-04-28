import React from "react";

import { OutputUnit } from "../../../../graphql/__generated__/graphql";
import { OutputUnitSelectorMappings } from "../../utils";
import Selector from "../../../../common/components/Selector";

type ItemSelectorProps = {
    onUnitChange: (unit: OutputUnit) => void;
};

const outputUnits = Object.values(OutputUnit);

function OutputUnitSelector({ onUnitChange }: ItemSelectorProps) {
    const handleUnitChange = (selectedUnit?: OutputUnit) => {
        if (selectedUnit) onUnitChange(selectedUnit);
    };

    return (
        <Selector
            items={outputUnits}
            itemToKey={(unit) => unit}
            itemToDisplayText={(unit) => OutputUnitSelectorMappings[unit]}
            labelText="Desired output units:"
            defaultSelectedItem={outputUnits[1]}
            onSelectedItemChange={handleUnitChange}
            palette="secondary"
        />
    );
}

export { OutputUnitSelector };
