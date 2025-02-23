import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Check if user is logged in
    useEffect(() => {
        const storedUser = localStorage.getItem("user"); // Fetch from localStorage
        if (storedUser) {
            setUser(JSON.parse(storedUser)); // Parse and set user state
        }
    }, []);

    const login = (userData, token) => {
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData)
    }       

    return (
        <AuthContext.Provider value={{ user, setUser, login }}>
            {children}
        </AuthContext.Provider>
    );
};
