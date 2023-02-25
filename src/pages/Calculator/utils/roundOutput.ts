export default function roundOutput(output: number): string {
    if ((output * 100) % 100 !== 0) {
        return `≈${Math.round((output + Number.EPSILON) * 10) / 10}`;
    }

    return output.toString();
}
