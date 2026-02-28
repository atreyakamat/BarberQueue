import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OnboardingTour from '../components/Onboarding/OnboardingTour';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';

describe('OnboardingTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderTour = () => {
    return render(
      <MemoryRouter>
        <OnboardingTour />
      </MemoryRouter>
    );
  };

  it('does not render when user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null });
    const { container } = renderTour();
    expect(container.innerHTML).toBe('');
  });

  it('does not render when tour has already been completed', () => {
    localStorage.setItem('barberqueue_tour_completed', 'true');
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'customer' },
    });

    const { container } = renderTour();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.queryByText(/Welcome to BarberQueue/)).not.toBeInTheDocument();
  });

  it('shows tour for newly registered customer', () => {
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'customer' },
    });

    renderTour();
    act(() => { vi.advanceTimersByTime(1000); });

    expect(screen.getByText(/Welcome to BarberQueue/)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 6/)).toBeInTheDocument();
  });

  it('shows tour for newly registered barber', () => {
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'barber' },
    });

    renderTour();
    act(() => { vi.advanceTimersByTime(1000); });

    expect(screen.getByText(/Welcome to BarberQueue/)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 6/)).toBeInTheDocument();
  });

  it('advances to next step on Next click', () => {
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'customer' },
    });

    renderTour();
    act(() => { vi.advanceTimersByTime(1000); });

    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.getByText(/Step 2 of 6/)).toBeInTheDocument();
    expect(screen.getByText(/Find Your Barber/)).toBeInTheDocument();
  });

  it('goes back on Back click', () => {
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'customer' },
    });

    renderTour();
    act(() => { vi.advanceTimersByTime(1000); });

    // Go to step 2
    fireEvent.click(screen.getByText('Next'));
    act(() => { vi.advanceTimersByTime(300); });

    // Go back
    fireEvent.click(screen.getByText('Back'));
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.getByText(/Step 1 of 6/)).toBeInTheDocument();
  });

  it('completes tour and saves to localStorage on skip', () => {
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'customer' },
    });

    renderTour();
    act(() => { vi.advanceTimersByTime(1000); });

    fireEvent.click(screen.getByText('Skip Tour'));

    expect(localStorage.setItem).toHaveBeenCalledWith('barberqueue_tour_completed', 'true');
    expect(mockNavigate).toHaveBeenCalledWith('/barbers');
  });

  it('shows Get Started button on the last step', () => {
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    
    useAuth.mockReturnValue({
      user: { id: '1', name: 'Test', role: 'customer' },
    });

    renderTour();
    act(() => { vi.advanceTimersByTime(1000); });

    // Navigate through all steps
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'));
      act(() => { vi.advanceTimersByTime(300); });
    }

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText(/You're Ready/)).toBeInTheDocument();
  });
});
