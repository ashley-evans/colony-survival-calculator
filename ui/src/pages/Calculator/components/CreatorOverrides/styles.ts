import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled, { css } from "styled-components";

export const OverrideListContainer = styled.div`
    max-width: 25rem;
    width: 100%;

    display: flex;
    flex-direction: column;
`;

export const LargeAddButton = styled.button`
    ${({ theme }) => css`
        color: ${theme.color.primary.on_container};
        background-color: ${theme.color.primary.container};
        border: 1px solid ${theme.color.primary.container};

        :hover {
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

export const AddIcon = styled(FontAwesomeIcon)`
    margin-left: 0.5rem;
`;

export const OverrideContainer = styled.div`
    display: flex;
    column-gap: 0.5rem;

    div {
        flex: 1;
    }
`;
