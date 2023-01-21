import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import Ajv from "ajv";

import { Item, Items } from "../types";
import ItemsSchema from "../schemas/items.json";

const ajv = new Ajv();
const validateItems = ajv.compile<Items>(ItemsSchema);

function App() {
    const [items, setItems] = useState<Record<string, number>>({});
    const [selectedItem, setSelectedItem] = useState<Item>();
    const [workers, setWorkers] = useState<number>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        axios.get<unknown>("json/items.json").then(({ data }) => {
            if (Array.isArray(data) && data.length > 0 && validateItems(data)) {
                setItems(
                    Object.fromEntries(
                        data.map((item) => [item.name, item.createTime])
                    )
                );

                const initialSelected = data[0];
                setSelectedItem({
                    name: initialSelected.name,
                    createTime: initialSelected.createTime,
                });
            } else {
                setError("Unable to fetch known items");
            }
        });
    }, []);

    const onItemChange = (event: FormEvent<HTMLSelectElement>) => {
        const name = event.currentTarget.value;
        const createTime = items[name];
        setSelectedItem({ name, createTime });
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

    const calculateOutput = (workers: number, selectedItem: Item): number => {
        const numberPerMinute = 60 / selectedItem.createTime;
        return workers * numberPerMinute;
    };

    const itemKeys = Object.keys(items);
    return (
        <>
            <h1>Colony Survival Calculator</h1>
            <h2>Desired output:</h2>
            {itemKeys.length > 0 ? (
                <>
                    <label htmlFor="output-select">Item:</label>
                    <select
                        id="output-select"
                        onChange={onItemChange}
                        defaultValue={selectedItem?.name}
                    >
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
                    {workers != undefined && selectedItem && !error ? (
                        <p>
                            Optimal output:{" "}
                            {calculateOutput(workers, selectedItem)} per minute
                        </p>
                    ) : null}
                </>
            ) : null}
            {error ? <p role="alert">Error: {error}</p> : null}
        </>
    );
}

export default App;
