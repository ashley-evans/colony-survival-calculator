import "styled-components";

declare module "styled-components" {
    export interface DefaultTheme {
        container: {
            padding: string;
        };
        color: {
            banner: string;
            background: string;
            text: string;
        };
        typography: {
            family: string;
        };
    }
}
