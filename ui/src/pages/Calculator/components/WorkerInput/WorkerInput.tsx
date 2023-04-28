import React from "react";

import { Input } from "../../../../common/components";

type ItemSelectorProps = {
    onWorkerChange: (workers?: number) => void;
};

function WorkerInput({ onWorkerChange }: ItemSelectorProps) {
    const parseValue = (value: unknown): number => {
        const input = Number(value);
        if (!isNaN(input) && input > 0 && input % 1 === 0) {
            return input;
        }

        throw new Error();
    };

    return (
        <Input
            label="Workers:"
            parseValue={parseValue}
            onChange={onWorkerChange}
            errorMessage="Invalid input, must be a positive non-zero whole number"
            inputMode="numeric"
        />
    );
}

export { WorkerInput };
