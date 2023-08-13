import { ByRoleMatcher, act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
    expectedItemSelectLabel,
    expectedOutputUnitLabel,
    expectedToolSelectLabel,
    expectedWorkerInputLabel,
} from "./constants";
import { OutputUnit, Tools } from "../../../../graphql/__generated__/graphql";
import { OutputUnitSelectorMappings, ToolSelectorMappings } from "../../utils";
import { selectOption } from "../../../../test";

async function selectItemAndWorkers({
    itemName,
    workers,
    clear = false,
}: {
    itemName?: string;
    workers?: number | string;
    clear?: boolean;
}) {
    const user = userEvent.setup();
    const workerInput = await screen.findByLabelText(expectedWorkerInputLabel, {
        selector: "input",
    });

    await act(async () => {
        if (clear) {
            await user.clear(workerInput);
        }

        if (workers) {
            await user.type(workerInput, workers.toString());
        }
    });

    if (itemName) {
        await selectOption({
            label: expectedItemSelectLabel,
            optionName: itemName,
        });
    }
}

async function selectOutputUnit(unit: OutputUnit) {
    return selectOption({
        label: expectedOutputUnitLabel,
        optionName: OutputUnitSelectorMappings[unit],
    });
}

async function selectTool(tool: Tools) {
    return selectOption({
        label: expectedToolSelectLabel,
        optionName: ToolSelectorMappings[tool],
    });
}

async function clickByName(name: string, matcher: ByRoleMatcher) {
    const user = userEvent.setup();
    const tab = await screen.findByRole(matcher, { name });

    await act(() => user.click(tab));
}

export { clickByName, selectItemAndWorkers, selectOutputUnit, selectTool };
