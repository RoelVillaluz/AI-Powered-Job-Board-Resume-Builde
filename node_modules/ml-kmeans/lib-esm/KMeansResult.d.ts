export interface CentroidWithInformation {
    centroid: number[];
    error: number;
    size: number;
}
export declare class KMeansResult {
    /**
     * Result of the kmeans algorithm
     * @param clusters - the cluster identifier for each data dot
     * @param centroids - the K centers in format [x,y,z,...], the error and size of the cluster
     * @param converged - Converge criteria satisfied
     * @param iterations - Current number of iterations
     * @param distance - Distance function to use between the points
     * @constructor
     */
    clusters: number[];
    centroids: number[][];
    converged: boolean;
    iterations: number;
    distance: (a: number[], b: number[]) => number;
    constructor(clusters: number[], centroids: number[][], converged: boolean, iterations: number, distance: (a: number[], b: number[]) => number);
    /**
     * Allows to compute for a new array of points their cluster id
     * @param {Array<Array<number>>} data - the [x,y,z,...] points to cluster
     * @return {Array<number>} - cluster id for each point
     */
    nearest(data: number[][]): number[];
    /**
     * Returns the error and size of each cluster
     * @ignore
     * @param {Array<Array<number>>} data - the [x,y,z,...] points to cluster
     * @return {KMeansResult}
     */
    computeInformation(data: number[][]): CentroidWithInformation[];
}
//# sourceMappingURL=KMeansResult.d.ts.map