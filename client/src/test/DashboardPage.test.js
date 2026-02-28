import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock modules
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../contexts/SocketContext', () => ({
  useSocket: vi.fn(() => ({ socket: null, connected: false })),
  SocketProvider: ({ children }) => children,
}));

vi.mock('../services/api', () => ({
  bookingsAPI: { getMyBookings: vi.fn() },
  usersAPI: { getBarbers: vi.fn() },
  authAPI: {},
}));

import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI, usersAPI } from '../services/api';
import DashboardPage from '../pages/DashboardPage';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookingsAPI.getMyBookings.mockResolvedValue({ data: { bookings: [] } });
    usersAPI.getBarbers.mockResolvedValue({ data: { barbers: [] } });
  });

  it('shows loading state when user is null', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: true,
      isBarber: false,
      isCustomer: true,
      loading: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows customer dashboard for customer role', async () => {
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'customer' },
      isAuthenticated: true,
      isBarber: false,
      isCustomer: true,
      loading: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });
    expect(await screen.findByText(/Welcome back, Test User/)).toBeInTheDocument();
  });

  it('renders stat cards for customers', async () => {
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'customer' },
      isAuthenticated: true,
      isBarber: false,
      isCustomer: true,
      loading: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });
    
    // Wait for async loading to finish, then check quick action links
    expect(await screen.findByText('Find Barbers')).toBeInTheDocument();
    expect(screen.getByText('Join Queue')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('shows empty state when no bookings', async () => {
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'customer' },
      isAuthenticated: true,
      isBarber: false,
      isCustomer: true,
      loading: false,
    });

    render(<DashboardPage />, { wrapper: createWrapper() });
    
    // Wait for API calls to resolve
    await vi.waitFor(() => {
      expect(screen.getByText('No bookings yet')).toBeInTheDocument();
    });
  });
});
