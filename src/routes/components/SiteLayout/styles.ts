import styled, { css } from "styled-components";

export const Banner = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;

    a {
        transition: color 0.2s ease-in-out;
    }

    ${(props) => css`
        background: ${props.theme.color.surface_variant.main};
        padding: ${props.theme.container.padding};

        a:link,
        a:visited {
            color: ${props.theme.color.surface.on_main};
        }

        a:hover {
            color: ${props.theme.color.surface_variant.on_main};
        }
    `}
`;

export const SiteHeader = styled.h1`
    margin: 0;
`;

export const SiteTheme = styled.div`
    ${(props) => css`
        color: ${props.theme.color.background.on_main};
        font-family ${props.theme.typography.family};
    `}
`;

export const ContentWrapper = styled.div`
    min-height: 100vh;
    overflow-y: hidden;

    ${(props) => css`
        background: ${props.theme.color.background.main};
        padding: ${props.theme.container.padding};

        span[role="alert"] {
            color: ${props.theme.color.error.main};
        }
    `}
`;
