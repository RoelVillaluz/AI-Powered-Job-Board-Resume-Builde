import { mapDatePosted } from "./mapDatePosted";
import { mapSortBy } from "./mapSortBy";

export const buildJobQueryParams = ({
    filters,
    sortBy,
    cursor = null,
    limit = 20,
    jobRecommendations = []
}) => {
    const params = new URLSearchParams();

    // Salary
    if (filters.salary.amount.min != null)
        params.append("minSalary", filters.salary.amount.min);
    if (filters.salary.amount.max != null)
        params.append("maxSalary", filters.salary.amount.max);

    // Arrays
    ["jobType", "experienceLevel", "skills", "industry"].forEach(key => {
        if (filters[key]?.length) {
            params.append(key, filters[key].join(","));
        }
    });

    // Strings
    if (filters.jobTitle) params.append("jobTitle", filters.jobTitle);
    if (filters.location) params.append("location", filters.location);

    // Boolean
    if (filters.hasQuestions) params.append("hasQuestions", "true");

    // Date
    const dateValue = mapDatePosted(filters.datePosted);
    if (dateValue) params.append("datePosted", dateValue);

    // Sort
    params.append("sortBy", mapSortBy(sortBy));

    // Pagination
    if (cursor) params.append("cursor", cursor);
    params.append("limit", limit);

    // Exclude recommendations on first page
    if (jobRecommendations.length && !cursor) {
        params.append(
            "exclude",
            jobRecommendations.map(j => j._id).join(",")
        );
    }

    return params.toString();
};
