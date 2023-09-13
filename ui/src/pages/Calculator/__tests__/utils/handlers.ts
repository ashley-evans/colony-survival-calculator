import { graphql } from "msw";
import {
    GetItemRequirementsQuery,
    GetOptimalOutputQuery,
    Requirement,
} from "../../../../graphql/__generated__/graphql";
import {
    expectedOutputQueryName,
    expectedRequirementsQueryName,
} from "./constants";

const createRequirementsResponseHandler = (requirements: Requirement[]) =>
    graphql.query<GetItemRequirementsQuery>(
        expectedRequirementsQueryName,
        (_, res, ctx) => {
            return res(
                ctx.data({
                    requirement: {
                        __typename: "Requirements",
                        requirements,
                    },
                })
            );
        }
    );

const createRequirementsUserErrorHandler = (message: string) =>
    graphql.query<GetItemRequirementsQuery>(
        expectedRequirementsQueryName,
        (_, res, ctx) => {
            return res(
                ctx.data({
                    requirement: {
                        __typename: "UserError",
                        message,
                    },
                })
            );
        }
    );

const createRequirementsUnexpectedErrorHandler = (message: string) =>
    graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
        return res(ctx.errors([{ message: message }]));
    });

const createOutputResponseHandler = (amount: number) =>
    graphql.query<GetOptimalOutputQuery>(
        expectedOutputQueryName,
        (_, res, ctx) => {
            return res(
                ctx.data({ output: { __typename: "OptimalOutput", amount } })
            );
        }
    );

const createOutputUserErrorHandler = (message: string) =>
    graphql.query<GetOptimalOutputQuery>(
        expectedOutputQueryName,
        (_, res, ctx) => {
            return res(
                ctx.data({ output: { __typename: "UserError", message } })
            );
        }
    );

const createOutputUnexpectedErrorHandler = (message: string) =>
    graphql.query(expectedOutputQueryName, (_, res, ctx) => {
        return res(ctx.errors([{ message: message }]));
    });

export {
    createRequirementsResponseHandler,
    createRequirementsUserErrorHandler,
    createRequirementsUnexpectedErrorHandler,
    createOutputResponseHandler,
    createOutputUserErrorHandler,
    createOutputUnexpectedErrorHandler,
};
