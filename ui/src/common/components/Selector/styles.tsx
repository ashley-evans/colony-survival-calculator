import styled, { css } from "styled-components";

import { ColorPallettes } from "../../types";
import {
    FontAwesomeIcon,
    FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";

type CommonProps = {
    pallette: ColorPallettes;
};

export const Container = styled.div<CommonProps>`
    position: relative;
    display: flex;
    flex-direction: column;
`;

export const ToggleButton = styled.div<CommonProps>`
    ${({ theme, pallette }) => css`
        color: ${theme.color[pallette].on_container};
        background-color: ${theme.color[pallette].container};
        border: 1px solid ${theme.color[pallette].container};

        :hover,
        :focus-within {
            border-color: ${theme.color[pallette].on_container};
        }
    `};

    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
`;

interface ToggleIndicatorIconProps extends FontAwesomeIconProps {
    selected: boolean;
}

export const ToggleIndicatorIcon = styled(
    FontAwesomeIcon
)<ToggleIndicatorIconProps>`
    ${({ selected }) => {
        if (selected) {
            return css`
                transform: scaleY(-1);
            `;
        }
    }}

    transition: all 0.2s ease-in;
`;

type MenuProps = {
    isOpen: boolean;
} & CommonProps;

export const Menu = styled.div<MenuProps>`
    ${({ theme, isOpen, pallette }) => css`
        color: ${theme.color[pallette].on_container};
        background-color: ${theme.color[pallette].container};
        display: ${!isOpen ? "none" : "inline-block"};
    `};

    position: absolute;
    z-index: 1;
    width: 100%;
    margin-top: 4rem;
    padding: 0.25rem 0rem;
    border-radius: 0.25rem;
    list-style-type: none;
`;

export const Item = styled.li<CommonProps>`
    ${({ theme, pallette }) => css`
        :hover {
            background-color: ${theme.color[pallette].outline};
        }
    `};

    padding: 0.5rem;
`;
