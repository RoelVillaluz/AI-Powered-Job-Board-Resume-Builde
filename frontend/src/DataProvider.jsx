import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./components/AuthProvider";
import { model } from "mongoose";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [name, setName] = useState(null);

  const [users, setUsers] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const [error, setError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [isLoading, setIsLoading] = useState(true)

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
      console.log("Fetched data:", data);
      if (models.includes("users")) setUsers(data["users"] || []);
      if (models.includes("job-postings")) setJobPostings(data["job-postings"] || []); 
      if (models.includes("resumes")) setResumes(data["resumes"] || []);
      if (model.includes("companies")) setCompanies(data["companies"] || []);
    }
  };

  const fetchResumes = async (userId) => {
    if (!userId) {
      console.warn("fetchResumes called without a userId");
      return;
    }
  
    try {
      const response = await axios.get(`${baseUrl}/resumes/user/${userId}`);
      console.log("Resumes API Response:", response.data);
  
      if (!Array.isArray(response.data.data)) {
        console.error("Invalid data format:", response.data);
        return;
      }
  
      setResumes(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(response.data.data)) {
          return response.data.data;
        }
        return prev;
      });
  
      if (response.data.data.length > 0) {
        setName(`${response.data.data[0].firstName} ${response.data.data[0].lastName}`);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };
  

  const fetchJobRecommendations = async () => {
    try {
        const response = await axios.get(`${baseUrl}/ai/job-recommendations/${user._id}`)
        const recommendations = response.data.data || []

        console.log('Recommendations:', recommendations)
        setJobRecommendations(recommendations)
        return recommendations
    } catch (error) {
        console.error('Error', error)
    } 
  }


  return (
    <DataContext.Provider
      value={{
        baseUrl,
        name, setName,
        users, setUsers,
        jobPostings, setJobPostings,
        jobRecommendations, setJobRecommendations,
        resumes, setResumes,
        companies, setCompanies,
        getAllData, 
        fetchResumes,
        fetchJobRecommendations,
        success, setSuccess,
        successMessage, setSuccessMessage,
        error, setError,
        errorMessage, setErrorMessage,
        isLoading, setIsLoading
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
