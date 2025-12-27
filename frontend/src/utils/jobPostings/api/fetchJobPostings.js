import axios from "axios";

export const fetchJobPostings = async ({
    baseUrl,
    queryString,
    signal
}) => {
    const { data } = await axios.get(
        `${baseUrl}/job-postings?${queryString}`,
        { signal }
    );

    return data.data;
};
