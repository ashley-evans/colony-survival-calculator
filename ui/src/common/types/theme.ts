import { DefaultTheme } from "styled-components";
import { KeyColor } from "../../theme";

type KeyColorKeys<T> = {
    [K in keyof T]: T[K] extends KeyColor ? K : never;
}[keyof T];

type ColorPallettes = KeyColorKeys<DefaultTheme["color"]>;

export type { ColorPallettes };
