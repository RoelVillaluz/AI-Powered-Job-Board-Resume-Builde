import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useData } from './DataProvider';
import { useAuth } from './AuthProvider';

const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);

const ResumeProvider = ({ children }) => {
    const { user, setUser } = useAuth();

    const [resumes, setResumes] = useState([]);
    const [currentResume, setCurrentResume] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResumes = async () => {
            if (!user._id) return;

            setLoading(true)

            try {
                const response = await axios.get(`${baseUrl}/resumes/user/${user?._id}`)
                console.log('User Resumes: ', response.data.data)

                setResumes(response.data.data)
                if (response.data.data.length > 0) {
                    setCurrentResume(response.data.data[0]);
                }
            } catch (error) {
                console.error('Error: ', error)
            } finally {
                setLoading(false)
            }
        }
        fetchResumes()
    }, [user?._id])

    return (
        <ResumeContext.Provider value={{ resumes, currentResume, setCurrentResume, loading }}>
            {children}
        </ResumeContext.Provider>
    );
}

export default ResumeProvider;