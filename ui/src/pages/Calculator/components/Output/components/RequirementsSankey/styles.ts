import styled, { css } from "styled-components";

type SankeyContainerProps = {
    height: number;
};

export const SankeyContainer = styled.div<SankeyContainerProps>`
    ${({ height }) => css`
        height: ${height}rem;
    `}

    color: black;
`;
