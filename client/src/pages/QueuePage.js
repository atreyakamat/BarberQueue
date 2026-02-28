import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { usersAPI, queueAPI, bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatTime } from '../utils';

const QueuePage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [myActiveBooking, setMyActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningQueue, setJoiningQueue] = useState(false);

  useEffect(() => {
    fetchBarbers();
    fetchMyBookings();
  }, []);

  useEffect(() => {
    if (selectedBarber) {
      fetchQueue(selectedBarber._id);
    }
  }, [selectedBarber]);

  useEffect(() => {
    if (socket) {
      const handleQueueUpdate = () => {
        if (selectedBarber) fetchQueue(selectedBarber._id);
        fetchMyBookings();
      };
      
      socket.on('queue-updated', handleQueueUpdate);
      socket.on('booking-updated', handleQueueUpdate);
      
      return () => {
        socket.off('queue-updated', handleQueueUpdate);
        socket.off('booking-updated', handleQueueUpdate);
      };
    }
  }, [socket, selectedBarber]);

  // Listen for notification events (position <= 2)
  useEffect(() => {
    const handleNotification = (e) => {
      if (selectedBarber) fetchQueue(selectedBarber._id);
      fetchMyBookings();
    };
    window.addEventListener('notification', handleNotification);
    return () => window.removeEventListener('notification', handleNotification);
  }, [selectedBarber]);

  const fetchBarbers = async () => {
    try {
      const response = await usersAPI.getBarbers();
      const barbersList = response.data.barbers || response.data || [];
      setBarbers(barbersList);
      if (barbersList.length > 0 && !selectedBarber) {
        setSelectedBarber(barbersList[0]);
      }
    } catch (error) {
      toast.error('Error fetching barbers');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async (barberId) => {
    try {
      const response = await queueAPI.getQueue(barberId);
      setQueueData(response.data);
    } catch (error) {
      setQueueData(null);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await bookingsAPI.getMyBookings({ status: 'confirmed,in-progress,pending' });
      const bookings = response.data.bookings || response.data || [];
      // Find active booking in any queue
      const active = bookings.find(b => 
        ['confirmed', 'in-progress', 'pending'].includes(b.status) && b.queuePosition
      );
      setMyActiveBooking(active || null);
    } catch (error) {
      // Silently fail
    }
  };

  const getEstimatedWaitTime = (position, avgServiceTime = 20) => {
    const waitTime = (position - 1) * avgServiceTime;
    if (waitTime < 60) return `${waitTime} min`;
    return `${Math.floor(waitTime / 60)}h ${waitTime % 60}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeQueue = queueData?.queue || [];
  const avgServiceTime = queueData?.averageServiceTime || 20;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Live Queue</h1>
        <p className="text-gray-600">Track your position in real-time</p>
      </div>

      {/* My Active Booking Alert */}
      {myActiveBooking && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
              {myActiveBooking.queuePosition || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">You're in the Queue!</h3>
              <p className="text-sm text-blue-700">
                Position #{myActiveBooking.queuePosition} • Est. wait: {getEstimatedWaitTime(myActiveBooking.queuePosition || 1, avgServiceTime)}
              </p>
            </div>
          </div>
          <Link
            to={`/booking/${myActiveBooking._id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Booking Details →
          </Link>
        </div>
      )}

      {/* Barber Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select a Barber</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {barbers.map(barber => (
            <button
              key={barber._id}
              onClick={() => setSelectedBarber(barber)}
              className={`p-3 rounded-xl text-left transition-all ${
                selectedBarber?._id === barber._id
                  ? 'bg-primary-50 border-2 border-primary-500 shadow-md'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                  barber.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  {barber.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{barber.name}</div>
                  <div className="text-xs text-gray-500 truncate">{barber.shopName || ''}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Queue Display */}
      {selectedBarber && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {selectedBarber.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedBarber.name}</h2>
                  <p className="text-white/80 text-sm">{selectedBarber.shopName || ''}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{activeQueue.length}</div>
                <div className="text-sm text-white/80">in queue</div>
              </div>
            </div>
            {queueData?.estimatedWaitTime > 0 && (
              <div className="mt-3 text-sm text-white/90">
                Estimated total wait: ~{Math.round(queueData.estimatedWaitTime)} min
              </div>
            )}
          </div>

          {/* Queue Actions */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/book/${selectedBarber._id}`}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors text-center"
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Queue List */}
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Current Queue</h3>
            {activeQueue.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">No one in queue right now</p>
                <p className="text-sm text-gray-500 mt-1">Book an appointment to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeQueue.map((item, index) => {
                  const isCurrentUser = item.booking?.customer?._id === (user?.id || user?._id);
                  return (
                    <div 
                      key={item._id || index} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        item.status === 'in-progress' ? 'bg-green-50 border border-green-200' :
                        isCurrentUser ? 'bg-blue-50 border border-blue-200' :
                        'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          item.status === 'in-progress' ? 'bg-green-500 text-white' :
                          isCurrentUser ? 'bg-blue-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {isCurrentUser ? 'You' : `Customer ${index + 1}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.status === 'in-progress' ? 'Being served' : 
                             `Wait: ~${getEstimatedWaitTime(index + 1, avgServiceTime)}`}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.status === 'in-progress' ? 'bg-green-100 text-green-700' :
                        item.status === 'notified' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.status === 'in-progress' ? 'In Service' : 
                         item.status === 'notified' ? 'Next Up' : 'Waiting'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Queue Stats */}
            {queueData && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{queueData.totalServedToday || 0}</div>
                  <div className="text-xs text-gray-500">Served Today</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{Math.round(queueData.averageServiceTime || 20)}</div>
                  <div className="text-xs text-gray-500">Avg. Min</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{activeQueue.length}</div>
                  <div className="text-xs text-gray-500">In Queue</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueuePage;
