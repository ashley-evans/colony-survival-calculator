import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

import { darkTheme, lightTheme } from "./theme";
import {
    Banner,
    SiteHeader,
    SiteTheme,
    ContentWrapper,
    Icons,
    ThemeButton,
} from "./styles";

function SiteLayout() {
    const [isDarkTheme, setDarkTheme] = useState<boolean>(false);

    return (
        <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
            <SiteTheme>
                <Banner>
                    <SiteHeader>Colony Survival Calculator</SiteHeader>
                    <Icons>
                        <span
                            role="button"
                            aria-label={`Change to ${
                                isDarkTheme ? "light" : "dark"
                            } theme`}
                            onClick={() => setDarkTheme(!isDarkTheme)}
                        >
                            <ThemeButton
                                icon={isDarkTheme ? faSun : faMoon}
                                size="2x"
                            />
                        </span>

                        <Link
                            to={
                                "https://github.com/ashley-evans/colony-survival-calculator"
                            }
                        >
                            <FontAwesomeIcon icon={faGithub} size="2x" />
                        </Link>
                    </Icons>
                </Banner>

                <ContentWrapper>
                    <Outlet />
                </ContentWrapper>
            </SiteTheme>
        </ThemeProvider>
    );
}

export default SiteLayout;
