import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from 'react';

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
    onlineUsers: Set<string>;
}

interface SocketProviderProps {
    children: ReactNode;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }

    return context;
};

export const SocketProvider = ({
    children,
}: SocketProviderProps): JSX.Element => {
    const user = useAuthStore((state) => state.user);

    const socketRef = useRef<Socket | null>(null);

    const socketUrl = 'http://localhost:5000';

    const [connected, setConnected] = useState<boolean>(false);

    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // Connect / disconnect based on user availability
    useEffect(() => {
        if (!user?._id || !socketUrl) {
            if (socketRef.current) {
                console.log(
                    'Disconnecting socket since user is unavailable.'
                );

                socketRef.current.disconnect();
                socketRef.current = null;

                setConnected(false);
            }

            return;
        }

        console.log('Initializing socket connection...', {
            socketUrl,
            userId: user._id,
        });

        const socket = io(socketUrl, {
            auth: {
                userId: user._id,
                username: user.name,
            },
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(
                'Connected to server with socket ID:',
                socket.id
            );

            setConnected(true);
        });

        socket.on('connect_error', (error: Error) => {
            console.error('Socket connection error:', error);
        });

        socket.on('disconnect', (reason: string) => {
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

            socketRef.current.emit(
                'join-user-room',
                user._id
            );
        }
    }, [connected, user?._id]);

    // Online / offline presence
    useEffect(() => {
        const socket = socketRef.current;

        if (!socket) return;

        const handleUserOnline = (
            onlineUserId: string
        ): void => {
            setOnlineUsers((prev) => {
                const updated = new Set(prev);
                updated.add(onlineUserId);
                return updated;
            });
        };

        const handleUserOffline = (
            offlineUserId: string
        ): void => {
            setOnlineUsers((prev) => {
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
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                connected,
                onlineUsers,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;