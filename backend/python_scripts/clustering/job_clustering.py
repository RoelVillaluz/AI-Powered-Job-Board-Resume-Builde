"""
K-Means clustering for job postings.

=== SKLEARN KMEANS QUICK REFERENCE ===
For quick lookup when switching between frontend/backend/ML work:

KMeans Methods & Properties:
- kmeans.fit(X): Computes clustering, finds cluster centers
- kmeans.labels_: Cluster assignment for each sample (which cluster each job belongs to)
- kmeans.cluster_centers_: Coordinates of cluster centroids in embedding space
- kmeans.inertia_: Sum of squared distances to centers (lower = tighter clusters)

NumPy Properties:
- array.ndim: Number of array dimensions (we need ndim=2 for KMeans)
- np.array(): Converts list to numpy array

Why These Checks Matter:
- ndim != 2 check: KMeans requires 2D matrix [num_jobs, embedding_dim]
- len(job_embeddings) < num_clusters: Can't have more clusters than data points
"""
import numpy as np
from sklearn.cluster import KMeans
from typing import Optional, NamedTuple
import logging

logger = logging.getLogger(__name__)

class ClusterResult(NamedTuple):
    """Container for clustering results."""
    labels: np.ndarray
    cluster_centers: np.ndarray
    inertia: float

class JobClusteringService:
    """Handles job posting clustering operations."""
    
    @staticmethod
    def cluster_jobs(
        job_embeddings: list[np.ndarray],
        num_clusters: int = 5,
        random_state: int = 42,
    ) -> Optional[ClusterResult]:
        """
        Perform K-Means clustering on job posting embeddings.
        
        Args:
            job_embeddings: List of numpy arrays representing job embeddings
            num_clusters: Number of clusters to form
            random_state: Random seed for reproducibility
            
        Returns:
            ClusterResult containing labels, centers, and inertia, or None if clustering fails

        Example:

            # Example input:
            job_embeddings = [
                np.array([0.1, 0.2, 0.3]),
                np.array([0.4, 0.5, 0.6]),
                np.array([0.7, 0.8, 0.9]),
                np.array([0.9, 0.1, 0.2]),
                np.array([0.3, 0.6, 0.9]),
            ]
            num_clusters = 2

            # Calling the method:
            result = JobClusteringService.cluster_jobs(job_embeddings, num_clusters)

            # Example output:
            result = ClusterResult(
                labels=np.array([0, 0, 1, 1, 0]),  # Cluster labels for each job
                cluster_centers=np.array([
                    [0.43, 0.43, 0.63],  # Center of cluster 0
                    [0.80, 0.50, 0.55],  # Center of cluster 1
                ]),
                inertia=0.15  # Measure of how tight the clusters are
            )
        """
        if not job_embeddings:
            logger.error(f"No job embeddings provider for cluster")
            return None
        
        if len(job_embeddings) < num_clusters:
            logger.warning(
                f"Number of jobs {len(job_embeddings)} is less than "
                f"number of clusters: {len(num_clusters)}"
            )
            num_clusters = max(1, len(job_embeddings))

        try:
            # Convert to 2D numpy array
            job_matrix = np.array(job_embeddings)

            # Validate shape
            if job_matrix.ndim != 2:
                logger.error(f"Invalid embedding dimensions: {job_matrix.shape}")
                return None
            
            # Perform K-Means clustering
            kmeans = KMeans(
                n_clusters=num_clusters,
                random_state=random_state,
                n_init=10
            )
            kmeans.fit(job_matrix)

            return ClusterResult(
                labels=kmeans.labels_,
                cluster_centers=kmeans.cluster_centers_,
                inertia=kmeans.inertia_
            )   
        except Exception as e:
            logger.error(f"Error during clustering: {e}")
            return None