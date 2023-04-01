import React from "react";
import { useQuery } from "@apollo/client";

import {
    RequirementsTable,
    TextColumnHeader,
    TextColumnCell,
    NumberColumnHeader,
    NumberColumnCell,
} from "./styles";
import { gql } from "../../../../graphql/__generated__";

type RequirementsProps = {
    selectedItemName: string;
    workers: number;
};

const GET_ITEM_REQUIREMENTS = gql(`
    query GetItemRequirements($name: ID!, $workers: Int!) {
        requirement(name: $name, workers: $workers) {
            name
            workers
        }
    }
`);

function Requirements({ selectedItemName, workers }: RequirementsProps) {
    const { loading, data } = useQuery(GET_ITEM_REQUIREMENTS, {
        variables: { name: selectedItemName, workers },
    });

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
                                {requirement.workers}
                            </NumberColumnCell>
                        </tr>
                    ))}
                </tbody>
            </RequirementsTable>
        </>
    );
}

export { Requirements };
