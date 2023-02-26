import styled from "styled-components";

export const RequirementsTable = styled.table`
    background-color: ${(props) => props.theme.color.secondary.container};
    border-radius: 0.5rem;

    th {
        padding: 1rem 0.5rem;
        border-bottom: 1.5px solid
            ${(props) => props.theme.color.secondary.on_container};
    }

    td {
        padding: 1rem 0.5rem;
    }

    tbody > tr:not(:last-child) > td {
        border-bottom: 1px solid
            ${(props) => props.theme.color.secondary.on_container};
    }
`;

export const TextColumnHeader = styled.th`
    text-align: start;
`;

export const NumberColumnHeader = styled.th`
    text-align: end;
`;

export const TextColumnCell = styled.td`
    text-align: start;
`;

export const NumberColumnCell = styled.td`
    text-align: end;
`;
