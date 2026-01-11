import styled, { css } from "styled-components";

export const Container = styled.div`
    position: relative;
    display: inline-block;
`;

export const LanguageButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: inherit;
    display: flex;
    align-items: center;
`;

type DropdownProps = {
    $isOpen: boolean;
};

export const Dropdown = styled.ul<DropdownProps>`
    ${({ theme, $isOpen }) => css`
        display: ${$isOpen ? "inline-block" : "none"};
        background-color: ${theme.color.secondary.container};
        border: 2px solid ${theme.color.secondary.outline};
        color: ${theme.color.secondary.on_container};
    `}

    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 0.5rem;
    padding: 0.25rem 0;
    border-radius: 0.25rem;
    min-width: 150px;
    max-height: 16rem;
    overflow-y: auto;
    z-index: 1;
    list-style-type: none;
    cursor: pointer;
`;

type LanguageOptionProps = {
    $isActive: boolean;
    $isHighlighted: boolean;
};

export const LanguageOption = styled.li<LanguageOptionProps>`
    ${({ theme, $isActive, $isHighlighted }) => css`
        background-color: ${$isActive || $isHighlighted
            ? theme.color.secondary.outline
            : "transparent"};
        font-weight: ${$isActive ? "bold" : "normal"};

        &:hover {
            background-color: ${theme.color.secondary.outline};
        }

        &:not(:first-child) {
            border-top: 2px solid ${theme.color.secondary.outline};
        }
    `}

    padding: 0.5rem;
    cursor: pointer;
`;
