import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';
import HomePage from '../pages/HomePage';

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it('renders hero section', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHomePage();
    expect(screen.getByText(/Skip the Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Book Your Barber/i)).toBeInTheDocument();
  });

  it('shows register and login links when not authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHomePage();
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });

  it('shows dashboard link when authenticated', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', role: 'customer' },
    });

    renderHomePage();
    expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHomePage();
    expect(screen.getByText('Easy Booking')).toBeInTheDocument();
    expect(screen.getByText('Real-time Queue')).toBeInTheDocument();
    expect(screen.getByText('Smart Notifications')).toBeInTheDocument();
    expect(screen.getByText('Find Nearby')).toBeInTheDocument();
  });

  it('renders service cards with prices', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHomePage();
    expect(screen.getByText('Haircut')).toBeInTheDocument();
    expect(screen.getByText('Beard Trim')).toBeInTheDocument();
    expect(screen.getByText('₹100-300')).toBeInTheDocument();
  });

  it('renders testimonials', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHomePage();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Suresh Patel')).toBeInTheDocument();
  });

  it('has responsive hero text classes', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderHomePage();
    const heroTitle = screen.getByText(/Skip the Queue/i).closest('h1');
    // Verify mobile-first responsive classes
    expect(heroTitle.className).toContain('text-3xl');
    expect(heroTitle.className).toContain('sm:text-4xl');
    expect(heroTitle.className).toContain('md:text-6xl');
  });
});
