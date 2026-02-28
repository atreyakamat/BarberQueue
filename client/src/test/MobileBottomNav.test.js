import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';
import MobileBottomNav from '../components/Layout/MobileBottomNav';

describe('MobileBottomNav', () => {
  it('does not render when user is not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isBarber: false,
    });

    const { container } = render(
      <MemoryRouter>
        <MobileBottomNav />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders customer navigation items', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isBarber: false,
    });

    render(
      <MemoryRouter>
        <MobileBottomNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Barbers')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders barber navigation items', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isBarber: true,
    });

    render(
      <MemoryRouter>
        <MobileBottomNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('has md:hidden class for desktop hiding', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isBarber: false,
    });

    render(
      <MemoryRouter>
        <MobileBottomNav />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('md:hidden');
    expect(nav.className).toContain('fixed');
    expect(nav.className).toContain('bottom-0');
  });

  it('highlights the active route', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isBarber: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink.className).toContain('text-primary-600');
  });
});
