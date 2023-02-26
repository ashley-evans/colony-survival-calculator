import "styled-components";

type KeyColor = {
    main: string;
    on_main: string;
    container: string;
    on_container: string;
};

type SurfaceTone = {
    main: string;
    on_main: string;
};

declare module "styled-components" {
    export interface DefaultTheme {
        container: {
            padding: string;
        };
        color: {
            primary: KeyColor;
            secondary: KeyColor;
            tertiary: KeyColor;
            error: KeyColor;
            background: SurfaceTone;
            surface: SurfaceTone;
            surface_variant: SurfaceTone;
            outline: string;
        };
        typography: {
            family: string;
        };
    }
}
