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
        banner: "#22223B",
        background: "#4A4E69",
        text: "white",
    },
};

export { darkTheme };
