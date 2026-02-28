import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../contexts/SocketContext', () => ({
  useSocket: vi.fn(() => ({ socket: null, connected: false })),
}));

import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Layout/Navbar';

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNavbar = () => {
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  };

  it('renders the brand logo', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBarber: false,
      logout: vi.fn(),
    });

    renderNavbar();
    expect(screen.getByText('BarberQueue')).toBeInTheDocument();
  });

  it('shows Login and Register links when not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBarber: false,
      logout: vi.fn(),
    });

    renderNavbar();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('shows customer nav items when authenticated as customer', () => {
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', role: 'customer' },
      isAuthenticated: true,
      isBarber: false,
      logout: vi.fn(),
    });

    renderNavbar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Barbers')).toBeInTheDocument();
    expect(screen.getByText('Queue Status')).toBeInTheDocument();
  });

  it('shows barber nav items when authenticated as barber', () => {
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test Barber', role: 'barber' },
      isAuthenticated: true,
      isBarber: true,
      logout: vi.fn(),
    });

    renderNavbar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
  });

  it('shows user name when authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: '1', name: 'John Doe', role: 'customer' },
      isAuthenticated: true,
      isBarber: false,
      logout: vi.fn(),
    });

    renderNavbar();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows connection status indicator when authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'customer' },
      isAuthenticated: true,
      isBarber: false,
      logout: vi.fn(),
    });

    renderNavbar();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('has sticky positioning for mobile', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBarber: false,
      logout: vi.fn(),
    });

    renderNavbar();
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('sticky');
    expect(nav.className).toContain('top-0');
  });
});
