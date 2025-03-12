import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setLoading(false); // No token, stop loading
                return;
            }

            try {
                const response = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.success) {
                    setUser(response.data.data.user);
                    localStorage.setItem("user", JSON.stringify(response.data.data.user));
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                logout();
            } finally {
                setLoading(false); // Stop loading after request finishes
            }
        };

        fetchUser();
    }, []);

    const refreshUser = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
    
        try {
            const response = await axios.get('http://localhost:5000/api/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (response.data.success) {
                setUser(response.data.data.user);
                localStorage.setItem("user", JSON.stringify(response.data.data.user));
            } else {
                logout();
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
            logout();
        }
    };    

    const login = async (userData, token) => {
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        refreshUser();
    };

    const logout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
    };

    const handleJobAction = async (e, jobId, actionType) => {
        try {
            if (!user) {
                console.error("User not authenticated");
                return;
            }
            
            const token = localStorage.getItem("authToken")
            if (!token) {
                console.log('Token not found')
                return;
            }

            const endpoints = {
                save: `http://localhost:5000/api/job-postings/${jobId}/save-job`,
                apply: `http://localhost:5000/api/job-postings/${jobId}/apply-to-job`,
            }
            
            const userStateKeys = {
                save: savedJobs,
                apply: appliedJobs
            }

            if (!endpoints[actionType] || !userStateKeys[actionType]) {
                console.error("Invalid action type");
                return;
            }

            const response = await axios.post(
                endpoints[actionType],
                {}, // No request body needed
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            console.log(response.data);

            setUser((prevUser) => ({
                ...prevUser,
                [userStateKeys[actionType]]: prevUser[userStateKeys[actionType]].includes(jobId)
                    ? prevUser[userStateKeys[actionType]].filter((id) => id !== jobId) // Remove if already added
                    : [...prevUser[userStateKeys[actionType]], jobId] // Add if not added
            }));

        } catch (error) {
            console.error('Error', error)
        }
    }
    const toggleSaveJob = (e, jobId) => handleJobAction(e, jobId, "save")
    const toggleApplyJob = (e, jobId) => handleJobAction(e, jobId, "apply")

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading, refreshUser, toggleSaveJob }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
