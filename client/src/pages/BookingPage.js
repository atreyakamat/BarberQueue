import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { formatDate, formatTime } from '../utils';

const BookingPage = () => {
  const { barberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (barberId) {
      fetchBarberDetails();
      fetchServices();
    }
  }, [barberId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  const fetchBarberDetails = async () => {
    try {
      const response = await api.get(`/users/${barberId}`);
      setBarber(response.data);
    } catch (error) {
      toast.error('Error fetching barber details');
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get(`/services?barberId=${barberId}`);
      setServices(response.data);
    } catch (error) {
      toast.error('Error fetching services');
    }
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/bookings/available-slots`, {
        params: {
          barberId,
          date: selectedDate,
          serviceId: selectedService
        }
      });
      setAvailableSlots(response.data);
    } catch (error) {
      toast.error('Error fetching available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Please select all fields');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        barberId,
        serviceId: selectedService,
        date: selectedDate,
        time: selectedTime
      };

      const response = await api.post('/bookings', bookingData);
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('booking:created', response.data);
      }

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
    maxDate.setDate(maxDate.getDate() + 30); // Allow booking 30 days in advance
    return maxDate.toISOString().split('T')[0];
  };

  if (!barber) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Barber Header */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">
                {barber.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{barber.name}</h1>
              <p className="text-white/90">{barber.phone}</p>
              <p className="text-white/90">{barber.address}</p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Book Your Appointment</h2>
          
          <form onSubmit={handleBooking} className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Choose a service</option>
                {services.map(service => (
                  <option key={service._id} value={service._id}>
                    {service.name} - ₹{service.price} ({service.duration} min)
                  </option>
                ))}
              </select>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Time Selection */}
            {selectedDate && selectedService && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time
                </label>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          selectedTime === slot
                            ? 'bg-primary text-white border-primary'
                            : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
                
                {!loading && availableSlots.length === 0 && selectedDate && selectedService && (
                  <p className="text-gray-500 text-center py-4">
                    No available slots for this date. Please choose another date.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={bookingLoading || !selectedService || !selectedDate || !selectedTime}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {bookingLoading ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
