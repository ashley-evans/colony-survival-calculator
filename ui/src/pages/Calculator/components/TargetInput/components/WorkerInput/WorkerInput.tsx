import { useTranslation } from "react-i18next";

import { Input } from "../../../../../../common/components";

export type WorkerInputProps = {
    onWorkerChange: (workers?: number) => void;
    defaultWorkers?: number;
};

function WorkerInput({ onWorkerChange, defaultWorkers }: WorkerInputProps) {
    const { t, i18n } = useTranslation();

    const parseValue = (value: unknown): number => {
        const input = Number(value);
        if (!isNaN(input) && input > 0 && input % 1 === 0) {
            return input;
        }

        throw new Error();
    };

    return (
        <Input
            label={t("calculator.target.workers.label")}
            parseValue={parseValue}
            onChange={onWorkerChange}
            errorMessage={t("calculator.target.workers.error")}
            inputMode="numeric"
            clearIconLabel={t("calculator.target.workers.clear")}
            defaultValue={
                defaultWorkers
                    ? Math.ceil(defaultWorkers).toLocaleString(i18n.language)
                    : undefined
            }
        />
    );
}

export { WorkerInput };
