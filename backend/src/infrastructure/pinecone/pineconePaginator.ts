import { getPineconeIndex } from "../../config/pinecone.js";

/**
 * Fetch ALL vector IDs from a Pinecone namespace across multiple pages.
 * listPaginated({ limit: 99 }) only returns one page — this drains all pages.
 * Cheap operation — returns IDs only, no vector values fetched.
 */
export async function fetchAllPineconeIds(
    namespace: ReturnType<ReturnType<typeof getPineconeIndex>['namespace']>,
): Promise<Set<string>> {
    const ids = new Set<string>();
    let paginationToken: string | undefined = undefined;

    do {
        const page: any = await namespace.listPaginated({
            limit: 100,
            ...(paginationToken ? { paginationToken } : {}),
        });

        for (const v of page.vectors ?? []) {
            ids.add(v.id);
        }

        paginationToken = page.pagination?.next;

    } while (paginationToken);

    return ids;
}