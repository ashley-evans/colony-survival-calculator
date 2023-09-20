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

const lightTheme: DefaultTheme = {
    ...common,
    type: "light",
    color: {
        primary: {
            main: "#00677f",
            on_main: "#ffffff",
            container: "#b6ebff",
            on_container: "#001f28",
            outline: "#7adcf1",
        },
        secondary: {
            main: "#4c626a",
            on_main: "#ffffff",
            container: "#cfe6f0",
            on_container: "#071e26",
            outline: "#8ca7b7",
        },
        tertiary: {
            main: "#5a5c7e",
            on_main: "#ffffff",
            container: "#e0e0ff",
            on_container: "#161937",
            outline: "#a4a4ff",
        },
        error: {
            main: "#ba1a1a",
            on_main: "#ffffff",
            container: "#ffdad6",
            on_container: "#410002",
        },
        background: {
            main: "#fbfcfe",
            on_main: "#191c1d",
        },
        surface: {
            main: "#fbfcfe",
            on_main: "#191c1d",
        },
        surface_variant: {
            main: "#dbe4e8",
            on_main: "#40484c",
        },
    },
};

const darkTheme: DefaultTheme = {
    ...common,
    type: "dark",
    color: {
        primary: {
            main: "#5bd5fa",
            on_main: "#003543",
            container: "#004e60",
            on_container: "#b6ebff",
            outline: "#00a2c2",
        },
        secondary: {
            main: "#b3cad4",
            on_main: "#1e333b",
            container: "#344a52",
            on_container: "#cfe6f0",
            outline: "#3d5c6e",
        },
        tertiary: {
            main: "#c2c3eb",
            on_main: "#2b2e4d",
            container: "#424465",
            on_container: "#e0e0ff",
            outline: "#7b7abf",
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
    },
};

export { darkTheme, lightTheme };
