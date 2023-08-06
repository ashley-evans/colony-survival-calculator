function calculateOrderOfMagnitude(output: number): number {
    if (output === 0) {
        return 0;
    }

    return Math.floor(Math.log10(output));
}

function countDigitsAfterDecimal(output: number): number {
    const split = output.toString().split(".")[1];
    return split ? split.length : 0;
}

function roundOutput(output: number): string {
    const decimalDigits = countDigitsAfterDecimal(output);
    const approx = output + Number.EPSILON;
    if (approx < 0.1) {
        const magnitude = -calculateOrderOfMagnitude(approx);
        if (decimalDigits === magnitude) {
            return output.toString();
        }

        const factor = 10 ** magnitude;
        return `≈${Math.round(approx * factor) / factor}`;
    }

    if (decimalDigits > 1) {
        return `≈${Math.round(approx * 10) / 10}`;
    }

    return output.toString();
}

export { roundOutput };
