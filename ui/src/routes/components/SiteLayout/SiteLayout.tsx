import { useEffect, useState } from "react";
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

const DARK_THEME_MEDIA_MATCH = "(prefers-color-scheme: dark)";
const LIGHT_THEME_MEDIA_MATCH = "(prefers-color-scheme: light)";

function SiteLayout() {
    const [isDarkTheme, setDarkTheme] = useState<boolean>(true);

    useEffect(() => {
        function handleColourSchemePreference(
            event: Pick<MediaQueryListEvent, "matches" | "media">,
        ) {
            if (event.matches) {
                setDarkTheme(event.media === DARK_THEME_MEDIA_MATCH);
            }
        }

        const darkPreferenceMatcher = window.matchMedia(DARK_THEME_MEDIA_MATCH);
        const lightPreferenceMatcher = window.matchMedia(
            LIGHT_THEME_MEDIA_MATCH,
        );

        handleColourSchemePreference(lightPreferenceMatcher);

        darkPreferenceMatcher.addEventListener(
            "change",
            handleColourSchemePreference,
        );
        lightPreferenceMatcher.addEventListener(
            "change",
            handleColourSchemePreference,
        );

        return () => {
            darkPreferenceMatcher.removeEventListener(
                "change",
                handleColourSchemePreference,
            );
            lightPreferenceMatcher.removeEventListener(
                "change",
                handleColourSchemePreference,
            );
        };
    }, []);

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
                            tabIndex={0}
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
                            aria-label="View the source code on GitHub"
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
