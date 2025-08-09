import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useData } from './DataProvider';
import { useAuth } from './AuthProvider';

const ResumeContext = createContext();

const ResumeProvider = ({ children }) => {
    const { baseUrl } = useData();
    const { user, setUser } = useAuth();

    const [resumes, setResumes] = useState([]);
    const [currentResume, setCurrentResume] = useState(null);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await axios.get(`${baseUrl}/resumes/user/${user?._id}`)
                console.log('User Resumes: ', response.data.data)

                setResumes(response.data.data)
                if (response.data.data.length > 0) {
                    setCurrentResume(response.data.data[0]);
                }
            } catch (error) {
                console.error('Error: ', error)
            }
        }
        fetchResumes()
    }, [user?._id])

    return { resumes, currentResume }
}