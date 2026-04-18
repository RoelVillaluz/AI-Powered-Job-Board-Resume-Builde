import type { JobPosting } from "../../../../shared/types/jobPostingTypes";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";

/**
 * Deeply sets a value on an object using a dot-separated path.
 * Returns a new object (does not mutate the original).
 *
 * @template T - The shape of the input object
 *
 * @param {T} obj - The source object
 * @param {string} path - Dot-separated path (e.g. "a.b.c")
 * @param {any} value - Value to set at the given path
 *
 * @returns {T} A new object with the updated value
 *
 * @example
 * const state = { user: { profile: { name: "John" } } };
 * const updated = setDeep(state, "user.profile.name", "Jane");
 * // { user: { profile: { name: "Jane" } } }
 */
export function setDeep<T extends Record<string, any>>(
    obj: T,
    path: string,
    value: any
): T {
    const keys = path.split(".");
    const [head, ...rest] = keys;

    if (!head) return obj;

    // Base case: single key left
    if (keys.length === 1) {
        return { ...obj, [head]: value };
    }

    return {
        ...obj,
        [head]: setDeep((obj as any)?.[head] ?? {}, rest.join("."), value),
    };
}