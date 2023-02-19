import React from "react";
import { Outlet } from "react-router-dom";

function SiteLayout() {
    return (
        <>
            <h1>Colony Survival Calculator</h1>
            <Outlet />
        </>
    );
}

export default SiteLayout;
