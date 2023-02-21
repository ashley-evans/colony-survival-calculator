import "styled-components";

declare module "styled-components" {
    export interface DefaultTheme {
        container: {
            padding: string;
        };
        color: {
            banner: string;
            background: string;
            foreground: string;
            text: string;
            text_hover: string;
            primary: string;
            error: string;
        };
        typography: {
            family: string;
        };
    }
}
