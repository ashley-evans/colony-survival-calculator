import React, { lazy, ReactElement, Suspense } from "react";
import { createBrowserRouter, Link, Outlet } from "react-router-dom";

const Calculator = lazy(() => import("../components/Calculator"));

type LazyLoadingWrapperProps = {
    children: ReactElement;
};

function LazyLoadingWrapper(props: LazyLoadingWrapperProps) {
    return (
        <Suspense fallback={<div>Loading...</div>}>{props.children}</Suspense>
    );
}

function SiteLayout() {
    return (
        <>
            <h1>Colony Survival Calculator</h1>
            <Outlet />
        </>
    );
}

function MissingRoute() {
    return (
        <>
            <p>Oh no! You have gotten lost!</p>
            <Link to={"/"}>Return to calculator</Link>
        </>
    );
}

const router = createBrowserRouter([
    {
        element: <SiteLayout />,
        children: [
            {
                index: true,
                element: (
                    <LazyLoadingWrapper>
                        <Calculator />
                    </LazyLoadingWrapper>
                ),
            },
            {
                path: "*",
                element: <MissingRoute />,
            },
        ],
    },
]);

export default router;
