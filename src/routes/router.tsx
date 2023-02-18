import React, { lazy, ReactElement, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";

const Calculator = lazy(() => import("../pages/Calculator/Calculator"));
const MissingRoute = lazy(() => import("./MissingRoute"));

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
                element: (
                    <LazyLoadingWrapper>
                        <MissingRoute />
                    </LazyLoadingWrapper>
                ),
            },
        ],
    },
]);

export default router;
