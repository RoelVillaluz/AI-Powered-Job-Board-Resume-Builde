import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../components/AuthProvider';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user } = useAuth();
  const socketUrl = "http://localhost:5000";
  const [connected, setConnected] = useState(false);

  // Connect to socket server when user + socketUrl available
  useEffect(() => {
    if (!user || !user._id || !socketUrl) {
      // Clean up if user logs out or url not ready
      if (socketRef.current) {
        console.log('Disconnecting socket since user is unavailable.');
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Initialize socket connection
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

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log('Cleaning up socket connection...');
        socket.disconnect();
      }
    };
  }, [socketUrl, user?._id, user?.name]);

  // Emit join-user-room event when both socket and user ready
  useEffect(() => {
    if (socketRef.current && user && user._id && connected) {
      console.log('Joining room for user:', user._id);
      socketRef.current.emit('join-user-room', user._id);
    }
  }, [connected, user?._id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;