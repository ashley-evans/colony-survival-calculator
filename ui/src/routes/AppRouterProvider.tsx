import { ReactElement, Suspense, lazy } from "react";
import {
    RouterProvider,
    createBrowserRouter,
    RouterProviderProps,
} from "react-router-dom";

import SiteLayout from "./components/SiteLayout/SiteLayout";
import { useTranslation } from "react-i18next";

const Calculator = lazy(() => import("../pages/Calculator/Calculator"));
const MissingRoute = lazy(
    () => import("./components/MissingRoute/MissingRoute"),
);

type LazyLoadingWrapperProps = {
    children: ReactElement;
};

function LazyLoadingWrapper(props: LazyLoadingWrapperProps) {
    const { t } = useTranslation();

    return (
        <Suspense fallback={<div>{t("loading")}</div>}>
            {props.children}
        </Suspense>
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

export type AppRouterProviderProps = Omit<RouterProviderProps, "router"> & {
    defaultRoute?: string;
};

const AppRouterProvider = ({
    defaultRoute,
    ...providerProps
}: AppRouterProviderProps) => {
    if (defaultRoute) {
        router.navigate(defaultRoute);
    }

    return <RouterProvider {...providerProps} router={router} />;
};

export default AppRouterProvider;
