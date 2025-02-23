"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kmeanspp = exports.mostDistant = exports.random = void 0;
const ml_distance_euclidean_1 = require("ml-distance-euclidean");
const ml_matrix_1 = require("ml-matrix");
const ml_random_1 = __importDefault(require("ml-random"));
/**
 * Choose K different random points from the original data
 * @ignore
 * @param {Array<Array<number>>} data - Points in the format to cluster [x,y,z,...]
 * @param {number} K - number of clusters
 * @param {number} seed - seed for random number generation
 * @return {Array<Array<number>>} - Initial random points
 */
function random(data, K, seed) {
    const random = new ml_random_1.default(seed);
    return random.choice(data, { size: K });
}
exports.random = random;
/**
 * Chooses the most distant points to a first random pick
 * @ignore
 * @param {Array<Array<number>>} data - Points in the format to cluster [x,y,z,...]
 * @param {number} K - number of clusters
 * @param {Array<Array<number>>} distanceMatrix - matrix with the distance values
 * @param {number} seed - seed for random number generation
 * @return {Array<Array<number>>} - Initial random points
 */
function mostDistant(data, K, distanceMatrix, seed) {
    const random = new ml_random_1.default(seed);
    let ans = new Array(K);
    // chooses a random point as initial cluster
    ans[0] = Math.floor(random.random() * data.length);
    if (K > 1) {
        // chooses the more distant point
        let maxDist = { dist: -1, index: -1 };
        for (let l = 0; l < data.length; ++l) {
            if (distanceMatrix[ans[0]][l] > maxDist.dist) {
                maxDist.dist = distanceMatrix[ans[0]][l];
                maxDist.index = l;
            }
        }
        ans[1] = maxDist.index;
        if (K > 2) {
            // chooses the set of points that maximises the min distance
            for (let k = 2; k < K; ++k) {
                let center = { dist: -1, index: -1 };
                for (let m = 0; m < data.length; ++m) {
                    // minimum distance to centers
                    let minDistCent = { dist: Number.MAX_VALUE, index: -1 };
                    for (let n = 0; n < k; ++n) {
                        if (distanceMatrix[n][m] < minDistCent.dist && !ans.includes(m)) {
                            minDistCent = {
                                dist: distanceMatrix[n][m],
                                index: m,
                            };
                        }
                    }
                    if (minDistCent.dist !== Number.MAX_VALUE &&
                        minDistCent.dist > center.dist) {
                        center = { ...minDistCent };
                    }
                }
                ans[k] = center.index;
            }
        }
    }
    return ans.map((index) => data[index]);
}
exports.mostDistant = mostDistant;
// Implementation inspired from scikit
function kmeanspp(X, K, options = {}) {
    const m = new ml_matrix_1.Matrix(X);
    const nSamples = m.rows;
    const random = new ml_random_1.default(options.seed);
    // Set the number of trials
    const centers = [];
    const localTrials = options.localTrials || 2 + Math.floor(Math.log(K));
    // Pick the first center at random from the dataset
    const firstCenterIdx = random.randInt(nSamples);
    centers.push(m.getRow(firstCenterIdx));
    // Init closest distances
    let closestDistSquared = new ml_matrix_1.Matrix(1, m.rows);
    for (let i = 0; i < m.rows; i++) {
        closestDistSquared.set(0, i, (0, ml_distance_euclidean_1.squaredEuclidean)(m.getRow(i), centers[0]));
    }
    let cumSumClosestDistSquared = [cumSum(closestDistSquared.getRow(0))];
    const factor = 1 / cumSumClosestDistSquared[0][nSamples - 1];
    let probabilities = ml_matrix_1.Matrix.mul(closestDistSquared, factor);
    // Iterate over the remaining centers
    for (let i = 1; i < K; i++) {
        const candidateIdx = random.choice(nSamples, {
            replace: true,
            size: localTrials,
            probabilities: probabilities.getRow(0),
        });
        const candidates = m.selection(candidateIdx, range(m.columns));
        const distanceToCandidates = euclideanDistances(candidates, m);
        let bestCandidate = Infinity;
        let bestPot = Infinity;
        let bestDistSquared = closestDistSquared;
        for (let j = 0; j < localTrials; j++) {
            const newDistSquared = ml_matrix_1.Matrix.min(closestDistSquared, [
                distanceToCandidates.getRow(j),
            ]);
            const newPot = newDistSquared.sum();
            if (newPot < bestPot) {
                bestCandidate = candidateIdx[j];
                bestPot = newPot;
                bestDistSquared = newDistSquared;
            }
        }
        centers[i] = m.getRow(bestCandidate);
        closestDistSquared = bestDistSquared;
        cumSumClosestDistSquared = [cumSum(closestDistSquared.getRow(0))];
        probabilities = ml_matrix_1.Matrix.mul(closestDistSquared, 1 / cumSumClosestDistSquared[0][nSamples - 1]);
    }
    return centers;
}
exports.kmeanspp = kmeanspp;
function euclideanDistances(A, B) {
    const result = new ml_matrix_1.Matrix(A.rows, B.rows);
    for (let i = 0; i < A.rows; i++) {
        for (let j = 0; j < B.rows; j++) {
            result.set(i, j, (0, ml_distance_euclidean_1.squaredEuclidean)(A.getRow(i), B.getRow(j)));
        }
    }
    return result;
}
function range(l) {
    let r = [];
    for (let i = 0; i < l; i++) {
        r.push(i);
    }
    return r;
}
function cumSum(arr) {
    let cumSum = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
        cumSum[i] = cumSum[i - 1] + arr[i];
    }
    return cumSum;
}
//# sourceMappingURL=initialization.js.map