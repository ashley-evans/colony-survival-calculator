import styled from "styled-components";

export const CalculatorContainer = styled.div`
    display: flex;
    flex-direction: column;

    * {
        margin-bottom: 0.75rem;
    }
`;

export const CalculatorHeader = styled.h2`
    margin-top: 0;
`;

export const DesiredOutputText = styled.span`
    color: ${(props) => props.theme.color.primary};
    font-weight: bold;
`;
