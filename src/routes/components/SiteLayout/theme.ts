import { DefaultTheme } from "styled-components";

const common: Pick<DefaultTheme, "container"> = {
    container: {
        padding: "1rem",
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
