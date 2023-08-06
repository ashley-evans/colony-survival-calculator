function calculateOrderOfMagnitude(output: number): number {
    if (output === 0) {
        return 0;
    }

    return Math.floor(Math.log10(output));
}

function countDigitsAfterDecimal(output: number): number {
    const decimalPart = output - Math.floor(output);
    return decimalPart.toString().length - 2;
}

function roundOutput(output: number): string {
    const approx = output + Number.EPSILON;
    if (approx < 0.1) {
        const magnitude = -calculateOrderOfMagnitude(approx);
        if (countDigitsAfterDecimal(output) === magnitude) {
            return output.toString();
        }

        const factor = 10 ** magnitude;
        return `≈${Math.round(approx * factor) / factor}`;
    }

    if ((output * 10) % 1 !== 0) {
        return `≈${Math.round(approx * 10) / 10}`;
    }

    return output.toString();
}

export { roundOutput };
