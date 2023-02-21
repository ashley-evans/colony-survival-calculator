import styled, { css } from "styled-components";

export const Banner = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    ${(props) => css`
        background: ${props.theme.color.banner};
        padding: ${props.theme.container.padding};

        a:link,
        a:visited {
            color: ${props.theme.color.text};
        }
    `}
`;

export const SiteHeader = styled.h1`
    margin: 0;
`;

export const SiteTheme = styled.div`
    ${(props) => css`
        color: ${props.theme.color.text};
        font-family ${props.theme.typography.family};
    `}
`;

export const ContentWrapper = styled.div`
    height: 100vh;
    max-height: 100%;
    overflow-y: auto;

    ${(props) => css`
        background: ${props.theme.color.background};
        padding: ${props.theme.container.padding};

        span[role="alert"] {
            color: ${props.theme.color.error};
        }
    `}
`;
