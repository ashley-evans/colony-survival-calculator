export type SortableFields = {
    amount: number;
    workers: number;
};

export type SingleCreatorRequirementsTableRow = SortableFields & {
    name: string;
    creator: string;
};

export type MultipleCreatorRequirementsTableRow = Omit<
    SingleCreatorRequirementsTableRow,
    "creator"
> & {
    isExpanded: boolean;
    creatorBreakdownRows: Omit<SingleCreatorRequirementsTableRow, "name">[];
};

export type RequirementsTableRow =
    | SingleCreatorRequirementsTableRow
    | MultipleCreatorRequirementsTableRow;

function isSingleCreatorRow(
    row: RequirementsTableRow
): row is SingleCreatorRequirementsTableRow {
    const casted = row as SingleCreatorRequirementsTableRow;
    return casted.creator !== undefined;
}

export { isSingleCreatorRow };
