import { useTranslation } from "react-i18next";

import { Input } from "../../../../../../common/components";

export type AmountInputProps = {
    onAmountChange: (amount?: number) => void;
    defaultAmount?: number;
};

function AmountInput({ onAmountChange, defaultAmount }: AmountInputProps) {
    const { t, i18n } = useTranslation();

    const parseValue = (value: unknown): number => {
        const input = Number(value);
        if (!isNaN(input) && input > 0) {
            return input;
        }

        throw new Error();
    };

    return (
        <Input
            label={t("calculator.target.amount.label")}
            parseValue={parseValue}
            onChange={onAmountChange}
            errorMessage={t("calculator.target.amount.error")}
            inputMode="numeric"
            clearIconLabel={t("calculator.target.amount.clear")}
            defaultValue={defaultAmount?.toLocaleString(i18n.language)}
        />
    );
}

export { AmountInput };
