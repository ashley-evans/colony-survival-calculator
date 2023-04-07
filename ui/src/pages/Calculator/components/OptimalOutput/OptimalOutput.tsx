import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { useDebounce } from "use-debounce";

import { gql } from "../../../../graphql/__generated__";
import { OutputUnit } from "../../../../graphql/__generated__/graphql";
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
};

const GET_OPTIMAL_OUTPUT = gql(`
    query GetOptimalOutput($name: ID!, $workers: Int!, $unit: OutputUnit!) {
        output(name: $name, workers: $workers, unit: $unit)
    }
`);

function createOutputMessage(output: number, unit: OutputUnit): string {
    const unitDisplayString = OutputUnitDisplayMappings[unit];
    return `Optimal output: ${roundOutput(output)} per ${unitDisplayString}`;
}

function OptimalOutput({ itemName, workers, outputUnit }: OptimalOutputProps) {
    const [getOptimalOutput, { data, error }] =
        useLazyQuery(GET_OPTIMAL_OUTPUT);
    const [debouncedWorkers] = useDebounce(workers, DEFAULT_DEBOUNCE);

    useEffect(() => {
        getOptimalOutput({
            variables: {
                name: itemName,
                workers: debouncedWorkers,
                unit: outputUnit,
            },
        });
    }, [itemName, debouncedWorkers, outputUnit]);

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
