import React, { MouseEventHandler, useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useDebounce } from "use-debounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faSort,
    faSortAsc,
    faSortDesc,
} from "@fortawesome/free-solid-svg-icons";

import {
    RequirementsTable,
    TextColumnHeader,
    Header,
    SortableHeader,
    TableContainer,
} from "./styles";
import { gql } from "../../../../graphql/__generated__";
import {
    CreatorOverride,
    OutputUnit,
    Tools,
} from "../../../../graphql/__generated__/graphql";
import { DEFAULT_DEBOUNCE, isUserError } from "../../utils";
import { RequirementRow } from "./RequirementRow";
import {
    ValidSortDirections,
    removeSelectedItemRows,
    sortBy,
    sortDirectionOrderMap,
    mapRequirementsToRows,
    toggleBreakdown,
} from "./utils";
import { RequirementsTableRow } from "./types";

type RequirementsProps = {
    selectedItemName: string;
    workers: number;
    maxAvailableTool?: Tools;
    creatorOverrides?: CreatorOverride[];
    unit?: OutputUnit;
};

const sortDirectionIconMap: { [key in ValidSortDirections]: IconDefinition } = {
    none: faSort,
    descending: faSortDesc,
    ascending: faSortAsc,
};

const GET_ITEM_REQUIREMENTS = gql(`
    query GetItemRequirements($name: ID!, $workers: Int!, $maxAvailableTool: Tools, $creatorOverrides: [CreatorOverride!], $unit: OutputUnit) {
        requirement(name: $name, workers: $workers, maxAvailableTool: $maxAvailableTool, creatorOverrides: $creatorOverrides, unit: $unit) {
            ... on Requirements {
                requirements {
                    name
                    amount
                    creators {
                        name
                        creator
                        workers
                        amount
                        demands {
                            name
                            amount
                        }
                    }
                }
            }
            ... on UserError {
                message
            }
        }
    }
`);

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

    const toggleRowExpansion = (key: string) => {
        const updated = toggleBreakdown(key, rows);
        setRows([...updated]);
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
        if (!data?.requirement || isUserError(data.requirement)) {
            return;
        }

        const filtered = removeSelectedItemRows(
            selectedItemName,
            data.requirement.requirements
        );
        setRows(mapRequirementsToRows(filtered));
    }, [data]);

    if (error) {
        return (
            <span role="alert">
                An error occurred while fetching requirements, please change
                item/workers and try again.
            </span>
        );
    }

    if (data?.requirement && isUserError(data.requirement)) {
        return <span role="alert">{data.requirement.message}</span>;
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
            <TableContainer>
                <RequirementsTable>
                    <thead>
                        <tr>
                            <TextColumnHeader>Item</TextColumnHeader>
                            <TextColumnHeader>Creator</TextColumnHeader>
                            <TextColumnHeader>Demand</TextColumnHeader>
                            <SortableHeader
                                item-alignment="end"
                                aria-sort={amountSortDirection}
                                onClick={changeAmountSortDirection}
                                tabIndex={0}
                            >
                                <button>Amount</button>
                                <FontAwesomeIcon
                                    icon={
                                        sortDirectionIconMap[
                                            amountSortDirection
                                        ]
                                    }
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
                                    icon={
                                        sortDirectionIconMap[
                                            workerSortDirection
                                        ]
                                    }
                                    aria-hidden="true"
                                />
                            </SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((requirement) => (
                            <RequirementRow
                                key={requirement.name}
                                row={requirement}
                                toggleBreakdown={toggleRowExpansion}
                            />
                        ))}
                    </tbody>
                </RequirementsTable>
            </TableContainer>
        </>
    );
}

export { Requirements };
