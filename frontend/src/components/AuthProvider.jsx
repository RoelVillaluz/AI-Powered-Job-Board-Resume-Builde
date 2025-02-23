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

    const login = (userData, token) => {
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {!loading && children} {/* Prevent rendering until done checking auth */}
        </AuthContext.Provider>
    );
};
