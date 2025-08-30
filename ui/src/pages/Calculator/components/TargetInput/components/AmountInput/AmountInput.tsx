import { Input } from "../../../../../../common/components";

export type AmountInputProps = {
    onAmountChange: (amount?: number) => void;
    defaultAmount?: number;
};

function AmountInput({ onAmountChange, defaultAmount }: AmountInputProps) {
    const parseValue = (value: unknown): number => {
        const input = Number(value);
        if (!isNaN(input) && input > 0) {
            return input;
        }

        throw new Error();
    };

    return (
        <Input
            label="Output item target:"
            parseValue={parseValue}
            onChange={onAmountChange}
            errorMessage="Invalid output item target, must be a positive non-zero whole number"
            inputMode="numeric"
            clearIconLabel="Clear output item target"
            defaultValue={defaultAmount?.toString()}
        />
    );
}

export { AmountInput };
