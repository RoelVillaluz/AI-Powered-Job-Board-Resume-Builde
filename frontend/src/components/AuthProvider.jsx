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

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
