export type Language = {
    code: string;
    label: string;
};

const SUPPORTED_LANGUAGES: Language[] = [
    { code: "en-US", label: "English" },
    { code: "cs-CZ", label: "Čeština" },
    { code: "de-DE", label: "Deutsch" },
    { code: "es-ES", label: "Español" },
    { code: "fr-FR", label: "Français" },
    { code: "ja-JP", label: "日本語" },
    { code: "ko-KR", label: "한국어" },
    { code: "no-NO", label: "Norsk" },
    { code: "pl-PL", label: "Polski" },
    { code: "ru-RU", label: "Русский" },
    { code: "uk-UA", label: "Українська" },
    { code: "zh-CN", label: "简体中文" },
];

const DEFAULT_LOCALE = "en-US";

export { SUPPORTED_LANGUAGES, DEFAULT_LOCALE };
