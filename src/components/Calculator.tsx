import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import Ajv from "ajv";

import { Item, Items } from "../types";
import ItemsSchema from "../schemas/items.json";
import {
    isUnit,
    UnitDisplayMappings,
    Units,
    UnitSecondMappings,
} from "../utils/units";
import { ItemSelector } from "./ItemSelector";
import { WorkerInput } from "./WorkerInput";

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

    const onOutputUnitChange = (event: FormEvent<HTMLSelectElement>) => {
        const unit = event.currentTarget.value;
        if (isUnit(unit)) {
            setSelectedOutputUnit(unit);
        }
    };

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
                        onItemChange={(item) => setSelectedItem(item)}
                    />
                    <WorkerInput
                        onWorkerChange={(workers) => setWorkers(workers)}
                        onError={(error) => setError(error)}
                    />
                    <label htmlFor="units-select" defaultValue={Units.MINUTES}>
                        Desired output units:
                    </label>
                    <select id="units-select" onChange={onOutputUnitChange}>
                        {Object.values(Units).map((unit) => (
                            <option key={unit}>{unit}</option>
                        ))}
                    </select>
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
            {(workers != undefined && selectedItem?.requires.length) ??
            0 > 0 ? (
                <h2>Requirements:</h2>
            ) : null}
            {error ? <p role="alert">Error: {error}</p> : null}
        </>
    );
}

export default Calculator;
