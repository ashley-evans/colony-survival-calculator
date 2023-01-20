import React, { useEffect } from "react";
import axios from "axios";

function App() {
    useEffect(() => {
        axios.get("json/items.json");
    }, []);

    return <h1>Colony Survival Calculator</h1>;
}

export default App;
