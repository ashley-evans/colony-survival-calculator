import React, { FormEvent, useState } from "react";

import { ErrorText } from "./styles";

type ItemSelectorProps = {
    onWorkerChange: (workers?: number) => void;
};

function WorkerInput({ onWorkerChange }: ItemSelectorProps) {
    const [isInvalid, setIsInvalid] = useState<boolean>(false);

    const handleWorkerChange = (event: FormEvent<HTMLInputElement>) => {
        const input = parseFloat(event.currentTarget.value);
        if (isNaN(input) || input < 0) {
            setIsInvalid(true);
            onWorkerChange(undefined);
        } else {
            setIsInvalid(false);
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
            {isInvalid ? (
                <ErrorText role="alert">
                    Invalid input, must be a positive number
                </ErrorText>
            ) : null}
        </>
    );
}

export { WorkerInput };
