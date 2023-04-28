import React, { FormEvent, HTMLAttributes, useState } from "react";

import { Container, LabelContainer, Input as StyledInput } from "./styles";
import { ColorPalettes } from "../..";

type InputProps<Type> = Pick<HTMLAttributes<HTMLInputElement>, "inputMode"> & {
    label: string;
    onChange: (value?: Type) => void;
    parseValue: (value: unknown) => Type;
    errorMessage?: string;
    palette?: ColorPalettes;
    className?: string;
};

function Input<Type>({
    label,
    onChange,
    parseValue,
    errorMessage,
    inputMode,
    palette = "secondary",
    className,
}: InputProps<Type>) {
    const [isInvalid, setIsInvalid] = useState<boolean>(false);

    const handleChange = (event: FormEvent<HTMLInputElement>) => {
        const input = event.currentTarget.value;
        try {
            const parsedValue = parseValue(input);
            onChange(parsedValue);
            setIsInvalid(false);
        } catch {
            setIsInvalid(true);
            onChange(undefined);
        }
    };

    return (
        <Container className={className}>
            <LabelContainer>
                {label}
                <StyledInput
                    inputMode={inputMode}
                    onChange={handleChange}
                    aria-invalid={isInvalid}
                    palette={palette}
                />
            </LabelContainer>
            {isInvalid && errorMessage ? (
                <span role="alert">{errorMessage}</span>
            ) : null}
        </Container>
    );
}

export { Input };
