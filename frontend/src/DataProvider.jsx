import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [resumes, setResumes] = useState([]);

  const baseUrl = "http://localhost:5000/api";

  // Function to fetch data dynamically based on the models passed
  const fetchData = async (models = []) => {
    if (!Array.isArray(models) || models.length === 0) return;

    try {
      const responses = await Promise.all(
        models.map((model) => fetch(`${baseUrl}/${model}`))
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error("Error fetching data");
      }

      const data = await Promise.all(responses.map((res) => res.json()));

      const newData = {};
      models.forEach((model, index) => {
        newData[model] = data[index].data;
      });

      return newData;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Function to fetch and store data for selected models
  const getAllData = async (models = []) => {
    const data = await fetchData(models);

    if (data) {
      if (models.includes("users")) setUsers(data.users);
      if (models.includes("job-postings")) setJobPostings(data.jobPostings);
      if (models.includes("resumes")) setResumes(data.resumes);
    }
  };

  return (
    <DataContext.Provider
      value={{
        users, setUsers,
        jobPostings, setJobPostings,
        resumes, setResumes,
        getAllData, 
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
