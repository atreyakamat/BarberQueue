import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { bookingsAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatTime } from '../utils';
import BarberDashboard from './BarberDashboard';

const DashboardPage = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  // Show barber dashboard for barbers
  if (user.role === 'barber') {
    return <BarberDashboard />;
  }

  // Customer dashboard
  return <CustomerDashboard />;
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [recentBookings, setRecentBookings] = useState([]);
  const [nearbyBarbers, setNearbyBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('booking-updated', handleBookingUpdate);
      socket.on('queue-updated', handleQueueUpdate);
      
      return () => {
        socket.off('booking-updated');
        socket.off('queue-updated');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [bookingsResponse, barbersResponse] = await Promise.all([
        bookingsAPI.getMyBookings(),
        usersAPI.getBarbers()
      ]);

      const bookings = bookingsResponse.data.bookings || bookingsResponse.data || [];
      const barbers = barbersResponse.data.barbers || barbersResponse.data || [];

      setRecentBookings(bookings.slice(0, 5));
      setNearbyBarbers(barbers.slice(0, 4));
      
      // Calculate stats
      setStats({
        totalBookings: bookings.length,
        upcomingBookings: bookings.filter(b => b.status === 'confirmed' && new Date(b.scheduledTime) > new Date()).length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length
      });
    } catch (error) {
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingUpdate = (booking) => {
    if (booking.customer._id === user.id || booking.customer === user.id) {
      fetchDashboardData();
    }
  };

  const handleQueueUpdate = (data) => {
    if (data.userId === user.id) {
      toast.success(`Queue position update: ${data.position}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeStatus = (date, time) => {
    const appointmentTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'Past';
    if (diffHours < 24) return 'Today';
    if (diffHours < 48) return 'Tomorrow';
    return 'Upcoming';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
        <p className="text-sm sm:text-base text-gray-600">Here's your booking overview and nearby barbers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-8 0v10a2 2 0 002 2h8a2 2 0 002-2V7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.upcomingBookings}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Cancelled</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.cancelledBookings}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Link
          to="/barbers"
          className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Find Barbers</h3>
              <p className="text-white/90">Book an appointment</p>
            </div>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </Link>

        <Link
          to="/queue"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Join Queue</h3>
              <p className="text-white/90">Real-time queue</p>
            </div>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        </Link>

        <Link
          to="/profile"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">My Profile</h3>
              <p className="text-white/90">Account settings</p>
            </div>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <Link
              to="/profile"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-8 0v10a2 2 0 002 2h8a2 2 0 002-2V7" />
                </svg>
              </div>
              <p className="text-gray-600">No bookings yet</p>
              <Link
                to="/barbers"
                className="mt-3 inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Book Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map(booking => (
                <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {(booking.barber?.name || 'B').split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{booking.barber?.name || 'Barber'}</div>
                      <div className="text-sm text-gray-600">
                        {booking.services?.map(s => s.service?.name || s.name).filter(Boolean).join(', ') || 'Service'} • {formatDate(booking.scheduledTime)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Barbers */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Popular Barbers</h2>
            <Link
              to="/barbers"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {nearbyBarbers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-600">No barbers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nearbyBarbers.map(barber => (
                <div key={barber._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {barber.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{barber.name}</div>
                      <div className="text-sm text-gray-600">{barber.shopName || barber.phone}</div>
                      <div className="text-sm text-gray-600">{barber.shopAddress || ''}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      barber.isAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <Link
                      to={`/book/${barber._id}`}
                      className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
