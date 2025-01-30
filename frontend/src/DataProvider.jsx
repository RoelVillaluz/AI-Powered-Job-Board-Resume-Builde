import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"
import { response } from "express";

const DataContext = createContext();
export const useData = useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [jobPostings, setJobPostings] = ([]);
    const [resumes, setResumes] = useState([]);

    const baseUrl = 'http://localhost:5000/api'

    useEffect(() => {
        const fetchData = async (models) => {
            try {
                const responses = await Promise.all(
                    models.map(model => fetch(`${baseUrl}/${model}`))
                )

                if (responses.some(response = !response.ok)) {
                    throw new Error('Error fetching data')
                }

                const data = await Promise.all(responses.map(res => res.json()))

                const newData = {};
                models.forEach((model, index) => {
                    newData[model] = data[index].data
                });

                return newData
            } catch (error) {
                console.error(error)
                return null;
            }
        }
    })

    const getAllData = async () => {
        const data = await fetchData(["users", "job-postings", "resumes"]) // endpoints to add to base url to fetch
        if (data) {
            setUsers(data.users)
            setJobPostings(data.jobPostings)
            setResumes(data.resumes)
        }
    }

    useEffect(() => {
        getAllData()
    }, [])
}