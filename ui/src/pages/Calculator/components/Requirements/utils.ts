import update from "immutability-helper";

import {
    CreatorBreakdownTableRow,
    DemandTableRow,
    Requirements,
    RequirementsTableRow,
    RowType,
    SortableFields,
} from "./types";

export type ValidSortDirections = "none" | "ascending" | "descending";

const sortDirectionOrderMap: {
    [key in ValidSortDirections]: ValidSortDirections;
} = {
    none: "descending",
    descending: "ascending",
    ascending: "none",
};

type NumberProperties<T> = {
    [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

function sortBy(
    unsorted: Readonly<RequirementsTableRow[]>,
    order: ValidSortDirections,
    property: keyof SortableFields
): RequirementsTableRow[] {
    const sort = <U>(unsorted: U[], property: NumberProperties<U>) => {
        const reference = [...unsorted];

        switch (order) {
            case "descending":
                return reference.sort(
                    (a, b) => (b[property] as number) - (a[property] as number)
                );
            case "ascending":
                return reference.sort(
                    (a, b) => (a[property] as number) - (b[property] as number)
                );
            default:
                return reference;
        }
    };

    const sortDemands = (demands: DemandTableRow[]): DemandTableRow[] =>
        property === "amount" ? sort(demands, "amount") : demands;

    const sortCreatorBreakdown = (
        breakdown: CreatorBreakdownTableRow
    ): CreatorBreakdownTableRow =>
        breakdown.type === RowType.CreatorBreakdown
            ? { ...breakdown, demands: sortDemands(breakdown.demands) }
            : breakdown;

    const sortedBreakdowns = unsorted.map((current) => {
        switch (current.type) {
            case RowType.SingleCreator:
                return {
                    ...current,
                    demands: sortDemands(current.demands),
                };
            case RowType.MultipleCreator: {
                const breakdownsWithSortedDemands =
                    current.creatorBreakdownRows.map((breakdown) =>
                        sortCreatorBreakdown(breakdown)
                    );

                const sortedBreakdowns = sort(
                    breakdownsWithSortedDemands,
                    property
                );
                return { ...current, creatorBreakdownRows: sortedBreakdowns };
            }
            default:
                return current;
        }
    });

    return sort(sortedBreakdowns, property);
}

function mapRequirementsToRows(
    requirements: Readonly<Requirements>
): RequirementsTableRow[] {
    return requirements.reduce((acc, requirement) => {
        const totalWorkers = requirement.creators.reduce(
            (acc, current) => acc + current.workers,
            0
        );

        if (requirement.creators.length === 1) {
            const breakdown = requirement.creators[0];

            acc.push({
                key: requirement.name,
                type: RowType.SingleCreator,
                isExpanded: false,
                name: requirement.name,
                creator: breakdown.creator,
                amount: requirement.amount,
                workers: totalWorkers,
                demands: breakdown.demands.map((demand) => ({
                    ...demand,
                    key: `${breakdown.name}-${breakdown.creator}-${demand.name}`,
                    type: RowType.Demand,
                })),
            });
            return acc;
        }

        acc.push({
            key: requirement.name,
            type: RowType.MultipleCreator,
            isExpanded: false,
            name: requirement.name,
            amount: requirement.amount,
            workers: totalWorkers,
            creatorBreakdownRows: requirement.creators.map((breakdown) => ({
                key: `${breakdown.name}-${breakdown.creator}`,
                type: RowType.CreatorBreakdown,
                isExpanded: false,
                creator: breakdown.creator,
                amount: breakdown.amount,
                workers: breakdown.workers,
                demands: breakdown.demands.map((demand) => ({
                    ...demand,
                    key: `${breakdown.name}-${breakdown.creator}-${demand.name}`,
                    type: RowType.Demand,
                })),
            })),
        });

        return acc;
    }, [] as RequirementsTableRow[]);
}

function removeSelectedItemRows(
    selectedItemName: string,
    requirements: Readonly<Requirements> | undefined
): Requirements {
    if (!requirements) {
        return [];
    }

    return requirements.reduce((acc, current) => {
        if (current.name !== selectedItemName) {
            acc.push({
                ...current,
            });
        }

        return acc;
    }, [] as Requirements);
}

type CreatorRowIndex = {
    type: RowType.SingleCreator | RowType.MultipleCreator;
    index: number;
};
type BreakdownRowIndex = {
    type: RowType.CreatorBreakdown;
    index: number;
    breakdownIndex: number;
};

function findRowIndex(
    key: string,
    rows: Readonly<RequirementsTableRow[]>
): CreatorRowIndex | BreakdownRowIndex | undefined {
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.key === key) {
            return { type: row.type, index: i };
        }

        if (row.type === RowType.MultipleCreator) {
            for (let j = 0; j < row.creatorBreakdownRows.length; j++) {
                const breakdown = row.creatorBreakdownRows[j];
                if (breakdown.key === key) {
                    return {
                        type: breakdown.type,
                        index: i,
                        breakdownIndex: j,
                    };
                }
            }
        }
    }

    return undefined;
}

function toggleBreakdown(
    key: string,
    rows: Readonly<RequirementsTableRow[]>
): Readonly<RequirementsTableRow[]> {
    const indices = findRowIndex(key, rows);
    if (!indices) {
        return rows;
    }

    switch (indices.type) {
        case RowType.CreatorBreakdown:
            return update(rows, {
                [indices.index]: {
                    creatorBreakdownRows: {
                        [indices.breakdownIndex]: { $toggle: ["isExpanded"] },
                    },
                },
            });
        default:
            return update(rows, {
                [indices.index]: {
                    $toggle: ["isExpanded"],
                },
            });
    }
}

export {
    sortDirectionOrderMap,
    sortBy,
    mapRequirementsToRows,
    removeSelectedItemRows,
    toggleBreakdown,
};
