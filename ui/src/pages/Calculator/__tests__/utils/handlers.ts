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
            }),
    );

const createCalculatorOutputUserErrorHandler = (input: {
    errorCode: string;
    details?: Record<string, unknown>;
}) => {
    return graphql.query<GetCalculatorOutputQuery>(
        expectedCalculatorOutputQueryName,
        () =>
            HttpResponse.json({
                data: {
                    requirement: {
                        __typename: "UserError",
                        code: input.errorCode,
                        details: input.details
                            ? JSON.stringify(input.details)
                            : null,
                    },
                },
            }),
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
