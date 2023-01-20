import React, { useEffect, useState } from "react";
import axios from "axios";
import Ajv from "ajv";

import { Items } from "../types";
import ItemsSchema from "../schemas/items.json";

const ajv = new Ajv();
const validateItems = ajv.compile<Items>(ItemsSchema);

function App() {
    const [items, setItems] = useState<Items>();

    useEffect(() => {
        axios.get<unknown>("json/items.json").then(({ data }) => {
            if (validateItems(data)) {
                setItems(data);
            } else {
                setItems([]);
            }
        });
    }, []);

    return (
        <>
            <h1>Colony Survival Calculator</h1>
            <h2>Desired output:</h2>
            {items && items.length == 0 ? (
                <p role="alert">Error: Unable to fetch known items</p>
            ) : null}
            {items && items.length > 0 ? (
                <>
                    <label htmlFor="output-select">Item:</label>
                    <select id="output-select">
                        {items.map((item) => (
                            <option key={item.name}>{item.name}</option>
                        ))}
                    </select>
                </>
            ) : null}
        </>
    );
}

export default App;
