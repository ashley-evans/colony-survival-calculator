import styled, { css } from "styled-components";
import {
    FontAwesomeIcon,
    FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";

import { ColorPalettes } from "../../types";

type CommonProps = {
    palette: ColorPalettes;
};

export const Container = styled.div<CommonProps>`
    position: relative;
    display: flex;
    flex-direction: column;
`;

export const SelectorInputContainer = styled.div<CommonProps>`
    ${({ theme, palette }) => css`
        color: ${theme.color[palette].on_container};
        background-color: ${theme.color[palette].container};
        border: 1px solid ${theme.color[palette].container};

        :hover,
        :focus-within {
            border-color: ${theme.color[palette].on_container};
        }
    `};

    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
`;

type MenuProps = {
    isOpen: boolean;
} & CommonProps;

export const Menu = styled.div<MenuProps>`
    ${({ theme, isOpen, palette }) => css`
        color: ${theme.color[palette].on_container};
        background-color: ${theme.color[palette].container};
        border: 2px solid ${theme.color[palette].outline};
        display: ${!isOpen ? "none" : "inline-block"};
    `};

    position: absolute;
    z-index: 1;
    width: 100%;
    top: 100%;
    margin-top: 0.5rem;
    padding: 0.25rem 0rem;
    border-radius: 0.25rem;
    list-style-type: none;
    cursor: pointer;
    max-height: 12rem;
    overflow-y: auto;
`;

export const Item = styled.li<CommonProps>`
    ${({ theme, palette }) => css`
        :hover {
            background-color: ${theme.color[palette].outline};
        }

        :not(:first-child) {
            border-top: 2px solid ${theme.color[palette].outline};
        }
    `};

    padding: 0.5rem;
`;

export const Input = styled.input`
    width: 100%;
    outline: none;
    border: none;
    background: inherit;
    color: inherit;
`;

export const InputIconContainer = styled.div`
    display: flex;
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
    cursor: pointer;
`;

export const ClearInputIcon = styled(FontAwesomeIcon)`
    ${({ theme }) => css`
        :hover,
        :focus {
            color: ${theme.color.error.main};
        }
    `}

    margin-right: 0.5rem;
    cursor: pointer;
`;

export const Label = styled.label`
    margin-bottom: 0.2rem;
`;
