import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";

import {
    AvailableDefaultTools,
    CreatorOverride,
    OutputUnit,
} from "../../../graphql/__generated__/schema-types";
import { Target } from "../components/TargetInput";
import {
    DEFAULT_DEBOUNCE,
    isOutputUnit,
    isTool,
    parseCreatorOverrides,
} from "../utils";

type StateProp<S> = [S, (value: S) => void];

type CalculatorState = {
    itemIDState: StateProp<string | undefined>;
    targetState: StateProp<Target | undefined>;
    amountState: StateProp<number | undefined>;
    toolState: StateProp<AvailableDefaultTools>;
    machineToolState: StateProp<boolean>;
    eyeglassesToolState: StateProp<boolean>;
    outputUnitState: StateProp<OutputUnit>;
    creatorOverridesState: StateProp<CreatorOverride[]>;
};

function useCalculatorState(): CalculatorState {
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedItemID, setSelectedItemID] = useState<string | undefined>(
        () => searchParams.get("item") ?? undefined,
    );
    const [target, setTarget] = useState<Target | undefined>(() => {
        const amount = parseFloat(searchParams.get("amount") ?? "");
        return amount ? { amount } : undefined;
    });
    const [amount, setAmount] = useState<number | undefined>(
        target && "amount" in target ? target.amount : undefined,
    );
    const [selectedTool, setSelectedTool] = useState<AvailableDefaultTools>(
        () => {
            const tool = searchParams.get("tools") ?? "";
            return isTool(tool) ? tool : AvailableDefaultTools.None;
        },
    );
    const [hasMachineTools, setHasMachineTools] = useState<boolean>(
        () => searchParams.get("machine") === "true",
    );
    const [hasEyeglasses, setHasEyeglasses] = useState<boolean>(
        () => searchParams.get("eyeglasses") === "true",
    );
    const [selectedOutputUnit, setSelectedOutputUnit] = useState<OutputUnit>(
        () => {
            const unit = searchParams.get("unit") ?? "";
            return isOutputUnit(unit) ? unit : OutputUnit.Minutes;
        },
    );
    const [selectedCreatorOverrides, setSelectedCreatorOverrides] = useState<
        CreatorOverride[]
    >(() => parseCreatorOverrides(searchParams.getAll("co")));
    const [debouncedAmount] = useDebounce(amount, DEFAULT_DEBOUNCE);

    useEffect(() => {
        const params = new URLSearchParams();

        if (selectedItemID) {
            params.set("item", selectedItemID);
        }

        if (debouncedAmount !== undefined) {
            params.set("amount", debouncedAmount.toString());
        }

        if (selectedTool !== AvailableDefaultTools.None) {
            params.set("tools", selectedTool);
        }

        if (hasMachineTools) {
            params.set("machine", "true");
        }

        if (hasEyeglasses) {
            params.set("eyeglasses", "true");
        }

        if (selectedOutputUnit !== OutputUnit.Minutes) {
            params.set("unit", selectedOutputUnit);
        }

        for (const { itemID, creatorID } of selectedCreatorOverrides) {
            params.append("co", `${itemID}:${creatorID}`);
        }

        setSearchParams(params, { replace: true });
    }, [
        selectedItemID,
        debouncedAmount,
        selectedTool,
        hasMachineTools,
        hasEyeglasses,
        selectedOutputUnit,
        selectedCreatorOverrides,
        setSearchParams,
    ]);

    return {
        itemIDState: [selectedItemID, setSelectedItemID],
        targetState: [target, setTarget],
        amountState: [amount, setAmount],
        toolState: [selectedTool, setSelectedTool],
        machineToolState: [hasMachineTools, setHasMachineTools],
        eyeglassesToolState: [hasEyeglasses, setHasEyeglasses],
        outputUnitState: [selectedOutputUnit, setSelectedOutputUnit],
        creatorOverridesState: [
            selectedCreatorOverrides,
            setSelectedCreatorOverrides,
        ],
    };
}

export { useCalculatorState };
export type { CalculatorState, StateProp };
