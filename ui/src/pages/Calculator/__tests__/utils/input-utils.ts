import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
    expectedItemSelectLabel,
    expectedOutputUnitLabel,
    expectedWorkerInputLabel,
} from "./constants";
import { Units } from "../../../../utils";

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

        if (itemName) {
            await user.selectOptions(
                await screen.findByRole("combobox", {
                    name: expectedItemSelectLabel,
                }),
                itemName
            );
        }

        if (workers) {
            await user.type(workerInput, workers.toString());
        }
    });
}

async function selectOutputUnit(unit: Units) {
    const user = userEvent.setup();
    const unitComboBox = await screen.findByRole("combobox", {
        name: expectedOutputUnitLabel,
    });

    await act(async () => {
        await user.selectOptions(unitComboBox, unit);
    });
}

export { selectItemAndWorkers, selectOutputUnit };
