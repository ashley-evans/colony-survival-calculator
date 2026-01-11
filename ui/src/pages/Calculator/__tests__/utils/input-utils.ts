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
import { selectOption } from "../../../../test";

const ToolSelectorMappings: Readonly<Record<AvailableTools, string>> = {
    [AvailableTools.None]: "None",
    [AvailableTools.Stone]: "Stone",
    [AvailableTools.Copper]: "Copper",
    [AvailableTools.Iron]: "Iron",
    [AvailableTools.Bronze]: "Bronze",
    [AvailableTools.Steel]: "Steel",
};

const OutputUnitSelectorMappings: Readonly<Record<OutputUnit, string>> = {
    [OutputUnit.Seconds]: "Seconds",
    [OutputUnit.Minutes]: "Minutes",
    [OutputUnit.GameDays]: "Game days",
};

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
        },
    );

    if ("workers" in input && input.workers) {
        if (input.clear) {
            await user.clear(workerInput);
        }

        await user.type(workerInput, input.workers.toString());
    }

    if ("amount" in input && input.amount) {
        if (input.clear) {
            await user.clear(amountInput);
        }

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
