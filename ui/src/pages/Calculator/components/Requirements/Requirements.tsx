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
    TextColumnCell,
    NumberColumnCell,
    Header,
    SortableHeader,
} from "./styles";
import { gql } from "../../../../graphql/__generated__";
import {
    CreatorOverride,
    GetItemRequirementsQuery,
    Tools,
} from "../../../../graphql/__generated__/graphql";
import { DEFAULT_DEBOUNCE, roundOutput } from "../../utils";

export type RequirementsTableRow = {
    name: string;
    amount: number;
    workers: number;
};

type SortableProperty = {
    [K in keyof RequirementsTableRow]: RequirementsTableRow[K] extends number
        ? K
        : never;
}[keyof RequirementsTableRow];

type ValidSortDirections = "none" | "ascending" | "descending";
type RequirementsProps = {
    selectedItemName: string;
    workers: number;
    maxAvailableTool?: Tools;
    creatorOverrides?: CreatorOverride[];
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
    query GetItemRequirements($name: ID!, $workers: Int!, $maxAvailableTool: Tools, $creatorOverrides: [CreatorOverride!]) {
        requirement(name: $name, workers: $workers, maxAvailableTool: $maxAvailableTool, creatorOverrides: $creatorOverrides) {
            name
            amount
            creators {
                name
                workers
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
): Readonly<Requirements> {
    if (!requirements) {
        return [];
    }

    return requirements.reduce((acc, current) => {
        if (current.name !== selectedItemName) {
            const filteredCreators = current.creators.filter(
                (creator) => creator.name !== selectedItemName
            );
            acc.push({
                ...current,
                creators: filteredCreators,
            });
        }

        return acc;
    }, [] as Requirements);
}

function mapRequirementsToRow(
    requirements: Readonly<Requirements>
): Readonly<RequirementsTableRow[]> {
    return requirements.map((requirement) => {
        const totalWorkers = requirement.creators.reduce(
            (acc, current) => acc + current.workers,
            0
        );

        return {
            name: requirement.name,
            amount: requirement.amount,
            workers: totalWorkers,
        };
    });
}

function Requirements({
    selectedItemName,
    workers,
    maxAvailableTool,
    creatorOverrides,
}: RequirementsProps) {
    const [getItemRequirements, { loading, data, error }] = useLazyQuery(
        GET_ITEM_REQUIREMENTS
    );
    const [amountSortDirection, setAmountSortDirection] =
        useState<ValidSortDirections>("none");
    const [workerSortDirection, setWorkerSortDirection] =
        useState<ValidSortDirections>("none");

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
            },
        });
    }, [
        selectedItemName,
        debouncedWorkers,
        maxAvailableTool,
        creatorOverrides,
    ]);

    if (error) {
        return (
            <span role="alert">
                An error occurred while fetching requirements, please change
                item/workers and try again.
            </span>
        );
    }

    const filtered = removeSelectedItemRows(
        selectedItemName,
        data?.requirement
    );

    if (loading || filtered.length === 0) {
        return <></>;
    }

    const rows = mapRequirementsToRow(filtered);
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
                    {sortedRows.map((requirement) => (
                        <tr key={requirement.name}>
                            <TextColumnCell>{requirement.name}</TextColumnCell>
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
