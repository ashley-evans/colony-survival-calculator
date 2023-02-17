import React, { useEffect, useState } from "react";
import axios from "axios";
import Ajv from "ajv";

import { Item, Items } from "../types";
import ItemsSchema from "../schemas/items.json";
import { UnitDisplayMappings, Units, UnitSecondMappings } from "../utils/units";
import { ItemSelector } from "./ItemSelector";
import { WorkerInput } from "./WorkerInput";
import { OutputUnitSelector } from "./OutputUnitSelector";

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
    const itemMap = Object.fromEntries(items.map((item) => [item.name, item]));

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

    const calculateRequiredWorkers = (
        selectedItem: Item,
        selectedWorkers: number,
        requiredItemName: string
    ): number | undefined => {
        const requirement = selectedItem.requires.find(
            (i) => i.name == requiredItemName
        );
        if (!requirement) {
            setError("Something went wrong, please try again");
            return;
        }

        const requiredItem = itemMap[requiredItemName];
        const createdInTime =
            (selectedItem.createTime / requiredItem.createTime) *
            requiredItem.output;
        return (requirement.amount / createdInTime) * selectedWorkers;
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
            selectedItem?.requires &&
            selectedItem.requires.length > 0 ? (
                <>
                    <h2>Requirements:</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Workers</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{selectedItem.requires[0].name}</td>
                                <td>
                                    {calculateRequiredWorkers(
                                        selectedItem,
                                        workers,
                                        selectedItem.requires[0].name
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </>
            ) : null}
            {error ? <p role="alert">Error: {error}</p> : null}
        </>
    );
}

export default Calculator;
