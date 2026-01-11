import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLazyQuery } from "@apollo/client/react";
import { useDebounce } from "use-debounce";

import {
    OutputUnit,
    AvailableTools,
    CreatorOverride,
} from "../../../../graphql/__generated__/graphql";
import { gql } from "../../../../graphql/__generated__";
import { DEFAULT_DEBOUNCE, isUserError } from "../../utils";
import { Requirements, RequirementsSankey } from "./components";
import { LoadingMessage } from "./styles";
import { Target } from "../TargetInput";
import { useErrorTranslation } from "../../../../hooks";

type OutputProps = {
    itemID: string;
    target: Target;
    outputUnit: OutputUnit;
    onSelectedItemTotalChange: (target: Target) => void;
    maxAvailableTool?: AvailableTools;
    hasMachineTools?: boolean;
    creatorOverrides?: CreatorOverride[];
};

type ErrorMessageProps = {
    children: ReactElement | string;
};

const GET_CALCULATOR_OUTPUT = gql(`
    query GetCalculatorOutput($id: ID!, $workers: Int, $amount: Float, $unit: OutputUnit!, $maxAvailableTool: AvailableTools, $hasMachineTools: Boolean, $creatorOverrides: [CreatorOverride!], $locale: String) {
        requirement(id: $id, workers: $workers, amount: $amount, maxAvailableTool: $maxAvailableTool, hasMachineTools: $hasMachineTools, creatorOverrides: $creatorOverrides, unit: $unit, locale: $locale) {
            ... on Requirements {
                requirements {
                    id
                    name
                    amount
                    creators {
                        id
                        name
                        creatorID
                        creator
                        workers
                        amount
                        demands {
                            id
                            name
                            amount
                        }
                    }
                }
            }
            ... on UserError {
                code
                details
            }
        }
    }
`);

function ErrorMessage({ children }: ErrorMessageProps) {
    return <span role="alert">{children}</span>;
}

function UnhandledErrorMessage() {
    const { t } = useTranslation();

    return (
        <ErrorMessage>{t("calculator.output.error.unhandled")}</ErrorMessage>
    );
}

function Output({
    itemID,
    target,
    outputUnit,
    maxAvailableTool,
    hasMachineTools,
    creatorOverrides,
    onSelectedItemTotalChange,
}: OutputProps) {
    const { t, i18n } = useTranslation();
    const translateError = useErrorTranslation();
    const [getCalculatorOutput, { loading, data, error }] = useLazyQuery(
        GET_CALCULATOR_OUTPUT,
        { fetchPolicy: "no-cache" },
    );
    const [debouncedTarget] = useDebounce(target, DEFAULT_DEBOUNCE);
    const [hasInvalidResponse, setHasInvalidResponse] = useState<boolean>();

    useEffect(() => {
        const creatorOverridesFilter =
            creatorOverrides && creatorOverrides.length > 0
                ? creatorOverrides
                : undefined;

        getCalculatorOutput({
            variables: {
                id: itemID,
                amount:
                    "amount" in debouncedTarget ? debouncedTarget.amount : null,
                workers:
                    "workers" in debouncedTarget
                        ? debouncedTarget.workers
                        : null,
                unit: outputUnit,
                maxAvailableTool,
                hasMachineTools,
                creatorOverrides: creatorOverridesFilter,
                locale: i18n.language,
            },
        });
    }, [
        itemID,
        debouncedTarget,
        outputUnit,
        maxAvailableTool,
        hasMachineTools,
        creatorOverrides,
        i18n.language,
    ]);

    useEffect(() => {
        if (!data?.requirement || isUserError(data.requirement)) {
            return;
        }

        const selectedItemRequirements = data.requirement.requirements.find(
            ({ id }) => id === itemID,
        );

        if (!selectedItemRequirements) {
            setHasInvalidResponse(true);
            return;
        }

        setHasInvalidResponse(false);
        if ("amount" in target) {
            const totalWorkers = selectedItemRequirements.creators.reduce(
                (acc, { workers }) => {
                    return acc + workers;
                },
                0,
            );
            onSelectedItemTotalChange({ workers: totalWorkers });
        } else {
            onSelectedItemTotalChange({
                amount: selectedItemRequirements.amount,
            });
        }
    }, [data?.requirement]);

    if (hasInvalidResponse || error) {
        return <UnhandledErrorMessage />;
    }

    if (loading || !data?.requirement) {
        return (
            <LoadingMessage>{t("calculator.output.loading")}</LoadingMessage>
        );
    }

    if (isUserError(data.requirement)) {
        return <ErrorMessage>{translateError(data.requirement)}</ErrorMessage>;
    }

    return (
        <>
            <Requirements requirements={data.requirement.requirements} />
            <RequirementsSankey
                requirements={data.requirement.requirements}
                selectedItemID={itemID}
            />
        </>
    );
}

export { Output };
