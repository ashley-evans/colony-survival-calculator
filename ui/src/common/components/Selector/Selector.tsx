import React from "react";
import Select, {
    Props,
    GroupBase,
    StylesConfig,
    CSSObjectWithLabel,
} from "react-select";
import { useTheme } from "styled-components";

function Selector<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>
>(props: Omit<Props<Option, IsMulti, Group>, "styles">) {
    const theme = useTheme();

    const styles: StylesConfig<Option, IsMulti, Group> = {
        control: (base) => ({
            ...base,
            color: theme.color.surface.on_main,
            background: theme.color.secondary.container,
            ":hover": {
                ...base[":hover"],
                borderColor: theme.color.secondary.on_container,
            },
            ":focus-within": {
                ...base[":focus-within"],
                borderColor: theme.color.secondary.on_container,
            },
            borderColor: theme.color.secondary.container,
            boxShadow: "none",
        }),
        input: (base) => ({ ...base, color: "inherit" }),
        noOptionsMessage: (base) => ({
            ...base,
            color: "inherit",
        }),
        indicatorSeparator: (base) => ({
            ...base,
            background: theme.color.surface.on_main,
        }),
        dropdownIndicator: (base) => ({
            ...base,
            color: "inherit",
        }),
        menuList: (base) => ({
            ...base,
            background: theme.color.secondary.container,
            color: "inherit",
        }),
        singleValue: (base) => ({
            ...base,
            color: "inherit",
        }),
        option: (base, { isFocused }) => {
            let css: CSSObjectWithLabel = {
                ...base,
                color: "inherit",
                backgroundColor: "inherit",
                borderColor: "green",
                border: 4,
            };

            if (isFocused) {
                css = { ...css, backgroundColor: theme.color.outline };
            }

            return css;
        },
    };

    return <Select {...props} styles={styles} />;
}

export { Selector };
