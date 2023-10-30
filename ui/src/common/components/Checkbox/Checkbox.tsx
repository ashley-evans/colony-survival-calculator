import React, { FormEvent, useId } from "react";
import { Container, StyledCheckbox } from "./styles";
import { ColorPalettes } from "../..";

type CheckboxProps = {
    label: string;
    onChange?: (value: boolean) => void;
    checked?: boolean;
    palette?: ColorPalettes;
    className?: string;
};

function Checkbox({
    label,
    onChange,
    checked,
    palette = "secondary",
    className,
}: CheckboxProps) {
    const checkboxID = useId();

    const handleCheckboxChange = (event: FormEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(event.currentTarget.checked);
        }
    };

    return (
        <Container className={className}>
            <label htmlFor={checkboxID}>{label}</label>
            <StyledCheckbox
                id={checkboxID}
                type="checkbox"
                defaultChecked={checked}
                onChange={handleCheckboxChange}
                palette={palette}
            />
        </Container>
    );
}

export { Checkbox };
