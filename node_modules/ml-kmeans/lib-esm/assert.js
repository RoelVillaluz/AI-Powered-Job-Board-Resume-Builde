export function assertUnreachable(x, message) {
    throw new Error(`${message}: "${String(x)}"`);
}
export function validateKmeansInput(data, K) {
    if (K <= 0 || K > data.length || !Number.isInteger(K)) {
        throw new Error('K should be a positive integer smaller than the number of points');
    }
}
//# sourceMappingURL=assert.js.map