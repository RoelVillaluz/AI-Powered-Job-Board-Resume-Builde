import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../components/AuthProvider';
import { useData } from '../DataProvider';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const { user } = useAuth();
    const { baseUrl } = useData();

    useEffect(() => {
        // Only initialize socket if user is logged in and baseUrl is available
        if (!user || !user._id || !baseUrl) {
            // Clean up existing connection if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        // Initialize socket connection
        console.log('Initializing socket connection...', { baseUrl, userId: user._id });
        
        socketRef.current = io(baseUrl, {
            auth: {
                userId: user._id,
                username: user.name
            }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to server with socket ID:', socket.id);
            socket.emit('join-user-room', user._id);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
        });

        // Cleanup function
        return () => {
            if (socket) {
                console.log('Cleaning up socket connection...');
                socket.disconnect();
            }
        };
    }, [baseUrl, user?._id, user?.name]);

    // Always render children, socket will be null if user not logged in
    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;