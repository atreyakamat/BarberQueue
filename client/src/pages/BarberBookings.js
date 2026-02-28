import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDate, formatTime } from '../utils';

const BarberBookings = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    date: 'all',
    search: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters, dateRange]);

  useEffect(() => {
    if (socket) {
      socket.on('booking-updated', handleBookingUpdate);
      
      return () => {
        socket.off('booking-updated');
      };
    }
  }, [socket]);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getBarberBookings();
      setBookings(response.data.bookings || response.data || []);
    } catch (error) {
      toast.error('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingUpdate = (booking) => {
    if (booking.barber._id === user.id || booking.barber === user.id) {
      setBookings(prevBookings => {
        const existingIndex = prevBookings.findIndex(b => b._id === booking._id);
        if (existingIndex >= 0) {
          const updated = [...prevBookings];
          updated[existingIndex] = booking;
          return updated;
        } else {
          return [booking, ...prevBookings];
        }
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Date filter
    if (filters.date !== 'all') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      switch (filters.date) {
        case 'today':
          filtered = filtered.filter(booking => {
            const dt = new Date(booking.scheduledTime);
            return dt.toISOString().split('T')[0] === todayStr;
          });
          break;
        case 'week': {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.scheduledTime);
            return bookingDate >= weekStart && bookingDate <= weekEnd;
          });
          break;
        }
        case 'month': {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.scheduledTime);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
          });
          break;
        }
      }
    }

    // Custom date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.scheduledTime).toISOString().split('T')[0];
        return bookingDate >= dateRange.start && bookingDate <= dateRange.end;
      });
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customer?.name?.toLowerCase().includes(searchTerm) ||
        booking.customer?.phone?.includes(searchTerm) ||
        booking.services?.some(s => (s.service?.name || '').toLowerCase().includes(searchTerm))
      );
    }

    // Sort by scheduledTime
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledTime);
      const dateB = new Date(b.scheduledTime);
      return dateB - dateA;
    });

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, status);
      toast.success('Booking updated successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Error updating booking');
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

  const getStatusActions = (booking) => {
    switch (booking.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => updateBookingStatus(booking._id, 'confirmed')}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Confirm
            </button>
            <button
              onClick={() => updateBookingStatus(booking._id, 'cancelled')}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => updateBookingStatus(booking._id, 'completed')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Complete
            </button>
            <button
              onClick={() => updateBookingStatus(booking._id, 'cancelled')}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const exportBookings = () => {
    const csvContent = [
      ['Date', 'Time', 'Customer', 'Phone', 'Services', 'Amount', 'Status'],
      ...filteredBookings.map(booking => [
        formatDate(booking.scheduledTime),
        formatTime(booking.scheduledTime),
        booking.customer?.name || '',
        booking.customer?.phone || '',
        booking.services?.map(s => s.service?.name || s.name).filter(Boolean).join('; ') || '',
        booking.totalAmount || 0,
        booking.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
            <p className="text-gray-600">Manage all your appointments and bookings</p>
          </div>
          <button
            onClick={exportBookings}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
            <select
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search customers or services..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Found</label>
            <div className="w-full p-2 bg-gray-50 rounded-lg text-gray-700 font-medium">
              {filteredBookings.length} bookings
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h8a2 2 0 012 2v4m-8 0v10a2 2 0 002 2h8a2 2 0 002-2V7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-600">No bookings match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map(booking => {
                  const serviceNames = booking.services?.map(s => s.service?.name || s.name).filter(Boolean).join(', ') || 'Service';
                  const totalDuration = booking.totalDuration || booking.services?.reduce((sum, s) => sum + (s.service?.duration || 0), 0) || 0;
                  return (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {(booking.customer?.name || 'C').split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.customer?.name || 'Customer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.customer?.phone || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{serviceNames}</div>
                      <div className="text-sm text-gray-500">{totalDuration} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.scheduledTime)}</div>
                      <div className="text-sm text-gray-500">{formatTime(booking.scheduledTime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{booking.totalAmount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowModal(true);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          View
                        </button>
                        {getStatusActions(booking)}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="text-gray-900">{selectedBooking.customer?.name || 'Customer'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{selectedBooking.customer?.phone || ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Services</label>
                  <p className="text-gray-900">{selectedBooking.services?.map(s => s.service?.name || s.name).filter(Boolean).join(', ') || 'Service'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Price</label>
                  <p className="text-gray-900">₹{selectedBooking.totalAmount || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="text-gray-900">{formatDate(selectedBooking.scheduledTime)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <p className="text-gray-900">{formatTime(selectedBooking.scheduledTime)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="text-gray-900">{selectedBooking.totalDuration || 0} minutes</p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {getStatusActions(selectedBooking)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberBookings;
