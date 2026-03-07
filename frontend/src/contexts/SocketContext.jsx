import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within a SocketProvider');
    return context;
};

export const SocketProvider = ({ children }) => {
    const user = useAuthStore(state => state.user);
    const socketRef = useRef(null);
    const socketUrl = "http://localhost:5000";

    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    // Connect / disconnect based on user availability
    useEffect(() => {
        if (!user?._id || !socketUrl) {
            if (socketRef.current) {
                console.log('Disconnecting socket since user is unavailable.');
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            return;
        }

        console.log('Initializing socket connection...', { socketUrl, userId: user._id });

        const socket = io(socketUrl, {
            auth: {
                userId: user._id,
                username: user.name,
            },
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to server with socket ID:', socket.id);
            setConnected(true);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            setConnected(false);
        });

        return () => {
            console.log('Cleaning up socket connection...');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?._id, user?.name]);

    // Join user room once connected
    useEffect(() => {
        if (socketRef.current && user?._id && connected) {
            console.log('Joining room for user:', user._id);
            socketRef.current.emit('join-user-room', user._id);
        }
    }, [connected, user?._id]);

    // Online / offline presence
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const handleUserOnline = (onlineUserId) => {
            setOnlineUsers(prev => new Set(prev).add(onlineUserId));
        };

        const handleUserOffline = (offlineUserId) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev);
                updated.delete(offlineUserId);
                return updated;
            });
        };

        socket.on('user-online', handleUserOnline);
        socket.on('user-offline', handleUserOffline);

        return () => {
            socket.off('user-online', handleUserOnline);
            socket.off('user-offline', handleUserOffline);
        };
    }, [connected]);

    return (
        <SocketContext.Provider value={{ 
            socket: socketRef.current, 
            connected,
            onlineUsers 
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;