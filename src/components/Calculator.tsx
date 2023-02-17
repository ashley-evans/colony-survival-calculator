import React, { useEffect, useState } from "react";
import axios from "axios";
import Ajv from "ajv";

import { Item, Items } from "../types";
import ItemsSchema from "../schemas/items.json";
import { UnitDisplayMappings, Units, UnitSecondMappings } from "../utils/units";
import { ItemSelector } from "./ItemSelector";
import { WorkerInput } from "./WorkerInput";
import { OutputUnitSelector } from "./OutputUnitSelector";
import { Requirements } from "./Requirements";

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
        return `${workers * outputPerWorker} per ${
            UnitDisplayMappings[outputUnit]
        }`;
    };

    const itemKeys = Object.keys(items);
    return (
        <>
            <h2>Desired output:</h2>
            {itemKeys.length > 0 ? (
                <>
                    <ItemSelector
                        items={items}
                        onItemChange={setSelectedItem}
                    />
                    <WorkerInput
                        onWorkerChange={setWorkers}
                        onError={setError}
                    />
                    <OutputUnitSelector onUnitChange={setSelectedOutputUnit} />
                    {workers != undefined && selectedItem && !error ? (
                        <p>
                            Optimal output:{" "}
                            {calculateOutput(
                                workers,
                                selectedItem,
                                selectedOutputUnit
                            )}
                        </p>
                    ) : null}
                    {selectedItem?.size ? (
                        <p>
                            Calculations use optimal farm size:{" "}
                            {selectedItem.size.width} x{" "}
                            {selectedItem.size.height}
                        </p>
                    ) : null}
                </>
            ) : null}
            {workers != undefined &&
            !error &&
            selectedItem?.requires &&
            selectedItem.requires.length > 0 ? (
                <Requirements
                    items={items}
                    selectedItem={selectedItem}
                    workers={workers}
                    onError={setError}
                />
            ) : null}
            {error ? <p role="alert">Error: {error}</p> : null}
        </>
    );
}

export default Calculator;
