import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

let jwtDecodeFn = null;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 🔐 Decode token safely (jwt-decode v4+)
    const decodeToken = async (token) => {
        if (!jwtDecodeFn) {
            const mod = await import("jwt-decode");
            jwtDecodeFn = mod.jwtDecode;
        }
        return jwtDecodeFn(token);
    };

    // 🔄 Restore user on app load
    useEffect(() => {
        const restoreUser = async () => {
            const token = localStorage.getItem("authToken");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const decoded = await decodeToken(token);
                const userId = decoded.id || decoded._id;

                if (!userId) {
                    throw new Error("Token does not contain user id");
                }

                const response = await axios.get(
                    `http://localhost:5000/api/users/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.success) {
                    setUser(response.data.data.user);
                    localStorage.setItem(
                        "user",
                        JSON.stringify(response.data.data.user)
                    );
                } else {
                    throw new Error("User fetch failed");
                }
            } catch (error) {
                console.error("Auth restore failed:", error);

                // ONLY logout if token is invalid
                if (error.response?.status === 401) {
                    logout();
                }
            } finally {
                setLoading(false);
            }
        };

        restoreUser();
    }, []);

    // 🔓 Login (NO refresh, NO race)
    const login = (userData, token) => {
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    // 🔁 Manual refresh (safe)
    const refreshUser = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
            const decoded = await decodeToken(token);
            const userId = decoded.id || decoded._id;

            const response = await axios.get(
                `http://localhost:5000/api/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.success) {
                setUser(response.data.data.user);
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.data.user)
                );
            }
        } catch (error) {
            console.error("User refresh failed:", error);

            if (error.response?.status === 401) {
                logout();
            }
        }
    };

    // 🚪 Logout
    const logout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                login,
                logout,
                refreshUser,
                loading,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};
