import "@testing-library/jest-dom";
import { vi } from "vitest";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import calculatorEnUS from "../../public/locales/en-US/calculator.json";

vi.mock(
    "../pages/Calculator/components/Output/components/RequirementsSankey",
    () => ({
        default: () => {
            return <></>;
        },
    }),
);

i18n.use(initReactI18next).init({
    lng: "en-US",
    fallbackLng: "en-US",
    ns: ["calculator"],
    defaultNS: "calculator",
    resources: {
        "en-US": {
            calculator: calculatorEnUS,
        },
    },
});

export default i18n;
