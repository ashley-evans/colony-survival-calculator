import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { useDebounce } from "use-debounce";

import { gql } from "../../../../graphql/__generated__";
import { OutputUnit, Tools } from "../../../../graphql/__generated__/graphql";
import { DesiredOutputText } from "./styles";
import {
    DEFAULT_DEBOUNCE,
    OutputUnitDisplayMappings,
    roundOutput,
} from "../../utils";

type OptimalOutputProps = {
    itemName: string;
    workers: number;
    outputUnit: OutputUnit;
    maxAvailableTool?: Tools;
};

const GET_OPTIMAL_OUTPUT = gql(`
    query GetOptimalOutput($name: ID!, $workers: Int!, $unit: OutputUnit!, $maxAvailableTool: Tools) {
        output(name: $name, workers: $workers, unit: $unit, maxAvailableTool: $maxAvailableTool)
    }
`);

function createOutputMessage(output: number, unit: OutputUnit): string {
    const unitDisplayString = OutputUnitDisplayMappings[unit];
    return `Optimal output: ${roundOutput(output)} per ${unitDisplayString}`;
}

function OptimalOutput({
    itemName,
    workers,
    outputUnit,
    maxAvailableTool,
}: OptimalOutputProps) {
    const [getOptimalOutput, { data, error }] =
        useLazyQuery(GET_OPTIMAL_OUTPUT);
    const [debouncedWorkers] = useDebounce(workers, DEFAULT_DEBOUNCE);

    useEffect(() => {
        getOptimalOutput({
            variables: {
                name: itemName,
                workers: debouncedWorkers,
                unit: outputUnit,
                maxAvailableTool,
            },
        });
    }, [itemName, debouncedWorkers, outputUnit, maxAvailableTool]);

    if (error) {
        return (
            <span role="alert">
                An error occurred while calculating optimal output, please
                change item/workers/output unit and try again.
            </span>
        );
    }

    if (!data?.output) {
        return <></>;
    }

    return (
        <DesiredOutputText>
            {createOutputMessage(data.output, outputUnit)}
        </DesiredOutputText>
    );
}

export { OptimalOutput };
