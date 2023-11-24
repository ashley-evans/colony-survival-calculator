import { ByRoleMatcher, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
    expectedItemSelectLabel,
    expectedOutputUnitLabel,
    expectedTargetAmountInputLabel,
    expectedToolSelectLabel,
    expectedWorkerInputLabel,
} from "./constants";
import {
    AvailableTools,
    OutputUnit,
} from "../../../../graphql/__generated__/graphql";
import { OutputUnitSelectorMappings, ToolSelectorMappings } from "../../utils";
import { selectOption } from "../../../../test";

type SelectItemAndTargetBaseParams = {
    itemName?: string;
    clear?: boolean;
};

type SelectItemAndTargetParams =
    | (SelectItemAndTargetBaseParams & { workers?: number | string })
    | (SelectItemAndTargetBaseParams & { amount?: number | string });

async function selectItemAndTarget(input: SelectItemAndTargetParams) {
    const user = userEvent.setup();
    const workerInput = await screen.findByLabelText(expectedWorkerInputLabel, {
        selector: "input",
    });
    const amountInput = await screen.findByLabelText(
        expectedTargetAmountInputLabel,
        {
            selector: "input",
        }
    );

    if (input.clear) {
        await user.clear(workerInput);
        await user.clear(amountInput);
    }

    if ("workers" in input && input.workers) {
        await user.type(workerInput, input.workers.toString());
    }

    if ("amount" in input && input.amount) {
        await user.type(amountInput, input.amount.toString());
    }

    if (input.itemName) {
        await selectOption({
            label: expectedItemSelectLabel,
            optionName: input.itemName,
        });
    }
}

async function selectOutputUnit(unit: OutputUnit) {
    return selectOption({
        label: expectedOutputUnitLabel,
        optionName: OutputUnitSelectorMappings[unit],
    });
}

async function selectTool(tool: AvailableTools) {
    return selectOption({
        label: expectedToolSelectLabel,
        optionName: ToolSelectorMappings[tool],
    });
}

async function clickByName(name: string, matcher: ByRoleMatcher) {
    const user = userEvent.setup();
    const tab = await screen.findByRole(matcher, { name });

    await user.click(tab);
}

export { clickByName, selectItemAndTarget, selectOutputUnit, selectTool };
