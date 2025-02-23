"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kmeans = exports.kmeansGenerator = void 0;
const ml_distance_euclidean_1 = require("ml-distance-euclidean");
const KMeansResult_1 = require("./KMeansResult");
const assert_1 = require("./assert");
const initialization_1 = require("./initialization");
const utils_1 = require("./utils");
const defaultOptions = {
    maxIterations: 100,
    tolerance: 1e-6,
    initialization: 'kmeans++',
    distanceFunction: ml_distance_euclidean_1.squaredEuclidean,
};
function step(centers, data, clusterID, K, options, iterations) {
    clusterID = (0, utils_1.updateClusterID)(data, centers, clusterID, options.distanceFunction);
    let newCenters = (0, utils_1.updateCenters)(centers, data, clusterID, K);
    let converged = (0, utils_1.hasConverged)(newCenters, centers, options.distanceFunction, options.tolerance);
    return new KMeansResult_1.KMeansResult(clusterID, newCenters, converged, iterations, options.distanceFunction);
}
/**
 * Generator version for the algorithm
 * @ignore
 * @param {Array<Array<number>>} centers - K centers in format [x,y,z,...]
 * @param {Array<Array<number>>} data - Points [x,y,z,...] to cluster
 * @param {Array<number>} clusterID - Cluster identifier for each data dot
 * @param {number} K - Number of clusters
 * @param {object} [options] - Option object
 */
function* kmeansGenerator(data, K, options) {
    const definedOptions = getDefinedOptions(options);
    (0, assert_1.validateKmeansInput)(data, K);
    let centers = initializeCenters(data, K, definedOptions);
    let clusterID = new Array(data.length);
    let converged = false;
    let stepNumber = 0;
    let stepResult;
    while (!converged && stepNumber < definedOptions.maxIterations) {
        stepResult = step(centers, data, clusterID, K, definedOptions, ++stepNumber);
        yield stepResult;
        converged = stepResult.converged;
        centers = stepResult.centroids;
    }
}
exports.kmeansGenerator = kmeansGenerator;
/**
 * K-means algorithm
 * @param {Array<Array<number>>} data - Points in the format to cluster [x,y,z,...]
 * @param {number} K - Number of clusters
 * @param {object} [options] - Option object
 * @param {number} [options.maxIterations = 100] - Maximum of iterations allowed
 * @param {number} [options.tolerance = 1e-6] - Error tolerance
 * @param {function} [options.distanceFunction = squaredDistance] - Distance function to use between the points
 * @param {number} [options.seed] - Seed for random initialization.
 * @param {string|Array<Array<number>>} [options.initialization = 'kmeans++'] - K centers in format [x,y,z,...] or a method for initialize the data:
 *  * You can either specify your custom start centroids, or select one of the following initialization method:
 *  * `'kmeans++'` will use the kmeans++ method as described by http://ilpubs.stanford.edu:8090/778/1/2006-13.pdf
 *  * `'random'` will choose K random different values.
 *  * `'mostDistant'` will choose the more distant points to a first random pick
 * @return {KMeansResult} - Cluster identifier for each data dot and centroids with the following fields:
 *  * `'clusters'`: Array of indexes for the clusters.
 *  * `'centroids'`: Array with the resulting centroids.
 *  * `'iterations'`: Number of iterations that took to converge
 */
function kmeans(data, K, options) {
    const definedOptions = getDefinedOptions(options);
    (0, assert_1.validateKmeansInput)(data, K);
    let centers = initializeCenters(data, K, definedOptions);
    // infinite loop until convergence
    if (definedOptions.maxIterations === 0) {
        definedOptions.maxIterations = Number.MAX_VALUE;
    }
    let clusterID = new Array(data.length);
    let converged = false;
    let stepNumber = 0;
    let stepResult;
    while (!converged && stepNumber < definedOptions.maxIterations) {
        stepResult = step(centers, data, clusterID, K, definedOptions, ++stepNumber);
        converged = stepResult.converged;
        centers = stepResult.centroids;
    }
    if (!stepResult) {
        throw new Error('unreachable: no kmeans step executed');
    }
    return stepResult;
}
exports.kmeans = kmeans;
function initializeCenters(data, K, options) {
    let centers;
    if (Array.isArray(options.initialization)) {
        if (options.initialization.length !== K) {
            throw new Error('The initial centers should have the same length as K');
        }
        else {
            centers = options.initialization;
        }
    }
    else {
        switch (options.initialization) {
            case 'kmeans++':
                centers = (0, initialization_1.kmeanspp)(data, K, options);
                break;
            case 'random':
                centers = (0, initialization_1.random)(data, K, options.seed);
                break;
            case 'mostDistant':
                centers = (0, initialization_1.mostDistant)(data, K, (0, utils_1.calculateDistanceMatrix)(data, options.distanceFunction), options.seed);
                break;
            default:
                (0, assert_1.assertUnreachable)(options.initialization, 'Unknown initialization method');
        }
    }
    return centers;
}
function getDefinedOptions(options) {
    return { ...defaultOptions, ...options };
}
//# sourceMappingURL=kmeans.js.map