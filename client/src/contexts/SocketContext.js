import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        autoConnect: true,
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        
        // Join user-specific rooms
        if (user.role === 'barber') {
          newSocket.emit('join-barber-room', user.id);
        } else if (user.role === 'customer') {
          newSocket.emit('join-customer-room', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Listen for booking updates
      newSocket.on('booking-updated', (data) => {
        console.log('Booking updated:', data);
        toast.success(data.message || 'Booking updated');
        
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('booking-updated', {
          detail: data
        }));
      });

      // Listen for queue updates
      newSocket.on('queue-updated', (data) => {
        console.log('Queue updated:', data);
        
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('queue-updated', {
          detail: data
        }));
      });

      // Listen for notifications
      newSocket.on('notification', (data) => {
        console.log('Notification:', data);
        
        // Show toast notification
        if (data.type === 'info') {
          toast.success(data.message);
        } else if (data.type === 'warning') {
          toast.error(data.message);
        } else {
          toast(data.message);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  const emitQueueUpdate = (data) => {
    if (socket && connected) {
      socket.emit('queue-update', data);
    }
  };

  const emitBookingUpdate = (data) => {
    if (socket && connected) {
      socket.emit('booking-update', data);
    }
  };

  const joinBarberRoom = (barberId) => {
    if (socket && connected) {
      socket.emit('join-barber-room', barberId);
    }
  };

  const joinCustomerRoom = (customerId) => {
    if (socket && connected) {
      socket.emit('join-customer-room', customerId);
    }
  };

  const value = {
    socket,
    connected,
    emitQueueUpdate,
    emitBookingUpdate,
    joinBarberRoom,
    joinCustomerRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
