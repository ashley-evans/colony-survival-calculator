import React from "react";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";

import {
    WorkerInput,
    WorkerInputProps,
    AmountInput,
    AmountInputProps,
} from "./components";
import { ExchangeIcon, InputWrapper, TargetInputContainer } from "./styles";

type TargetInputProps = WorkerInputProps & AmountInputProps;

function TargetInput(props: TargetInputProps) {
    return (
        <TargetInputContainer>
            <InputWrapper>
                <WorkerInput {...props} />
            </InputWrapper>
            <ExchangeIcon icon={faArrowRightArrowLeft} />
            <InputWrapper>
                <AmountInput {...props} />
            </InputWrapper>
        </TargetInputContainer>
    );
}

export { TargetInput };
