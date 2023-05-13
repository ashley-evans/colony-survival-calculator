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
import { Tools } from "../../../../graphql/__generated__/graphql";
import { DEFAULT_DEBOUNCE } from "../../utils";

type ValidSortDirections = "none" | "ascending" | "descending";
type RequirementsProps = {
    selectedItemName: string;
    workers: number;
    maxAvailableTool?: Tools;
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
    query GetItemRequirements($name: ID!, $workers: Int!, $maxAvailableTool: Tools) {
        requirement(name: $name, workers: $workers, maxAvailableTool: $maxAvailableTool) {
            name
            workers
        }
    }
`);

function Requirements({
    selectedItemName,
    workers,
    maxAvailableTool,
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
        getItemRequirements({
            variables: {
                name: selectedItemName,
                workers: debouncedWorkers,
                maxAvailableTool,
            },
        });
    }, [selectedItemName, debouncedWorkers, maxAvailableTool]);

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

    return (
        <>
            <Header>Requirements:</Header>
            <RequirementsTable>
                <thead>
                    <tr>
                        <TextColumnHeader>Item</TextColumnHeader>
                        <SortableHeader
                            text-align="end"
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
                    {data.requirement.map((requirement) => (
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
