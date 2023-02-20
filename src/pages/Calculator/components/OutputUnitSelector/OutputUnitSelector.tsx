import React, { FormEvent } from "react";

import { isUnit, Units } from "../../../../utils";

type ItemSelectorProps = {
    onUnitChange: (unit: Units) => void;
};

function OutputUnitSelector({ onUnitChange }: ItemSelectorProps) {
    const handleUnitChange = (event: FormEvent<HTMLSelectElement>) => {
        const unit = event.currentTarget.value;
        if (isUnit(unit)) {
            onUnitChange(unit);
        }
    };

    return (
        <>
            <label htmlFor="units-select" defaultValue={Units.MINUTES}>
                Desired output units:
            </label>
            <select id="units-select" onChange={handleUnitChange}>
                {Object.values(Units).map((unit) => (
                    <option key={unit}>{unit}</option>
                ))}
            </select>
        </>
    );
}

export { OutputUnitSelector };
