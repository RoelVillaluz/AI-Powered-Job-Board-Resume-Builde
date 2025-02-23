/**
 * Choose K different random points from the original data
 * @ignore
 * @param {Array<Array<number>>} data - Points in the format to cluster [x,y,z,...]
 * @param {number} K - number of clusters
 * @param {number} seed - seed for random number generation
 * @return {Array<Array<number>>} - Initial random points
 */
export declare function random(data: number[][], K: number, seed?: number): number[][];
/**
 * Chooses the most distant points to a first random pick
 * @ignore
 * @param {Array<Array<number>>} data - Points in the format to cluster [x,y,z,...]
 * @param {number} K - number of clusters
 * @param {Array<Array<number>>} distanceMatrix - matrix with the distance values
 * @param {number} seed - seed for random number generation
 * @return {Array<Array<number>>} - Initial random points
 */
export declare function mostDistant(data: number[][], K: number, distanceMatrix: number[][], seed?: number): number[][];
interface Options {
    seed: number;
    localTrials: number;
}
export declare function kmeanspp(X: number[][], K: number, options?: Partial<Options>): number[][];
export {};
//# sourceMappingURL=initialization.d.ts.map