import React from "react";
import { Link } from "react-router-dom";

function MissingRoute() {
    return (
        <>
            <p>Oh no! You have gotten lost!</p>
            <Link to={"/"}>Return to calculator</Link>
        </>
    );
}

export default MissingRoute;
