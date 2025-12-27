export const mapSortBy = (sortBy) => {
    const map = {
        "Best Match (Default)": "Best Match",
        "A-Z": "A-Z",
        "Z-A": "Z-A",
        "Newest First": "Newest First",
        "Highest Salary": "Highest Salary",
    };
    return map[sortBy] || "Best Match";
};
