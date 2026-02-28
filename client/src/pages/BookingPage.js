import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { usersAPI, servicesAPI, bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const BookingPage = () => {
  const { barberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [barberStatus, setBarberStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (barberId) {
      fetchBarberDetails();
      fetchServices();
      fetchBarberStatus();
    }
  }, [barberId]);

  useEffect(() => {
    if (selectedDate && selectedServices.length > 0) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedServices]);

  useEffect(() => {
    // Calculate totals when services change
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = services.find(s => s._id === serviceId);
      return sum + (service ? service.price : 0);
    }, 0);
    
    const duration = selectedServices.reduce((sum, serviceId) => {
      const service = services.find(s => s._id === serviceId);
      return sum + (service ? service.duration : 0);
    }, 0);
    
    setTotalAmount(total);
    setTotalDuration(duration);
  }, [selectedServices, services]);

  const fetchBarberDetails = async () => {
    try {
      const response = await usersAPI.getBarberDetails(barberId);
      setBarber(response.data.barber || response.data);
    } catch (error) {
      toast.error('Error fetching barber details');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getBarberServices(barberId);
      setServices(response.data.services);
    } catch (error) {
      toast.error('Error fetching services');
    }
  };

  const fetchBarberStatus = async () => {
    try {
      const response = await bookingsAPI.getBarberStatus(barberId);
      setBarberStatus(response.data);
    } catch (error) {
      console.error('Error fetching barber status:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await bookingsAPI.getAvailableSlots({
        barberId,
        date: selectedDate,
        serviceIds: selectedServices.join(',')
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      toast.error('Error fetching available slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
    setSelectedTime(''); // Reset time when services change
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        barberId,
        services: selectedServices,
        scheduledTime: selectedTime
      };

      const response = await bookingsAPI.createBooking(bookingData);

      toast.success('Booking created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating booking');
    } finally {
      setBookingLoading(false);
    }
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

  if (!barber) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Barber Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">
                  {barber.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{barber.name}</h1>
                <p className="text-white/90">{barber.shopName}</p>
                {barber.shopAddress && <p className="text-white/90 text-sm">{barber.shopAddress}</p>}
              </div>
            </div>
            
            {/* Barber Status */}
            {barberStatus && (
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  barberStatus.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {barberStatus.isAvailable ? '🟢 Available' : '🔴 Busy'}
                </div>
                {!barberStatus.isAvailable && (
                  <p className="text-white/90 text-sm mt-1">
                    Queue: {barberStatus.queueLength} people
                  </p>
                )}
                {barberStatus.estimatedWaitTime > 0 && (
                  <p className="text-white/90 text-sm">
                    Wait: ~{barberStatus.estimatedWaitTime} min
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Book Your Appointment</h2>
          
          <form onSubmit={handleBooking} className="space-y-6">
            {/* Services Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Services
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map(service => (
                  <div 
                    key={service._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedServices.includes(service._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleServiceToggle(service._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{service.category}</p>
                        <p className="text-sm text-gray-600 mt-1">{service.duration} minutes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{service.price}</p>
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service._id)}
                          onChange={() => handleServiceToggle(service._id)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              {selectedServices.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Duration: {totalDuration} minutes</span>
                    <span className="font-bold text-green-600">Total: ₹{totalAmount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Time Selection */}
            {selectedDate && selectedServices.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Time Slots
                </label>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-3 text-sm border rounded-lg transition-all ${
                          selectedTime === slot.time
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {slot.displayTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-4">No available slots for this date</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={bookingLoading || selectedServices.length === 0 || !selectedDate || !selectedTime}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {bookingLoading ? 'Booking...' : `Book Appointment (₹${totalAmount})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
