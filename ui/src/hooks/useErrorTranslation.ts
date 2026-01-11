import { useTranslation } from "react-i18next";

import { UserError } from "../graphql/__generated__/graphql";

export function useErrorTranslation() {
    const { t } = useTranslation();

    return (error: UserError): string => {
        const details = error.details ? JSON.parse(error.details) : {};

        // Handle special case for tool level errors
        if (error.code === "TOOL_LEVEL" && details.requiredTool === "machine") {
            return t("errors.TOOL_LEVEL_MACHINE");
        }

        return t(`errors.${error.code}`, {
            defaultValue: t("errors.UNKNOWN"),
            ...details,
        }) as string;
    };
}
