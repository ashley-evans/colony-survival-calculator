import React from "react";

import { Input } from "../../../../common/components";

type ItemSelectorProps = {
    onWorkerChange: (workers?: number) => void;
    defaultWorkers?: number;
};

function WorkerInput({ onWorkerChange, defaultWorkers }: ItemSelectorProps) {
    const parseValue = (value: unknown): number => {
        const input = Number(value);
        if (!isNaN(input) && input > 0 && input % 1 === 0) {
            return input;
        }

        throw new Error();
    };

    return (
        <Input
            label="Output item workers:"
            parseValue={parseValue}
            onChange={onWorkerChange}
            errorMessage="Invalid input, must be a positive non-zero whole number"
            inputMode="numeric"
            clearIconLabel="Clear worker input"
            defaultValue={defaultWorkers?.toString()}
        />
    );
}

export { WorkerInput };
