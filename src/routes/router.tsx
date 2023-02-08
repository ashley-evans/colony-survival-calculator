import React, { lazy, ReactElement, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";

const Calculator = lazy(() => import("../components/Calculator"));

type LazyLoadingWrapperProps = {
    children: ReactElement;
};

function LazyLoadingWrapper(props: LazyLoadingWrapperProps) {
    return <Suspense fallback={<p>Loading...</p>}>{props.children}</Suspense>;
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
        path: "/",
        element: <SiteLayout />,
        children: [
            {
                path: "/",
                element: (
                    <LazyLoadingWrapper>
                        <Calculator />
                    </LazyLoadingWrapper>
                ),
            },
        ],
    },
]);

export default router;
