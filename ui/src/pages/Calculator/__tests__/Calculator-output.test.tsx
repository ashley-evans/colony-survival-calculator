import React from "react";
import { graphql, rest } from "msw";
import { setupServer } from "msw/node";
import { screen } from "@testing-library/react";

import { renderWithTestProviders as render } from "../../../test/utils";
import { STATIC_ITEMS_PATH } from "../../../utils";
import { Item } from "../../../types";
import { waitForRequest } from "../../../helpers/utils";
import {
    expectedOutputPrefix,
    expectedOutputQueryName,
    expectedRequirementsQueryName,
    selectItemAndWorkers,
    selectOutputUnit,
} from "./utils";
import Calculator from "../Calculator";
import { OutputUnit } from "../../../graphql/__generated__/graphql";

const expectedGraphQLAPIURL = "http://localhost:3000/graphql";
const item: Item = {
    name: "Item 1",
    createTime: 2,
    output: 1,
    requires: [],
};

const server = setupServer(
    rest.get(STATIC_ITEMS_PATH, (_, res, ctx) => {
        return res(ctx.json([item]));
    }),
    graphql.query(expectedRequirementsQueryName, (_, res, ctx) => {
        return res(ctx.data({ requirement: [] }));
    }),
    graphql.query(expectedOutputQueryName, (_, res, ctx) => {
        return res(ctx.data({ output: 5.2 }));
    })
);

beforeAll(() => {
    server.listen();
});

beforeEach(() => {
    server.resetHandlers();
    server.events.removeAllListeners();
});

test.each(["Minutes", "Game days"])(
    "renders the %s option in the output unit selector",
    async (unit: string) => {
        render(<Calculator />, expectedGraphQLAPIURL);

        expect(
            await screen.findByRole("option", {
                name: unit,
            })
        ).toBeInTheDocument();
    }
);

test("selects the Minutes option by default", async () => {
    render(<Calculator />, expectedGraphQLAPIURL);

    expect(
        await screen.findByRole("option", {
            name: "Minutes",
            selected: true,
        })
    ).toBeInTheDocument();
});

test("queries optimal output if item and workers inputted with default unit selected", async () => {
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedOutputQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    const [, body] = await expectedRequest;

    expect(body?.variables).toEqual({
        name: item.name,
        workers: expectedWorkers,
        unit: OutputUnit.Minutes,
    });
});

test("queries optimal output if item annd workers inputted with non-default unit selected", async () => {
    const expectedWorkers = 5;
    const expectedRequest = waitForRequest(
        server,
        "POST",
        expectedGraphQLAPIURL,
        expectedOutputQueryName
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOutputUnit(OutputUnit.GameDays);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: expectedWorkers,
    });
    const [, body] = await expectedRequest;

    expect(body?.variables).toEqual({
        name: item.name,
        workers: expectedWorkers,
        unit: OutputUnit.GameDays,
    });
});

test("does not render the optimal output message if output has not been received yet", async () => {
    server.use(
        graphql.query(expectedOutputQueryName, (_, res, ctx) => {
            return res(ctx.delay("infinite"));
        })
    );

    render(<Calculator />, expectedGraphQLAPIURL);
    await selectOutputUnit(OutputUnit.GameDays);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: 5,
    });

    expect(
        screen.queryByText(expectedOutputPrefix, { exact: false })
    ).not.toBeInTheDocument();
});

test.each([
    ["minutes", OutputUnit.Minutes, 5, "minute"],
    ["game days", OutputUnit.GameDays, 60, "game day"],
])(
    "renders the optimal output in %s if selected",
    async (
        _: string,
        selectedUnit: OutputUnit,
        expected: number,
        expectedUnit: string
    ) => {
        const expectedOutput = `${expectedOutputPrefix} ${expected} per ${expectedUnit}`;
        server.use(
            graphql.query(expectedOutputQueryName, (_, res, ctx) => {
                return res(ctx.data({ output: expected }));
            })
        );

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectOutputUnit(selectedUnit);
        await selectItemAndWorkers({
            itemName: item.name,
            workers: 5,
        });

        expect(await screen.findByText(expectedOutput)).toBeVisible();
    }
);

test("rounds optimal output to 1 decimals if more than 1 decimal places", async () => {
    const expectedOutput = `${expectedOutputPrefix} ≈28.2 per minute`;
    server.use(
        graphql.query(expectedOutputQueryName, (_, res, ctx) => {
            return res(ctx.data({ output: 28.2356 }));
        })
    );

    render(<Calculator />);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: 5,
    });

    expect(await screen.findByText(expectedOutput)).toBeVisible();
});

test("does not show approx symbol if optimal output is only accurate to 1 decimal place", async () => {
    const output = 28.1;
    const expectedOutput = `${expectedOutputPrefix} ${output} per minute`;
    server.use(
        graphql.query(expectedOutputQueryName, (_, res, ctx) => {
            return res(ctx.data({ output }));
        })
    );

    render(<Calculator />);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: 5,
    });

    expect(await screen.findByText(expectedOutput)).toBeVisible();
});

test("clears the optimal output message if the workers is changed to an invalid value", async () => {
    const output = 28.1;
    const expectedOutput = `${expectedOutputPrefix} ${output} per minute`;
    server.use(
        graphql.query(expectedOutputQueryName, (_, res, ctx) => {
            return res(ctx.data({ output }));
        })
    );

    render(<Calculator />);
    await selectItemAndWorkers({
        itemName: item.name,
        workers: 5,
    });
    await screen.findByText(expectedOutput);
    await selectItemAndWorkers({ workers: "wibble", clear: true });

    expect(
        screen.queryByText(expectedOutputPrefix, { exact: false })
    ).not.toBeInTheDocument();
});

describe("error handling", async () => {
    beforeEach(() => {
        server.use(
            graphql.query(expectedOutputQueryName, (_, res, ctx) => {
                return res.once(ctx.errors([{ message: "Error Message" }]));
            })
        );
    });

    test("renders an error message if an error occurs while fetching optimal output", async () => {
        const expectedErrorMessage =
            "An error occurred while calculating optimal output, please change item/workers/output unit and try again.";

        render(<Calculator />, expectedGraphQLAPIURL);
        await selectItemAndWorkers({
            itemName: item.name,
            workers: 5,
        });

        expect(await screen.findByRole("alert")).toHaveTextContent(
            expectedErrorMessage
        );
    });

    test("does not render the optimal output message if an error occurs while fetching optimal output", async () => {
        render(<Calculator />);
        await selectItemAndWorkers({
            itemName: item.name,
            workers: 5,
        });
        await screen.findByRole("alert");

        expect(
            screen.queryByText(expectedOutputPrefix, { exact: false })
        ).not.toBeInTheDocument();
    });
});

afterAll(() => {
    server.close();
});
