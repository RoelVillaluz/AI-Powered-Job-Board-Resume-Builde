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

    const toggleSaveJob = async (e, jobId) => {
        try {
            e.preventDefault();
            e.stopPropagation();
    
            if (!user) {
                console.error("User not authenticated");
                return;
            }
    
            const token = localStorage.getItem("authToken"); // Get token from localStorage
            if (!token) {
                console.error("No token found");
                return;
            }
    
            const response = await axios.post(
                `http://localhost:5000/api/job-postings/${jobId}/save-job`,
                {}, // No request body needed
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Attach token
                    },
                }
            );
    
            console.log(response.data); // Check response

            setUser((prevUser) => ({
                ...prevUser,
                savedJobs : prevUser.savedJobs.includes(jobId)
                        ? prevUser.savedJobs.filter((id) => id !== jobId) // remove if already saved
                        : [...prevUser.savedJobs, jobId] // add if not saved
            }))
        } catch (error) {
            console.error("Error saving job:", error.response?.data || error.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading, refreshUser, toggleSaveJob }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
