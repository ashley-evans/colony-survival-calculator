import styled, { css } from "styled-components";
import ToolSelector from "./components/ToolSelector";
import Checkbox from "../../common/components/Checkbox";

export const PageContainer = styled.div``;

export const Tabs = styled.div`
    button[role="tab"] {
        background-color: inherit;
        border-width: 0.1rem 0.1rem 0 0.1rem;
        border-style: solid;
        padding: 0.5rem;
        cursor: pointer;

        &:first-child {
            border-top-left-radius: 0.4rem;
        }

        &:last-child {
            border-width: 0.1rem 0.1rem 0 0;
            border-top-right-radius: 0.4rem;
        }

        ${({ theme }) => css`
            color: ${theme.color.background.on_main};
            border-color: ${theme.color.surface_variant.main};

            &[aria-selected="true"] {
                background-color: ${theme.color.surface_variant.main};
                cursor: default;
            }
        `};
    }
`;

export const TabContainer = styled.div`
    ${({ theme }) => css`
        border: 0.1rem solid ${theme.color.surface_variant.main};
    `};

    display: flex;
    flex-direction: column;

    padding: 0.5rem;
    row-gap: 0.75rem;
    border-radius: 0 0.4rem 0.4rem 0.4rem;
`;

export const TabHeader = styled.h2`
    margin-top: 0rem;
    margin-bottom: 0rem;
`;

export const DefaultToolSelector = styled(ToolSelector)``;

export const MachineToolCheckbox = styled(Checkbox)``;
