import styled, { css } from "styled-components";

import { ColorPalettes } from "../../types";

export const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

type InputContainerProps = {
    $palette: ColorPalettes;
};

export const InputContainer = styled.div<InputContainerProps>`
    ${({ theme, $palette }) => css`
        color: ${theme.color[$palette].on_container};
    `}

    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
`;

type InputProps = {
    $palette: ColorPalettes;
};

export const Input = styled.input<InputProps>`
    ${({ theme, $palette, "aria-invalid": invalid }) => css`
        color: ${theme.color[$palette].on_container};
        background-color: ${theme.color[$palette].container};
        border: 1px solid ${theme.color[$palette].container};

        &:hover,
        &:focus {
            border-color: ${theme.color[$palette].on_container};
        }

        ${invalid &&
        css`
            border-color: ${theme.color.error.main};

            &:hover,
            &:focus {
                border-color: ${theme.color.error.main};
            }
        `}
    `}

    padding: 0.5rem;
    border-radius: 0.25rem;
    outline: none;
`;

export const IconContainer = styled.span`
    ${({ theme }) => css`
        &:hover,
        &:focus {
            color: ${theme.color.error.main};
        }
    `}

    position: absolute;
    right: 0.7rem;
    cursor: pointer;
`;

export const Label = styled.label`
    margin-bottom: 0.2rem;
`;
