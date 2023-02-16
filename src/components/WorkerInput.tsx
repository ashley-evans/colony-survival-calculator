import React, { FormEvent } from "react";

type ItemSelectorProps = {
    onWorkerChange: (workers?: number) => void;
    onError: (error?: string) => void;
};

function WorkerInput({ onWorkerChange, onError }: ItemSelectorProps) {
    const handleWorkerChange = (event: FormEvent<HTMLInputElement>) => {
        const input = parseFloat(event.currentTarget.value);
        if (isNaN(input) || input < 0) {
            onError("Invalid input, must be a positive number");
            onWorkerChange(undefined);
        } else {
            onError(undefined);
            onWorkerChange(input);
        }
    };

    return (
        <>
            <label htmlFor="worker-input">Workers:</label>
            <input
                id="worker-input"
                inputMode="numeric"
                onChange={handleWorkerChange}
            ></input>
        </>
    );
}

export { WorkerInput };
