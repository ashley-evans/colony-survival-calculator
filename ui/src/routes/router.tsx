import React, { lazy, ReactElement, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import SiteLayout from "./components/SiteLayout/SiteLayout";

const Calculator = lazy(() => import("../pages/Calculator/Calculator"));
const MissingRoute = lazy(
    () => import("./components/MissingRoute/MissingRoute")
);

type LazyLoadingWrapperProps = {
    children: ReactElement;
};

function LazyLoadingWrapper(props: LazyLoadingWrapperProps) {
    return (
        <Suspense fallback={<div>Loading...</div>}>{props.children}</Suspense>
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
