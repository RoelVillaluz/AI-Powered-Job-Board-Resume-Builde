export const mapDatePosted = (datePosted) => {
    const map = {
        Anytime: null,
        Today: "today",
        "This Week": "this_week",
        "This Month": "this_month",
        "Last 3 Months": "last_3_months",
    };
    return map[datePosted] ?? null;
};
