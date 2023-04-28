import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
    expectedItemSelectLabel,
    expectedOutputUnitLabel,
    expectedToolSelectLabel,
    expectedWorkerInputLabel,
} from "./constants";
import { OutputUnit, Tools } from "../../../../graphql/__generated__/graphql";
import { OutputUnitSelectorMappings, ToolSelectorMappings } from "../../utils";

async function openSelectMenu({ selectLabel }: { selectLabel: string }) {
    const user = userEvent.setup();
    const select = await screen.findByRole("combobox", { name: selectLabel });

    await act(async () => {
        await user.click(select);
    });
}

async function selectOption({
    optionName,
    selectLabel,
}: {
    optionName: string;
    selectLabel?: string;
}) {
    if (selectLabel) {
        await openSelectMenu({ selectLabel });
    }

    const user = userEvent.setup();
    const option = await screen.findByRole("option", { name: optionName });
    await act(async () => {
        await user.click(option);
    });
}

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
            selectLabel: expectedItemSelectLabel,
            optionName: itemName,
        });
    }
}

async function selectOutputUnit(unit: OutputUnit) {
    return selectOption({
        selectLabel: expectedOutputUnitLabel,
        optionName: OutputUnitSelectorMappings[unit],
    });
}

async function selectTool(tool: Tools) {
    return selectOption({
        selectLabel: expectedToolSelectLabel,
        optionName: ToolSelectorMappings[tool],
    });
}

export {
    openSelectMenu,
    selectOption,
    selectItemAndWorkers,
    selectOutputUnit,
    selectTool,
};
