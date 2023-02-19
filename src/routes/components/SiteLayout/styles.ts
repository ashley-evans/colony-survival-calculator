import styled from "styled-components";

export const Banner = styled.div`
    width: 100%;
    background: ${(props) => props.theme.color.banner};
`;

export const SiteHeader = styled.h1`
    margin: 0;
    padding: ${(props) => props.theme.container.padding};
`;

export const SiteTheme = styled.div`
    height: 100%;
    color: ${(props) => props.theme.color.text};

    h1,
    h2 {
        margin: 0;
    }
`;

export const ContentWrapper = styled.div`
    background: ${(props) => props.theme.color.background};
    padding: ${(props) => props.theme.container.padding};

    height: 100%;
`;
