import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./constants";

i18n.use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        ns: ["calculator"],
        defaultNS: "calculator",
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: SUPPORTED_LOCALES,
        detection: {
            order: [
                "cookie",
                "localStorage",
                "sessionStorage",
                "navigator",
                "htmlTag",
            ],
        },
        backend: {
            loadPath: "/locales/{{lng}}/{{ns}}.json",
        },
    });

export * from "./constants";
export default i18n;
