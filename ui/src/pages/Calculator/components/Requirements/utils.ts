import {
    RequirementsTableRow,
    SortableFields,
    isSingleCreatorRow,
} from "./RequirementRow";

export type ValidSortDirections = "none" | "ascending" | "descending";

const sortDirectionOrderMap: {
    [key in ValidSortDirections]: ValidSortDirections;
} = {
    none: "descending",
    descending: "ascending",
    ascending: "none",
};

function sortBy(
    unsorted: Readonly<RequirementsTableRow[]>,
    order: ValidSortDirections,
    property: keyof SortableFields
): RequirementsTableRow[] {
    const sort = <T extends SortableFields>(unsorted: Readonly<T[]>) => {
        const reference = [...unsorted];
        switch (order) {
            case "descending":
                return reference.sort((a, b) => b[property] - a[property]);
            case "ascending":
                return reference.sort((a, b) => a[property] - b[property]);
            default:
                return reference;
        }
    };

    const sortedCreators = unsorted.map((current) => {
        if (isSingleCreatorRow(current)) {
            return current;
        }

        return {
            ...current,
            creatorBreakdownRows: sort(current.creatorBreakdownRows),
        };
    });

    return sort(sortedCreators);
}

export { sortDirectionOrderMap, sortBy };
