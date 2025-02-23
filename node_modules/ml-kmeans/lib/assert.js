"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateKmeansInput = exports.assertUnreachable = void 0;
function assertUnreachable(x, message) {
    throw new Error(`${message}: "${String(x)}"`);
}
exports.assertUnreachable = assertUnreachable;
function validateKmeansInput(data, K) {
    if (K <= 0 || K > data.length || !Number.isInteger(K)) {
        throw new Error('K should be a positive integer smaller than the number of points');
    }
}
exports.validateKmeansInput = validateKmeansInput;
//# sourceMappingURL=assert.js.map