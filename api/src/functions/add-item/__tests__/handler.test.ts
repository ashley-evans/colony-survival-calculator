import type { AppSyncResolverEvent } from "aws-lambda";
import { mock } from "jest-mock-extended";

import type { ItemInput } from "../../../graphql/schema";
import { handler } from "../handler";

function createEvent(name: string): AppSyncResolverEvent<ItemInput> {
    const event = mock<AppSyncResolverEvent<ItemInput>>();
    event.arguments = {
        name,
    };
    return event;
}

beforeAll(() => {
    jest.spyOn(console, "dir").mockImplementation(() => undefined);
});

test("returns the provided name as ID in response", async () => {
    const expected = "test";
    const event = createEvent(expected);

    const actual = await handler(event);

    expect(actual.id).toEqual(expected);
});
