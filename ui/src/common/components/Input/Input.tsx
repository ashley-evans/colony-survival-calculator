import React, { FormEvent, HTMLAttributes, useState } from "react";
import { Container, LabelContainer } from "./styles";

type InputProps<Type> = Pick<HTMLAttributes<HTMLInputElement>, "inputMode"> & {
    label: string;
    onChange: (value: Type) => void;
    isValid: (value: unknown) => value is Type;
    errorMessage?: string;
    className?: string;
};

function Input<Type>({
    label,
    onChange,
    isValid,
    errorMessage,
    inputMode,
    className,
}: InputProps<Type>) {
    const [isInvalid, setIsInvalid] = useState<boolean>(false);

    const handleChange = (event: FormEvent<HTMLInputElement>) => {
        const input = event.currentTarget.value;
        if (isValid(input)) {
            onChange(input);
            setIsInvalid(false);
        } else {
            setIsInvalid(true);
        }
    };

    return (
        <Container className={className}>
            <LabelContainer>
                {label}
                <input
                    inputMode={inputMode}
                    onChange={handleChange}
                    aria-invalid={isInvalid}
                />
            </LabelContainer>
            {isInvalid && errorMessage ? (
                <span role="alert">{errorMessage}</span>
            ) : null}
        </Container>
    );
}

export { Input };
