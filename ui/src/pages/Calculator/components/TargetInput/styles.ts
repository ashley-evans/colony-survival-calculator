import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled, { css } from "styled-components";

export const TargetInputContainer = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;

    row-gap: 1rem;
    column-gap: 1rem;
`;

export const ExchangeIcon = styled(FontAwesomeIcon)`
    height: 1.5rem;
    flex: 0 0 auto;
`;

export const InputWrapper = styled.div`
    align-self: flex-start;
    flex: 1 0 33%;

    ${({ theme }) => css`
        @media (max-width: ${theme.breakpoints.mobile}) {
            flex-basis: 100%;
        }
    `}
`;
