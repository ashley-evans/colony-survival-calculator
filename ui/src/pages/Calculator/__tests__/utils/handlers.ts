import { HttpResponse, graphql } from "msw";
import {
    GetCalculatorOutputQuery,
    Requirement,
} from "../../../../graphql/__generated__/graphql";
import { expectedCalculatorOutputQueryName } from "./constants";

const createCalculatorOutputResponseHandler = (requirements: Requirement[]) =>
    graphql.query<GetCalculatorOutputQuery>(
        expectedCalculatorOutputQueryName,
        () =>
            HttpResponse.json({
                data: {
                    requirement: { __typename: "Requirements", requirements },
                },
            })
    );

const createCalculatorOutputUserErrorHandler = (input: {
    requirementsUserError: string;
}) => {
    return graphql.query<GetCalculatorOutputQuery>(
        expectedCalculatorOutputQueryName,
        () =>
            HttpResponse.json({
                data: {
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
