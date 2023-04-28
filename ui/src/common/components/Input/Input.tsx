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
    const [value, setValue] = useState<string>("");
    const [isInvalid, setIsInvalid] = useState<boolean>(false);
    const inputID = useId();

    const handleInputChange = (event: FormEvent<HTMLInputElement>) => {
        const input = event.currentTarget.value;
        setValue(input);

        try {
            const parsedValue = parseValue(input);
            onChange(parsedValue);
            setIsInvalid(false);
        } catch {
            setIsInvalid(true);
            onChange(undefined);
        }
    };

    const handleInputClear = () => {
        setValue("");
        onChange(undefined);
    };

    return (
        <Container className={className}>
            <label htmlFor={inputID}>{label}</label>
            <InputContainer>
                <StyledInput
                    id={inputID}
                    inputMode={inputMode}
                    value={value}
                    onChange={handleInputChange}
                    aria-invalid={isInvalid}
                    palette={palette}
                />
                {clearIconLabel && value ? (
                    <IconContainer
                        role="button"
                        aria-label={clearIconLabel}
                        tabIndex={0}
                        onClick={handleInputClear}
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
