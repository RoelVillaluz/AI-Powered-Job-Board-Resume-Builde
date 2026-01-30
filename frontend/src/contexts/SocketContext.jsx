import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const user = useAuthStore(state => state.user);

  const socketRef = useRef(null);
  const socketUrl = "http://localhost:5000";

  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Connect to socket server when user + socketUrl available
  useEffect(() => {
    if (!user || !user._id || !socketUrl) {
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
      if (socket) {
        console.log('Cleaning up socket connection...');
        socket.disconnect();
      }
    };
  }, [socketUrl, user?._id, user?.name]);

  // Emit join-user-room event
  useEffect(() => {
    if (socketRef.current && user && user._id && connected) {
      console.log('Joining room for user:', user._id);
      socketRef.current.emit('join-user-room', user._id);
    }
  }, [connected, user?._id]);

  // Online / offline events handling
  useEffect(() => {
    if (!socketRef.current) return;

    const handleUserOnline = (onlineUserId) => {
      console.log(`${onlineUserId} is online`);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.add(onlineUserId);
        return updated;
      });
    };

    const handleUserOffline = (offlineUserId) => {
      console.log(`${offlineUserId} went offline`);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(offlineUserId);
        return updated;
      });
    };

    socketRef.current.on('user-online', handleUserOnline);
    socketRef.current.on('user-offline', handleUserOffline);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('user-online', handleUserOnline);
        socketRef.current.off('user-offline', handleUserOffline);
      }
    };
  }, [connected]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;