import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); 
    const navigate = useNavigate();

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
        navigate('/')
    };

    const handleJobAction = async (e, jobId, resume, actionType, hasQuestions = false, showModal, answers = null) => {
        e.preventDefault();
        e.stopPropagation();

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

            // If applying and there are questions, show modal instead of submitting
            // But only if we don't already have answers
            if (actionType === 'apply' && hasQuestions && !answers) {
                showModal(); // Call the function to show ApplicationFormModal
                return;
            }

            const endpoints = {
                save: `http://localhost:5000/api/users/save-job/${jobId}`,
                apply: `http://localhost:5000/api/users/apply-to-job/${jobId}`,
            }
            
            const userStateKeys = {
                save: "savedJobs",
                apply: "appliedJobs"
            }

            if (!endpoints[actionType] || !userStateKeys[actionType]) {
                console.error("Invalid action type");
                return;
            }

            const payload = {
                applicant: String(user._id),
                resume: resume,
            };

            // Only include answers if they exist
            if (answers) {
                payload.answers = answers;
            }

            const response = await axios.post(
                endpoints[actionType],
                payload,
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

            // Close the modal after successful submission
            if (actionType === 'apply' && hasQuestions && showModal) {
                showModal();
            }

        } catch (error) {
            console.error('Error', error)
        }
    }

    const toggleSaveJob = (e, jobId) => handleJobAction(e, jobId, null, "save")
    const toggleApplyJob = (e, jobId, resume, hasQuestions, showModal) => handleJobAction(e, jobId, resume, "apply", hasQuestions, showModal);

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading, refreshUser, toggleSaveJob, toggleApplyJob, handleJobAction }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
