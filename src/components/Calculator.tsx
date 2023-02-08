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

const ajv = new Ajv();
const validateItems = ajv.compile<Items>(ItemsSchema);

function Calculator() {
    const [items, setItems] = useState<Record<string, Omit<Item, "name">>>({});
    const [selectedItem, setSelectedItem] = useState<Item>();
    const [workers, setWorkers] = useState<number>();
    const [selectedOutputUnit, setSelectedOutputUnit] = useState<Units>(
        Units.MINUTES
    );
    const [error, setError] = useState<string>();

    useEffect(() => {
        axios.get<unknown>("json/items.json").then(({ data }) => {
            if (Array.isArray(data) && data.length > 0 && validateItems(data)) {
                setItems(
                    Object.fromEntries(data.map((item) => [item.name, item]))
                );

                setSelectedItem(data[0]);
            } else {
                setError("Unable to fetch known items");
            }
        });
    }, []);

    const onItemChange = (event: FormEvent<HTMLSelectElement>) => {
        const name = event.currentTarget.value;
        const item = items[name];
        setSelectedItem({ name, ...item });
    };

    const onWorkerChange = (event: FormEvent<HTMLInputElement>) => {
        const input = parseFloat(event.currentTarget.value);
        if (isNaN(input) || input < 0) {
            setError("Invalid input, must be a positive number");
        } else {
            setError(undefined);
            setWorkers(input);
        }
    };

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
            <h1>Colony Survival Calculator</h1>
            <h2>Desired output:</h2>
            {itemKeys.length > 0 ? (
                <>
                    <label htmlFor="output-select">Item:</label>
                    <select id="output-select" onChange={onItemChange}>
                        {Object.keys(items).map((name) => (
                            <option key={name}>{name}</option>
                        ))}
                    </select>
                    <label htmlFor="worker-input">Workers:</label>
                    <input
                        id="worker-input"
                        inputMode="numeric"
                        onChange={onWorkerChange}
                    ></input>
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
            {error ? <p role="alert">Error: {error}</p> : null}
        </>
    );
}

export default Calculator;
