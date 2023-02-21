import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import { darkTheme } from "./theme";
import { Banner, SiteHeader, SiteTheme, ContentWrapper } from "./styles";

function SiteLayout() {
    return (
        <ThemeProvider theme={darkTheme}>
            <SiteTheme>
                <Banner>
                    <SiteHeader>Colony Survival Calculator</SiteHeader>
                    <Link
                        to={
                            "https://github.com/ashley-evans/colony-survival-calculator"
                        }
                    >
                        <FontAwesomeIcon icon={faGithub} size="2x" />
                    </Link>
                </Banner>

                <ContentWrapper>
                    <Outlet />
                </ContentWrapper>
            </SiteTheme>
        </ThemeProvider>
    );
}

export default SiteLayout;
