import React, { FormEvent } from "react";

import { OutputUnit } from "../../../../graphql/__generated__/graphql";
import {
    OutputUnitSelectorMappings,
    OutputUnitSelectorReverseMappings,
} from "../../utils";

type ItemSelectorProps = {
    onUnitChange: (unit: OutputUnit) => void;
};

function OutputUnitSelector({ onUnitChange }: ItemSelectorProps) {
    const handleUnitChange = (event: FormEvent<HTMLSelectElement>) => {
        const unit = event.currentTarget.value;
        onUnitChange(OutputUnitSelectorReverseMappings[unit]);
    };

    return (
        <>
            <label htmlFor="units-select">Desired output units:</label>
            <select
                id="units-select"
                onChange={handleUnitChange}
                defaultValue={OutputUnitSelectorMappings[OutputUnit.Minutes]}
            >
                {Object.values(OutputUnit).map((unit) => (
                    <option key={unit}>
                        {OutputUnitSelectorMappings[unit]}
                    </option>
                ))}
            </select>
        </>
    );
}

export { OutputUnitSelector };
