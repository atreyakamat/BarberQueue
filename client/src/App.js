import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Layout components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import BarbersPage from './pages/BarbersPage';
import QueuePage from './pages/QueuePage';
import ProfilePage from './pages/ProfilePage';
import BookingDetailsPage from './pages/BookingDetailsPage';

// Barber Dashboard
import BarberDashboard from './pages/BarberDashboard';
import BarberBookings from './pages/BarberBookings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/barbers" element={<BarbersPage />} />

                {/* Protected customer routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/book/:barberId" 
                  element={
                    <ProtectedRoute>
                      <BookingPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/queue" 
                  element={
                    <ProtectedRoute>
                      <QueuePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/booking/:bookingId" 
                  element={
                    <ProtectedRoute>
                      <BookingDetailsPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected barber routes */}
                <Route 
                  path="/barber-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['barber']}>
                      <BarberDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/barber-bookings" 
                  element={
                    <ProtectedRoute allowedRoles={['barber']}>
                      <BarberBookings />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 route */}
                <Route path="*" element={<div className="container mx-auto px-4 py-8 text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-gray-600">Page not found</p>
                </div>} />
              </Routes>
            </Layout>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
