import styled, { css } from "styled-components";

import { ColorPalettes } from "../../types";

export const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

export const LabelContainer = styled.label`
    display: flex;
    flex-direction: column;
`;

type InputProps = {
    palette: ColorPalettes;
};

export const Input = styled.input<InputProps>`
    ${({ theme, palette, "aria-invalid": invalid }) => css`
        color: ${theme.color[palette].on_container};
        background-color: ${theme.color[palette].container};
        border: 1px solid ${theme.color[palette].container};

        :hover,
        :focus {
            border-color: ${theme.color[palette].on_container};
        }

        ${invalid &&
        css`
            border-color: ${theme.color.error.main};

            :hover,
            :focus {
                border-color: ${theme.color.error.main};
            }
        `}
    `}

    padding: 0.5rem;
    border-radius: 0.25rem;
    outline: none;
`;
