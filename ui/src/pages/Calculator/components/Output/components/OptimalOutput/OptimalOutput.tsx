import React from "react";

import { OutputUnit } from "../../../../../../graphql/__generated__/graphql";
import { DesiredOutputText } from "./styles";
import { OutputUnitDisplayMappings, roundOutput } from "../../../../utils";

type OptimalOutputProps = {
    amount: number;
    unit: OutputUnit;
};

function createOutputMessage(output: number, unit: OutputUnit): string {
    const unitDisplayString = OutputUnitDisplayMappings[unit];
    return `Optimal output: ${roundOutput(output)} per ${unitDisplayString}`;
}

function OptimalOutput({ amount, unit }: OptimalOutputProps) {
    return (
        <DesiredOutputText>
            {createOutputMessage(amount, unit)}
        </DesiredOutputText>
    );
}

export { OptimalOutput };
