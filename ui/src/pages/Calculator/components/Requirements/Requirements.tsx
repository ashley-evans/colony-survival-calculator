import React, { MouseEventHandler, useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useDebounce } from "use-debounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faMinus,
    faPlus,
    faSort,
    faSortAsc,
    faSortDesc,
} from "@fortawesome/free-solid-svg-icons";
import update from "immutability-helper";

import {
    RequirementsTable,
    TextColumnHeader,
    TextColumnCell,
    NumberColumnCell,
    Header,
    SortableHeader,
    ExpandRowIconContainer,
} from "./styles";
import { gql } from "../../../../graphql/__generated__";
import {
    CreatorOverride,
    GetItemRequirementsQuery,
    OutputUnit,
    Tools,
} from "../../../../graphql/__generated__/graphql";
import { DEFAULT_DEBOUNCE, roundOutput } from "../../utils";

export type SingleCreatorRequirementsTableRow = {
    name: string;
    creator: string;
    amount: number;
    workers: number;
};

export type MultipleCreatorRequirementsTableRow = Omit<
    SingleCreatorRequirementsTableRow,
    "creator"
> & {
    isExpanded: boolean;
};

export type RequirementsTableRow =
    | SingleCreatorRequirementsTableRow
    | MultipleCreatorRequirementsTableRow;

type SortableProperty = NonNullable<
    {
        [K in keyof RequirementsTableRow]: RequirementsTableRow[K] extends number
            ? K
            : never;
    }[keyof RequirementsTableRow]
>;

type ValidSortDirections = "none" | "ascending" | "descending";
type RequirementsProps = {
    selectedItemName: string;
    workers: number;
    maxAvailableTool?: Tools;
    creatorOverrides?: CreatorOverride[];
    unit?: OutputUnit;
};
type Requirements = GetItemRequirementsQuery["requirement"];

const sortDirectionOrderMap: {
    [key in ValidSortDirections]: ValidSortDirections;
} = {
    none: "descending",
    descending: "ascending",
    ascending: "none",
};

const sortDirectionIconMap: { [key in ValidSortDirections]: IconDefinition } = {
    none: faSort,
    descending: faSortDesc,
    ascending: faSortAsc,
};

const GET_ITEM_REQUIREMENTS = gql(`
    query GetItemRequirements($name: ID!, $workers: Int!, $maxAvailableTool: Tools, $creatorOverrides: [CreatorOverride!], $unit: OutputUnit) {
        requirement(name: $name, workers: $workers, maxAvailableTool: $maxAvailableTool, creatorOverrides: $creatorOverrides, unit: $unit) {
            name
            amount
            creators {
                name
                creator
                workers
                amount
            }
        }
    }
`);

function sortBy(
    requirements: Readonly<RequirementsTableRow[]>,
    order: ValidSortDirections,
    property: SortableProperty
): RequirementsTableRow[] {
    const reference = [...requirements];
    switch (order) {
        case "descending":
            return reference.sort((a, b) => b[property] - a[property]);
        case "ascending":
            return reference.sort((a, b) => a[property] - b[property]);
        default:
            return reference;
    }
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

function isSingleCreatorRow(
    row: RequirementsTableRow
): row is SingleCreatorRequirementsTableRow {
    const casted = row as SingleCreatorRequirementsTableRow;
    return casted.creator !== undefined;
}

function mapRequirementsToRow(
    requirements: Readonly<Requirements>
): RequirementsTableRow[] {
    return requirements.map((requirement) => {
        const totalWorkers = requirement.creators.reduce(
            (acc, current) => acc + current.workers,
            0
        );

        if (requirement.creators.length === 1) {
            return {
                name: requirement.name,
                creator: requirement.creators[0].creator,
                amount: requirement.amount,
                workers: totalWorkers,
            };
        }

        return {
            name: requirement.name,
            amount: requirement.amount,
            workers: totalWorkers,
            isExpanded: false,
        };
    });
}

function Requirements({
    selectedItemName,
    workers,
    maxAvailableTool,
    creatorOverrides,
    unit,
}: RequirementsProps) {
    const [getItemRequirements, { loading, data, error }] = useLazyQuery(
        GET_ITEM_REQUIREMENTS
    );
    const [amountSortDirection, setAmountSortDirection] =
        useState<ValidSortDirections>("none");
    const [workerSortDirection, setWorkerSortDirection] =
        useState<ValidSortDirections>("none");
    const [rows, setRows] = useState<RequirementsTableRow[]>([]);

    const [debouncedWorkers] = useDebounce(workers, DEFAULT_DEBOUNCE);

    const changeAmountSortDirection: MouseEventHandler = (event) => {
        event.stopPropagation();
        setWorkerSortDirection("none");
        setAmountSortDirection(sortDirectionOrderMap[amountSortDirection]);
    };

    const changeWorkerSortDirection: MouseEventHandler = (event) => {
        event.stopPropagation();
        setAmountSortDirection("none");
        setWorkerSortDirection(sortDirectionOrderMap[workerSortDirection]);
    };

    const toggleRowExpansion = (index: number) => {
        const row = rows[index];
        if (!isSingleCreatorRow(row)) {
            const updated = update(rows, {
                [index]: { isExpanded: { $set: !row.isExpanded } },
            });

            setRows(updated);
        }
    };

    useEffect(() => {
        const creatorOverridesFilter =
            creatorOverrides && creatorOverrides.length > 0
                ? creatorOverrides
                : undefined;

        getItemRequirements({
            variables: {
                name: selectedItemName,
                workers: debouncedWorkers,
                maxAvailableTool,
                creatorOverrides: creatorOverridesFilter,
                unit,
            },
        });
    }, [
        selectedItemName,
        debouncedWorkers,
        maxAvailableTool,
        creatorOverrides,
        unit,
    ]);

    useEffect(() => {
        const filtered = removeSelectedItemRows(
            selectedItemName,
            data?.requirement
        );

        setRows(mapRequirementsToRow(filtered));
    }, [data]);

    if (error) {
        return (
            <span role="alert">
                An error occurred while fetching requirements, please change
                item/workers and try again.
            </span>
        );
    }

    if (loading || rows.length === 0) {
        return <></>;
    }

    const sortedRows =
        workerSortDirection !== "none"
            ? sortBy(rows, workerSortDirection, "workers")
            : sortBy(rows, amountSortDirection, "amount");

    return (
        <>
            <Header>Requirements:</Header>
            <RequirementsTable>
                <thead>
                    <tr>
                        <TextColumnHeader>Item</TextColumnHeader>
                        <TextColumnHeader>Creator</TextColumnHeader>
                        <SortableHeader
                            item-alignment="end"
                            aria-sort={amountSortDirection}
                            onClick={changeAmountSortDirection}
                            tabIndex={0}
                        >
                            <button>Amount</button>
                            <FontAwesomeIcon
                                icon={sortDirectionIconMap[amountSortDirection]}
                                aria-hidden="true"
                            />
                        </SortableHeader>
                        <SortableHeader
                            item-alignment="end"
                            aria-sort={workerSortDirection}
                            onClick={changeWorkerSortDirection}
                            tabIndex={0}
                        >
                            <button>Workers</button>
                            <FontAwesomeIcon
                                icon={sortDirectionIconMap[workerSortDirection]}
                                aria-hidden="true"
                            />
                        </SortableHeader>
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.map((requirement, index) => (
                        <tr key={requirement.name}>
                            {isSingleCreatorRow(requirement) ? (
                                <TextColumnCell>
                                    {requirement.name}
                                </TextColumnCell>
                            ) : (
                                <TextColumnCell>
                                    {requirement.isExpanded ? (
                                        <ExpandRowIconContainer
                                            role="button"
                                            aria-label={
                                                "Collapse creator breakdown"
                                            }
                                            tabIndex={0}
                                            onClick={() =>
                                                toggleRowExpansion(index)
                                            }
                                        >
                                            <FontAwesomeIcon icon={faMinus} />
                                        </ExpandRowIconContainer>
                                    ) : (
                                        <ExpandRowIconContainer
                                            role="button"
                                            aria-label={
                                                "Expand creator breakdown"
                                            }
                                            tabIndex={0}
                                            onClick={() =>
                                                toggleRowExpansion(index)
                                            }
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                        </ExpandRowIconContainer>
                                    )}

                                    {requirement.name}
                                </TextColumnCell>
                            )}

                            <TextColumnCell>
                                {isSingleCreatorRow(requirement)
                                    ? requirement.creator
                                    : ""}
                            </TextColumnCell>
                            <NumberColumnCell>
                                {roundOutput(requirement.amount)}
                            </NumberColumnCell>
                            <NumberColumnCell>
                                {Math.ceil(requirement.workers)}
                            </NumberColumnCell>
                        </tr>
                    ))}
                </tbody>
            </RequirementsTable>
        </>
    );
}

export { Requirements };
