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
    Requirement,
    Tools,
} from "../../../../graphql/__generated__/graphql";
import { DEFAULT_DEBOUNCE } from "../../utils";

type ValidSortDirections = "none" | "ascending" | "descending";
type RequirementsProps = {
    selectedItemName: string;
    workers: number;
    maxAvailableTool?: Tools;
    creatorOverrides?: CreatorOverride[];
};

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
            workers
        }
    }
`);

function sortByWorkers(
    requirements: Readonly<Requirement[]>,
    order: ValidSortDirections
): Requirement[] {
    const reference = [...requirements];
    switch (order) {
        case "descending":
            return reference.sort((a, b) => b.workers - a.workers);
        case "ascending":
            return reference.sort((a, b) => a.workers - b.workers);
        default:
            return reference;
    }
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
    const [workerSortDirection, setWorkerSortDirection] =
        useState<ValidSortDirections>("none");

    const [debouncedWorkers] = useDebounce(workers, DEFAULT_DEBOUNCE);

    const changeWorkerSortDirection: MouseEventHandler = (event) => {
        event.stopPropagation();
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

    if (loading || !data || data.requirement.length === 0) {
        return <></>;
    }

    const sortedWorkers = sortByWorkers(data.requirement, workerSortDirection);

    return (
        <>
            <Header>Requirements:</Header>
            <RequirementsTable>
                <thead>
                    <tr>
                        <TextColumnHeader>Item</TextColumnHeader>
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
                    {sortedWorkers.map((requirement) => (
                        <tr key={requirement.name}>
                            <TextColumnCell>{requirement.name}</TextColumnCell>
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
