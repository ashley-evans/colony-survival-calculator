import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";

import {
    WorkerInput,
    WorkerInputProps,
    AmountInput,
    AmountInputProps,
} from "./components";
import { ExchangeIcon, InputWrapper, TargetInputContainer } from "./styles";

export type Target =
    | {
          workers: number;
      }
    | { amount: number };

type TargetInputProps = { onTargetChange: (target: Target) => void } & Pick<
    AmountInputProps,
    "defaultAmount"
> &
    Pick<WorkerInputProps, "defaultWorkers">;

function TargetInput({
    onTargetChange,
    defaultAmount,
    defaultWorkers,
}: TargetInputProps) {
    const handleWorkerChange = (workers?: number) => {
        if (workers) {
            onTargetChange({ workers });
        }
    };

    const handleAmountChange = (amount?: number) => {
        if (amount) {
            onTargetChange({ amount });
        }
    };

    return (
        <TargetInputContainer>
            <InputWrapper>
                <WorkerInput
                    defaultWorkers={defaultWorkers}
                    onWorkerChange={handleWorkerChange}
                />
            </InputWrapper>
            <ExchangeIcon icon={faArrowRightArrowLeft} />
            <InputWrapper>
                <AmountInput
                    defaultAmount={defaultAmount}
                    onAmountChange={handleAmountChange}
                />
            </InputWrapper>
        </TargetInputContainer>
    );
}

export { TargetInput };
