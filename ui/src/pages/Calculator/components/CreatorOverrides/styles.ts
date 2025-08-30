import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled, { css } from "styled-components";

export const OverrideListContainer = styled.div`
    max-width: 50rem;
    width: 100%;

    display: flex;
    flex-direction: column;

    > :not(:first-child) {
        margin-top: 1rem;
    }
`;

export const LargeAddButton = styled.button`
    ${({ theme }) => css`
        color: ${theme.color.primary.on_container};
        background-color: ${theme.color.primary.container};
        border: 1px solid ${theme.color.primary.container};

        &:hover {
            border-color: ${theme.color.primary.on_container};
        }
    `};

    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
`;

export const RemoveButtonContainer = styled.div`
    display: flex;
    align-items: flex-end;
`;

export const RemoveButton = styled.button`
    ${({ theme }) => css`
        color: ${theme.color.error.on_container};
        background-color: ${theme.color.error.container};
        border: 1px solid ${theme.color.error.container};

        &:hover {
            border-color: ${theme.color.error.on_container};
        }
    `};

    display: flex;
    flex: 1;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
`;

export const Icon = styled(FontAwesomeIcon)`
    margin-left: 0.5rem;
`;

export const OverrideContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.5rem;
    row-gap: 0.5rem;

    > div {
        flex: 1 0 16rem;
    }
`;
