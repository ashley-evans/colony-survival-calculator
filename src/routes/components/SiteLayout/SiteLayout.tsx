import React from "react";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import { darkTheme } from "./theme";
import { Banner, SiteHeader, SiteTheme, ContentWrapper } from "./styles";

function SiteLayout() {
    return (
        <ThemeProvider theme={darkTheme}>
            <SiteTheme>
                <Banner>
                    <SiteHeader>Colony Survival Calculator</SiteHeader>
                </Banner>

                <ContentWrapper>
                    <Outlet />
                </ContentWrapper>
            </SiteTheme>
        </ThemeProvider>
    );
}

export default SiteLayout;
