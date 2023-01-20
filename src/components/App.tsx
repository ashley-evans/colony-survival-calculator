import React, { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import Ajv from "ajv";

import { Items } from "../types";
import ItemsSchema from "../schemas/items.json";

const ajv = new Ajv();
const validateItems = ajv.compile<Items>(ItemsSchema);

function App() {
    const [items, setItems] = useState<Items>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        axios.get<unknown>("json/items.json").then(({ data }) => {
            if (Array.isArray(data) && data.length > 0 && validateItems(data)) {
                setItems(data);
            } else {
                setError("Unable to fetch known items");
            }
        });
    }, []);

    const onWorkerChange = (event: FormEvent<HTMLInputElement>) => {
        const input = parseInt(event.currentTarget.value);
        if (isNaN(input) || input < 0) {
            setError("Invalid input, must be a positive number");
        } else {
            setError(undefined);
        }
    };

    return (
        <>
            <h1>Colony Survival Calculator</h1>
            <h2>Desired output:</h2>
            {items && items.length > 0 ? (
                <>
                    <label htmlFor="output-select">Item:</label>
                    <select id="output-select">
                        {items.map((item) => (
                            <option key={item.name}>{item.name}</option>
                        ))}
                    </select>
                    <label htmlFor="worker-input">Workers:</label>
                    <input
                        id="worker-input"
                        inputMode="numeric"
                        onChange={onWorkerChange}
                    ></input>
                </>
            ) : null}
            {error ? <p role="alert">Error: {error}</p> : null}
        </>
    );
}

export default App;
