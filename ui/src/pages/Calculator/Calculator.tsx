import React, { useEffect, useState } from "react";
import axios from "axios";
import Ajv from "ajv";

import { Item, Items } from "../../types";
import ItemsSchema from "../../schemas/items.json";
import { UnitDisplayMappings, Units, UnitSecondMappings } from "../../utils";
import ItemSelector from "./components/ItemSelector";
import WorkerInput from "./components/WorkerInput";
import OutputUnitSelector from "./components/OutputUnitSelector";
import Requirements from "./components/Requirements";
import ErrorBoundary from "./components/ErrorBoundary";
import {
    CalculatorContainer,
    CalculatorHeader,
    DesiredOutputText,
} from "./styles";
import roundOutput from "./utils/roundOutput";

const ajv = new Ajv();
const validateItems = ajv.compile<Items>(ItemsSchema);

function Calculator() {
    const [items, setItems] = useState<Items>([]);
    const [selectedItem, setSelectedItem] = useState<Item>();
    const [workers, setWorkers] = useState<number>();
    const [selectedOutputUnit, setSelectedOutputUnit] = useState<Units>(
        Units.MINUTES
    );
    const [error, setError] = useState<string>();

    useEffect(() => {
        axios.get<unknown>("json/items.json").then(({ data }) => {
            if (Array.isArray(data) && data.length > 0 && validateItems(data)) {
                setItems(data);
                setSelectedItem(data[0]);
            } else {
                setError("Unable to fetch known items");
            }
        });
    }, []);

    const calculateOutput = (
        workers: number,
        selectedItem: Item,
        outputUnit: Units
    ): string => {
        const outputPerWorker =
            (UnitSecondMappings[outputUnit] / selectedItem.createTime) *
            selectedItem.output;
        const total = workers * outputPerWorker;
        return `${roundOutput(total)} per ${UnitDisplayMappings[outputUnit]}`;
    };

    const itemKeys = Object.keys(items);
    return (
        <CalculatorContainer>
            <CalculatorHeader>Desired output:</CalculatorHeader>
            {itemKeys.length > 0 ? (
                <>
                    <ItemSelector
                        items={items}
                        onItemChange={setSelectedItem}
                    />
                    <WorkerInput onWorkerChange={setWorkers} />
                    <OutputUnitSelector onUnitChange={setSelectedOutputUnit} />
                </>
            ) : null}
            <ErrorBoundary>
                <>
                    {selectedItem?.size ? (
                        <span>
                            Calculations use optimal farm size:{" "}
                            {selectedItem.size.width} x{" "}
                            {selectedItem.size.height}
                        </span>
                    ) : null}
                    {workers != undefined && selectedItem && !error ? (
                        <DesiredOutputText>
                            Optimal output:{" "}
                            {calculateOutput(
                                workers,
                                selectedItem,
                                selectedOutputUnit
                            )}
                        </DesiredOutputText>
                    ) : null}
                    {workers && selectedItem ? (
                        <Requirements
                            selectedItemName={selectedItem.name}
                            workers={workers}
                        />
                    ) : null}
                </>
            </ErrorBoundary>
            {error ? <span role="alert">Error: {error}</span> : null}
        </CalculatorContainer>
    );
}

export default Calculator;
