import { HttpResponse, graphql } from "msw";
import {
    GetCalculatorOutputQuery,
    Requirement,
} from "../../../../graphql/__generated__/graphql";
import { expectedCalculatorOutputQueryName } from "./constants";

const createCalculatorOutputResponseHandler = (
    requirements: Requirement[],
    amount: number
) =>
    graphql.query<GetCalculatorOutputQuery>(
        expectedCalculatorOutputQueryName,
        () =>
            HttpResponse.json({
                data: {
                    output: { __typename: "OptimalOutput", amount },
                    requirement: { __typename: "Requirements", requirements },
                },
            })
    );

const createCalculatorOutputUserErrorHandler = (
    input:
        | { amount: number; requirementsUserError: string }
        | { requirements: Requirement[]; amountUserError: string }
        | { requirementsUserError: string; amountUserError: string }
) => {
    if ("amount" in input) {
        return graphql.query<GetCalculatorOutputQuery>(
            expectedCalculatorOutputQueryName,
            () =>
                HttpResponse.json({
                    data: {
                        output: {
                            __typename: "OptimalOutput",
                            amount: input.amount,
                        },
                        requirement: {
                            __typename: "UserError",
                            message: input.requirementsUserError,
                        },
                    },
                })
        );
    } else if ("requirements" in input) {
        return graphql.query<GetCalculatorOutputQuery>(
            expectedCalculatorOutputQueryName,
            () =>
                HttpResponse.json({
                    data: {
                        output: {
                            __typename: "UserError",
                            message: input.amountUserError,
                        },
                        requirement: {
                            __typename: "Requirements",
                            requirements: input.requirements,
                        },
                    },
                })
        );
    }

    return graphql.query<GetCalculatorOutputQuery>(
        expectedCalculatorOutputQueryName,
        () =>
            HttpResponse.json({
                data: {
                    output: {
                        __typename: "UserError",
                        message: input.amountUserError,
                    },
                    requirement: {
                        __typename: "UserError",
                        message: input.requirementsUserError,
                    },
                },
            })
    );
};

const createCalculatorOutputErrorHandler = (message: string) =>
    graphql.query(expectedCalculatorOutputQueryName, () => {
        return HttpResponse.json({ errors: [{ message }] });
    });

export {
    createCalculatorOutputResponseHandler,
    createCalculatorOutputUserErrorHandler,
    createCalculatorOutputErrorHandler,
};
