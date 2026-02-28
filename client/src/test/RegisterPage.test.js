import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';

// Track navigation
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

describe('RegisterPage', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      register: mockRegister,
      loading: false,
    });
  });

  const renderRegisterPage = () => {
    return render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  };

  it('renders the registration form', () => {
    renderRegisterPage();
    expect(screen.getByText('Join BarberQueue')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('shows customer and barber role toggle', () => {
    renderRegisterPage();
    expect(screen.getByText(/👤 Customer/)).toBeInTheDocument();
    expect(screen.getByText(/✂️ Barber/)).toBeInTheDocument();
  });

  it('shows barber-specific fields when barber is selected', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const barberBtn = screen.getByText(/✂️ Barber/);
    await user.click(barberBtn);

    expect(screen.getByLabelText(/Shop Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Shop Address/i)).toBeInTheDocument();
  });

  it('hides barber fields when customer is selected', () => {
    renderRegisterPage();
    expect(screen.queryByLabelText(/Shop Name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Shop Address/i)).not.toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    expect(passwordInput.type).toBe('password');

    // Click the toggle button (the eye icon button)
    const toggleBtns = screen.getAllByRole('button');
    const eyeBtn = toggleBtns.find(btn => btn.closest('.relative')?.querySelector('#password'));
    if (eyeBtn) {
      await user.click(eyeBtn);
      expect(passwordInput.type).toBe('text');
    }
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    // Submit without filling anything
    const submitBtn = screen.getByText('Create Account');
    await user.click(submitBtn);

    // Wait for validation errors
    await vi.waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful registration', async () => {
    mockRegister.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Phone Number/i), '9876543210');
    await user.type(screen.getByPlaceholderText(/Create a password/i), 'password123');
    await user.click(screen.getByLabelText(/I agree/i));
    await user.click(screen.getByText('Create Account'));

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          phone: '9876543210',
          role: 'customer',
        })
      );
    });

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('sets just_registered flag in sessionStorage on success', async () => {
    mockRegister.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Phone Number/i), '9876543210');
    await user.type(screen.getByPlaceholderText(/Create a password/i), 'password123');
    await user.click(screen.getByLabelText(/I agree/i));
    await user.click(screen.getByText('Create Account'));

    await vi.waitFor(() => {
      expect(sessionStorage.setItem).toHaveBeenCalledWith('barberqueue_just_registered', 'true');
    });
  });

  it('shows loading spinner while submitting', () => {
    useAuth.mockReturnValue({
      register: mockRegister,
      loading: true,
    });

    renderRegisterPage();
    expect(screen.getByText(/Creating account/i)).toBeInTheDocument();
  });

  it('has link to login page', () => {
    renderRegisterPage();
    expect(screen.getByText(/Sign in here/i)).toBeInTheDocument();
  });
});
