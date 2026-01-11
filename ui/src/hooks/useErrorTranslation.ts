import { useTranslation } from "react-i18next";

import { UserError } from "../graphql/__generated__/graphql";

export function useErrorTranslation() {
    const { t, i18n } = useTranslation();

    return (error: UserError): string => {
        const details = error.details ? JSON.parse(error.details) : {};

        if (error.code === "TOOL_LEVEL") {
            if (details.requiredTool === "machine") {
                return t("errors.TOOL_LEVEL_MACHINE");
            }

            const toolKey = `calculator.tools.mapping.${details.requiredTool}`;
            const toolExists = i18n.exists(toolKey);
            if (!toolExists) {
                return t("errors.UNKNOWN");
            }

            return t("errors.TOOL_LEVEL", {
                requiredTool: t(toolKey),
            });
        }

        return t(`errors.${error.code}`, {
            defaultValue: t("errors.UNKNOWN"),
            ...details,
        }) as string;
    };
}
