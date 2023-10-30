import styled, { css } from "styled-components";
import { ColorPalettes } from "../..";

type PaletteProps = {
    palette: ColorPalettes;
};

export const Container = styled.div`
    display: flex;
    align-items: center;
`;

export const StyledCheckbox = styled.input<PaletteProps>`
    ${({ theme, palette }) => css`
        border: 1px solid ${theme.color[palette].container};
        background-color: ${theme.color[palette].container};

        :hover {
            border-color: ${theme.color[palette].on_container};
        }

        ::before {
            content: "";
            width: 60%;
            height: 60%;
        }

        :checked::before {
            background-color: ${theme.color[palette].on_container};
            clip-path: polygon(
                14% 44%,
                0 65%,
                50% 100%,
                100% 16%,
                80% 0%,
                43% 62%
            );
        }
    `}

    appearance: none;
    margin: 0 0 0 0.5rem;
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;
