import styled from "styled-components";

export const RequirementsTable = styled.table`
    background-color: ${(props) => props.theme.color.foreground};
    border-radius: 0.5rem;

    th {
        padding: 1rem 0.5rem;
        border-bottom: 2px solid ${(props) => props.theme.color.background};
    }

    td {
        padding: 1rem 0.5rem;
    }

    tbody > tr:not(:last-child) > td {
        border-bottom: 1px solid ${(props) => props.theme.color.background};
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
