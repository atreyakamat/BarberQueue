import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { authAPI, bookingsAPI, queueAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatTime } from '../utils';

const BarberDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [stats, setStats] = useState({
    todayBookings: 0,
    totalBookings: 0,
    queueLength: 0,
    totalRevenue: 0,
    completedBookings: 0,
    pendingBookings: 0
  });
  
  const [todayBookings, setTodayBookings] = useState([]);
  const [currentQueue, setCurrentQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUserAvailability();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('booking:created', handleBookingUpdate);
      socket.on('booking:updated', handleBookingUpdate);
      socket.on('queue:updated', handleQueueUpdate);
      
      return () => {
        socket.off('booking:created');
        socket.off('booking:updated');
        socket.off('queue:updated');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, bookingsResponse, queueResponse] = await Promise.all([
        bookingsAPI.getStats(),
        bookingsAPI.getTodayBookings(),
        queueAPI.getMyQueue()
      ]);

      setStats(statsResponse.data);
      setTodayBookings(bookingsResponse.data);
      setCurrentQueue(queueResponse.data);
    } catch (error) {
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAvailability = async () => {
    try {
      const response = await authAPI.getProfile();
      setIsAvailable(response.data.isAvailable);
    } catch (error) {
      console.error('Error fetching availability');
    }
  };

  const handleBookingUpdate = (booking) => {
    if (booking.barber._id === user.id || booking.barber === user.id) {
      fetchDashboardData();
    }
  };

  const handleQueueUpdate = (queue) => {
    if (queue.barber._id === user.id || queue.barber === user.id) {
      setCurrentQueue(queue);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await authAPI.toggleAvailability();
      setIsAvailable(response.data.isAvailable);
      toast.success(`You are now ${response.data.isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error('Error updating availability');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, status);
      toast.success('Booking updated successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Error updating booking');
    }
  };

  const callNextCustomer = async () => {
    if (!currentQueue || currentQueue.customers.length === 0) {
      toast.error('No customers in queue');
      return;
    }

    try {
      await queueAPI.callNextCustomer(currentQueue._id);
      
      if (socket) {
        socket.emit('queue:next-customer', currentQueue._id);
      }
      
      toast.success('Next customer called');
    } catch (error) {
      toast.error('Error calling next customer');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
            <p className="text-gray-600">Here's what's happening with your business today</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </div>
            <button
              onClick={toggleAvailability}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isAvailable ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-8 0v10a2 2 0 002 2h8a2 2 0 002-2V7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Queue Length</p>
              <p className="text-2xl font-bold text-gray-900">{stats.queueLength}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Bookings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Today's Bookings</h2>
            <span className="text-sm text-gray-600">{formatDate(new Date())}</span>
          </div>
          
          {todayBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-8 0v10a2 2 0 002 2h8a2 2 0 002-2V7" />
                </svg>
              </div>
              <p className="text-gray-600">No bookings for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayBookings.map(booking => (
                <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {booking.customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{booking.customer.name}</div>
                      <div className="text-sm text-gray-600">
                        {booking.service.name} • {formatTime(booking.time)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    
                    {booking.status === 'confirmed' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'completed')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Queue */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Current Queue</h2>
            {currentQueue && currentQueue.customers.length > 0 && (
              <button
                onClick={callNextCustomer}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Call Next
              </button>
            )}
          </div>
          
          {!currentQueue || currentQueue.customers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-gray-600">No customers in queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentQueue.customers.slice(0, 10).map((customer, index) => (
                <div 
                  key={customer._id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">Customer {index + 1}</div>
                      <div className="text-sm text-gray-600">
                        Joined: {formatTime(customer.joinedAt)}
                      </div>
                    </div>
                  </div>
                  
                  {index === 0 && (
                    <span className="text-sm font-medium text-green-600">
                      Current
                    </span>
                  )}
                </div>
              ))}
              
              {currentQueue.customers.length > 10 && (
                <div className="text-center text-gray-500 py-2">
                  ... and {currentQueue.customers.length - 10} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;
