import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { useDebounce } from "use-debounce";

import {
    RequirementsTable,
    TextColumnHeader,
    TextColumnCell,
    NumberColumnHeader,
    NumberColumnCell,
} from "./styles";
import { gql } from "../../../../graphql/__generated__";
import { Tools } from "../../../../graphql/__generated__/graphql";
import { DEFAULT_DEBOUNCE } from "../../utils";

type RequirementsProps = {
    selectedItemName: string;
    workers: number;
    maxAvailableTool?: Tools;
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
    const [debouncedWorkers] = useDebounce(workers, DEFAULT_DEBOUNCE);

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
            <h2>Requirements:</h2>
            <RequirementsTable>
                <thead>
                    <tr>
                        <TextColumnHeader>Item</TextColumnHeader>
                        <NumberColumnHeader>Workers</NumberColumnHeader>
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
