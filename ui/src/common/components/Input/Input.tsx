import React, { FormEvent, HTMLAttributes, useId, useState } from "react";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import {
    Container,
    IconContainer,
    InputContainer,
    Input as StyledInput,
} from "./styles";
import { ColorPalettes } from "../..";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type InputProps<Type> = Pick<HTMLAttributes<HTMLInputElement>, "inputMode"> & {
    label: string;
    onChange: (value?: Type) => void;
    parseValue: (value: unknown) => Type;
    errorMessage?: string;
    clearIconLabel?: string;
    palette?: ColorPalettes;
    className?: string;
};

function Input<Type>({
    label,
    onChange,
    parseValue,
    errorMessage,
    clearIconLabel,
    inputMode,
    palette = "secondary",
    className,
}: InputProps<Type>) {
    const [hasValue, setHasValue] = useState<boolean>(false);
    const [isInvalid, setIsInvalid] = useState<boolean>(false);
    const inputID = useId();

    const handleChange = (event: FormEvent<HTMLInputElement>) => {
        const input = event.currentTarget.value;
        try {
            const parsedValue = parseValue(input);
            onChange(parsedValue);
            setIsInvalid(false);
            setHasValue(true);
        } catch {
            setHasValue(false);
            setIsInvalid(true);
            onChange(undefined);
        }
    };

    return (
        <Container className={className}>
            <label htmlFor={inputID}>{label}</label>
            <InputContainer>
                <StyledInput
                    id={inputID}
                    inputMode={inputMode}
                    onChange={handleChange}
                    aria-invalid={isInvalid}
                    palette={palette}
                />
                {clearIconLabel && hasValue ? (
                    <IconContainer
                        role="button"
                        aria-label={clearIconLabel}
                        tabIndex={0}
                    >
                        <FontAwesomeIcon icon={faTimes} role="button" />
                    </IconContainer>
                ) : null}
            </InputContainer>
            {isInvalid && errorMessage ? (
                <span role="alert">{errorMessage}</span>
            ) : null}
        </Container>
    );
}

export { Input };
