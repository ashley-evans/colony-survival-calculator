import styled, { css } from "styled-components";

export const Header = styled.h2`
    margin-bottom: 0rem;
`;

export const RequirementsTable = styled.table`
    background-color: ${(props) => props.theme.color.tertiary.container};
    border-radius: 0.5rem;

    th {
        padding: 1rem 0.5rem;
        border-bottom: 1.5px solid
            ${(props) => props.theme.color.tertiary.on_container};
    }

    td {
        padding: 1rem 0.5rem;
    }

    tbody > tr:not(:last-child) > td {
        border-bottom: 1px solid
            ${(props) => props.theme.color.tertiary.on_container};
    }
`;

export const TextColumnHeader = styled.th`
    text-align: start;
`;

type SortableHeaderProps = {
    "item-alignment": "start" | "end";
};

export const SortableHeader = styled.th<SortableHeaderProps>`
        ${({ "item-alignment": itemAlignment, theme }) => css`
            text-align: ${itemAlignment};

            button {
                color: ${theme.color.surface.on_main};
            }
        `}

        cursor: pointer;

        button {
            border: none;
            background: none;
            margin-right: 0.5rem;
            font-weight: bold;
            padding: 0;
        }
    }
`;

export const TextColumnCell = styled.td`
    text-align: start;
`;

export const NumberColumnCell = styled.td`
    text-align: end;
`;

export const ExpandRowIconContainer = styled.span`
    cursor: pointer;
    margin-right: 0.5rem;
`;
