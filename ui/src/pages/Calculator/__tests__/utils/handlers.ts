import { graphql } from "msw";
import {
    GetItemRequirementsQuery,
    Requirement,
} from "../../../../graphql/__generated__/graphql";
import { expectedRequirementsQueryName } from "./constants";

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
        return res.once(ctx.errors([{ message: message }]));
    });

export {
    createRequirementsResponseHandler,
    createRequirementsUserErrorHandler,
    createRequirementsUnexpectedErrorHandler,
};
