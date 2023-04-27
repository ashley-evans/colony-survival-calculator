import styled, { css } from "styled-components";

export const Container = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.color.secondary.on_container};
`;

export const ToggleButton = styled.div`
    ${({ theme }) => css`
        background-color: ${theme.color.secondary.container};
        border: 1px solid ${theme.color.secondary.container};

        :hover,
        :focus-within {
            border-color: ${theme.color.secondary.on_container};
        }
    `};

    padding: 0.5rem;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
`;

type MenuProps = {
    isOpen: boolean;
};

export const Menu = styled.div<MenuProps>`
    ${({ theme, isOpen }) => css`
        background-color: ${theme.color.secondary.container};
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

export const Item = styled.li`
    ${({ theme }) => css`
        :hover {
            background-color: ${theme.color.secondary.outline};
        }
    `};

    padding: 0.5rem;
`;
