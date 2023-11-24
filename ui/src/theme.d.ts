import "styled-components";

type KeyColor = {
    main: string;
    on_main: string;
    container: string;
    on_container: string;
    outline: string;
};

type SurfaceTone = {
    main: string;
    on_main: string;
};

declare module "styled-components" {
    export interface DefaultTheme {
        type: "light" | "dark";
        container: {
            padding: string;
        };
        color: {
            primary: KeyColor;
            secondary: KeyColor;
            tertiary: KeyColor;
            error: Omit<KeyColor, "outline">;
            background: SurfaceTone;
            surface: SurfaceTone;
            surface_variant: SurfaceTone;
        };
        typography: {
            family: string;
        };
        breakpoints: {
            mobile: string;
        };
    }
}

export type { KeyColor };
