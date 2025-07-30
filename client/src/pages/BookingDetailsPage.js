import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatTime } from '../utils';

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingsAPI.getBooking(bookingId);
      setBooking(response.data);
    } catch (error) {
      toast.error('Error fetching booking details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      const response = await bookingsAPI.getAvailableSlots({
        barberId: booking.barber._id,
        date: date,
        serviceIds: booking.services.map(s => s.service._id)
      });
      setAvailableSlots(response.data);
    } catch (error) {
      toast.error('Error fetching available slots');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setActionLoading(true);
    try {
      await bookingsAPI.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      setBooking(prev => ({ ...prev, status: 'cancelled' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cancelling booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    
    if (!rescheduleData.date || !rescheduleData.time) {
      toast.error('Please select both date and time');
      return;
    }

    setActionLoading(true);
    try {
      const response = await bookingsAPI.rescheduleBooking(bookingId, rescheduleData);
      toast.success('Booking rescheduled successfully');
      setBooking(response.data);
      setShowReschedule(false);
      setRescheduleData({ date: '', time: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rescheduling booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setRescheduleData(prev => ({ ...prev, date, time: '' }));
    fetchAvailableSlots(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canModifyBooking = () => {
    if (!booking) return false;
    
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);
    
    return booking.status === 'confirmed' && hoursDiff > 2;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
        <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Status Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Booking #{booking._id.slice(-6)}</h2>
              <p className="text-white/90">
                {formatDate(booking.date)} at {formatTime(booking.time)}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full border ${getStatusColor(booking.status)}`}>
              <span className="font-semibold">
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Barber Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Barber Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-gray-600">
                      {booking.barber.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{booking.barber.name}</div>
                    <div className="text-sm text-gray-600">{booking.barber.phone}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Address:</strong> {booking.barber.address}
                </div>
              </div>
            </div>

            {/* Service Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Service Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="font-semibold">{booking.service.name}</div>
                  <div className="text-sm text-gray-600">{booking.service.description}</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{booking.service.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-primary">₹{booking.service.price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Booking Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Booking Created</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}
                  </div>
                </div>
              </div>
              
              {booking.status === 'confirmed' && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Booking Confirmed</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(booking.updatedAt)} at {formatTime(booking.updatedAt)}
                    </div>
                  </div>
                </div>
              )}
              
              {booking.status === 'cancelled' && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">Booking Cancelled</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(booking.updatedAt)} at {formatTime(booking.updatedAt)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canModifyBooking() && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowReschedule(true)}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Reschedule
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-4">Reschedule Booking</h3>
            
            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {rescheduleData.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Time
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleData(prev => ({ ...prev, time: slot }))}
                        className={`p-2 rounded-lg border text-center transition-colors ${
                          rescheduleData.time === slot
                            ? 'bg-primary text-white border-primary'
                            : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                  
                  {availableSlots.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No available slots for this date
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReschedule(false);
                    setRescheduleData({ date: '', time: '' });
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rescheduleData.date || !rescheduleData.time}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPage;
