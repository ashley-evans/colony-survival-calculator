import React from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";

import Calculator from "../components/Calculator";

function SiteLayout() {
    return (
        <>
            <h1>Colony Survival Calculator</h1>
            <Outlet />
        </>
    );
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <SiteLayout />,
        children: [{ path: "/", element: <Calculator /> }],
    },
]);

export default router;
