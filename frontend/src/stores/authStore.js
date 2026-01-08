import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';
import { BASE_API_URL } from '../config/api.js';

// Helper to decode JWT (lazy load)
let jwtDecodeFn = null
const decodeToken = async (token) => {
    if (!jwtDecodeFn) {
        const mod = await import('jwt-decode')
        jwtDecodeFn = mod.jwtDecode
    }
    return jwtDecodeFn(token)
}

export const useAuthStore = create(
    devtools(
        persist(
            (set, get) => ({
                // State
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: true,

                // Actions
                login: async (email, password) => {
                    try {
                        const { data } = await axios.post(`${BASE_API_URL}/auth/login`, {
                            email,
                            password
                        });

                        const { token, user } = data.data;

                        set({
                            user,
                            token,
                            isAuthenticated: true,
                            isLoading: false
                        });

                        return { success: true };
                    } catch (error) {
                        console.error('Login failed:', error);

                        const message =
                            error.response?.data?.formattedMessage ||
                            error.response?.data?.message ||
                            error.message ||
                            'Login failed';

                        return {
                            success: false,
                            message
                        };
                    }
                },

                logout: () => {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false
                    })
                },

                // Restore session from token
                restoreSession: async () => {
                    const { token } = get();

                    if (!token) {
                        set({ isLoading: false })
                        return
                    }

                    try {
                        const decoded = await decodeToken(token);
                        const userId = decoded.id || decoded._id;

                        const { data } = await axios.get(`${BASE_API_URL}/users/${userId}`, {
                            headers: { Authorization: `Bearer ${token}`}
                        })

                        if (data.success) {
                            set({
                                user: data.data.user,
                                isAuthenticated: true,
                                isLoading: false
                            })
                        } else {
                            get().logout()
                        }
                    } catch (error) {
                        console.error('Session restore failed:', error);
                        if (error.response?.status === 401) {
                        get().logout();
                        }
                        set({ isLoading: false });
                    }
                },

                // Manually refresh user data
                refreshUser: async () => {
                    const { token } = get();
                    if (!token) return;

                    try {
                        const decoded = await decodeToken(token)
                        const userId = decoded.id || decoded._id

                        const { data } = await axios.get(`${BASE_API_URL}/users/${userId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })

                        if (data.success) {
                            set({ user: data.data.user });
                        }
                    } catch (error) {
                        console.error('User refresh failed:', error);
                        if (error.response?.status === 401) {
                            get().logout();
                        }
                    }
                },
            }),
            {
                name: 'auth-storage',
                partialize: (state) => ({
                    token: state.token,
                    user: state.user
                }),
            }
        ),
        { name: 'AuthStore' }
    )
)