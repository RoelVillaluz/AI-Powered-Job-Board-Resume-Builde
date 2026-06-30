from utils.tensor_utils import tensor_to_list


def serialize_job_embeddings(job_id, emb) -> dict:
    return {
        "job_id": job_id,
        "embeddings": {
            "jobTitle": tensor_to_list(emb.job_title),
            "location": tensor_to_list(emb.location),
        },
        "meanEmbeddings": {
            "skills": tensor_to_list(emb.skills),
        },
        "skill_ids_to_backfill": emb.skill_ids_to_backfill,
        "skill_embeddings_to_backfill": [
            tensor_to_list(e) for e in emb.skill_embeddings_to_backfill
        ],
        "job_title_id_to_backfill": emb.job_title_id_to_backfill,
        "location_id_to_backfill": emb.location_id_to_backfill,
    }
