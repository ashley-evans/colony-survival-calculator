import { DefaultTheme } from "styled-components";
import "@fontsource/roboto-mono";

const common: Pick<DefaultTheme, "container" | "typography"> = {
    container: {
        padding: "1rem",
    },
    typography: {
        family: "Roboto Mono",
    },
};

const darkTheme: DefaultTheme = {
    ...common,
    color: {
        primary: {
            main: "#5bd5fa",
            on_main: "#003543",
            container: "#004e60",
            on_container: "#b6ebff",
        },
        secondary: {
            main: "#b3cad4",
            on_main: "#1e333b",
            container: "#344a52",
            on_container: "#cfe6f0",
        },
        tertiary: {
            main: "#c2c3eb",
            on_main: "#2b2e4d",
            container: "#424465",
            on_container: "#e0e0ff",
        },
        error: {
            main: "#ffb4ab",
            on_main: "#690005",
            container: "#93000a",
            on_container: "#ffdad6",
        },
        background: {
            main: "#191c1d",
            on_main: "#e1e3e4",
        },
        surface: {
            main: "#191c1d",
            on_main: "#e1e3e4",
        },
        surface_variant: {
            main: "#40484c",
            on_main: "#bfc8cc",
        },
        outline: "#8a9296",
    },
};

export { darkTheme };
