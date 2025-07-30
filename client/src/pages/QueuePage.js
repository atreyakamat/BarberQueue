import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { formatTime, formatDate } from '../utils';

const QueuePage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningQueue, setJoiningQueue] = useState(null);

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('queue:updated', handleQueueUpdate);
      socket.on('queue:position-changed', handlePositionChange);
      socket.on('queue:user-called', handleUserCalled);
      
      return () => {
        socket.off('queue:updated');
        socket.off('queue:position-changed');
        socket.off('queue:user-called');
      };
    }
  }, [socket]);

  const fetchQueues = async () => {
    try {
      const response = await api.get('/queue');
      setQueues(response.data);
    } catch (error) {
      toast.error('Error fetching queues');
    } finally {
      setLoading(false);
    }
  };

  const handleQueueUpdate = (updatedQueue) => {
    setQueues(prevQueues => 
      prevQueues.map(queue => 
        queue._id === updatedQueue._id ? updatedQueue : queue
      )
    );
  };

  const handlePositionChange = (data) => {
    toast.success(`Your position in ${data.barberName}'s queue: ${data.position}`);
  };

  const handleUserCalled = (data) => {
    if (data.userId === user.id) {
      toast.success(`You're being called by ${data.barberName}!`, { duration: 10000 });
    }
  };

  const joinQueue = async (queueId) => {
    setJoiningQueue(queueId);
    try {
      const response = await api.post(`/queue/${queueId}/join`);
      
      if (socket) {
        socket.emit('queue:joined', response.data);
      }
      
      toast.success('Successfully joined the queue!');
      fetchQueues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error joining queue');
    } finally {
      setJoiningQueue(null);
    }
  };

  const leaveQueue = async (queueId) => {
    try {
      const response = await api.post(`/queue/${queueId}/leave`);
      
      if (socket) {
        socket.emit('queue:left', response.data);
      }
      
      toast.success('Successfully left the queue');
      fetchQueues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error leaving queue');
    }
  };

  const getUserPosition = (queue) => {
    const position = queue.customers.findIndex(customer => customer.user === user.id);
    return position >= 0 ? position + 1 : null;
  };

  const isUserInQueue = (queue) => {
    return queue.customers.some(customer => customer.user === user.id);
  };

  const getEstimatedWaitTime = (position, avgServiceTime = 20) => {
    const waitTime = position * avgServiceTime;
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Queue Management</h1>
        <p className="text-gray-600">Join queues and track your position in real-time</p>
      </div>

      {queues.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Queues</h3>
          <p className="text-gray-600">There are no active queues at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {queues.map(queue => {
            const userPosition = getUserPosition(queue);
            const inQueue = isUserInQueue(queue);
            
            return (
              <div key={queue._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Queue Header */}
                <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold">
                          {queue.barber.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{queue.barber.name}</h2>
                        <p className="text-white/90">{queue.barber.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{queue.customers.length}</div>
                      <div className="text-sm text-white/90">in queue</div>
                    </div>
                  </div>
                </div>

                {/* Queue Content */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Queue Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Queue Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-semibold ${
                            queue.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {queue.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Serving:</span>
                          <span className="font-semibold">
                            {queue.currentCustomer ? `Position ${queue.currentPosition}` : 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Wait:</span>
                          <span className="font-semibold">
                            {userPosition ? getEstimatedWaitTime(userPosition - 1) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User Status */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Your Status</h3>
                      {inQueue ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                              {userPosition}
                            </div>
                            <div>
                              <div className="font-semibold text-blue-900">
                                Position {userPosition} in queue
                              </div>
                              <div className="text-sm text-blue-700">
                                Estimated wait: {getEstimatedWaitTime(userPosition - 1)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => leaveQueue(queue._id)}
                            className="mt-3 w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Leave Queue
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-gray-600">
                            You are not in this queue
                          </div>
                          <button
                            onClick={() => joinQueue(queue._id)}
                            disabled={joiningQueue === queue._id || queue.status !== 'active'}
                            className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {joiningQueue === queue._id ? 'Joining...' : 'Join Queue'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Queue List */}
                  {queue.customers.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Current Queue</h3>
                      <div className="space-y-2">
                        {queue.customers.slice(0, 10).map((customer, index) => (
                          <div 
                            key={customer._id} 
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              index === 0 ? 'bg-green-50 border border-green-200' :
                              customer.user === user.id ? 'bg-blue-50 border border-blue-200' :
                              'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0 ? 'bg-green-500 text-white' :
                                customer.user === user.id ? 'bg-blue-500 text-white' :
                                'bg-gray-400 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {customer.user === user.id ? 'You' : `Customer ${index + 1}`}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Joined: {formatTime(customer.joinedAt)}
                                </div>
                              </div>
                            </div>
                            {index === 0 && (
                              <span className="text-sm font-medium text-green-600">
                                Being Served
                              </span>
                            )}
                          </div>
                        ))}
                        {queue.customers.length > 10 && (
                          <div className="text-center text-gray-500 py-2">
                            ... and {queue.customers.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QueuePage;
