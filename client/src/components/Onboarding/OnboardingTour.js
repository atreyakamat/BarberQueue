import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { X, ChevronRight, ChevronLeft, Scissors, Calendar, Clock, Users, Star, Bell, CheckCircle } from 'lucide-react';

const TOUR_STORAGE_KEY = 'barberqueue_tour_completed';

// Tour steps differ by role
const getSteps = (role) => {
  if (role === 'barber') {
    return [
      {
        id: 'welcome',
        title: 'Welcome to BarberQueue! ✂️',
        description: 'Your digital queue & appointment system. Let\'s take a quick tour of your dashboard.',
        icon: Scissors,
        color: 'from-primary-600 to-primary-800',
        image: null,
        tip: 'This tour takes about 30 seconds',
      },
      {
        id: 'dashboard',
        title: 'Your Dashboard',
        description: 'See today\'s bookings, queue length, revenue stats, and manage your availability — all in one place.',
        icon: Star,
        color: 'from-blue-500 to-blue-700',
        navigateTo: '/barber-dashboard',
        highlight: 'dashboard',
        tip: 'Toggle your availability to let customers know you\'re open',
      },
      {
        id: 'services',
        title: 'Manage Services',
        description: 'Add your services with prices and durations. Customers will select from these when booking.',
        icon: Scissors,
        color: 'from-purple-500 to-purple-700',
        navigateTo: '/barber-services',
        highlight: 'services',
        tip: 'Tip: Add at least 3 services to attract more customers',
      },
      {
        id: 'bookings',
        title: 'Manage Bookings',
        description: 'View, filter, and manage all your appointments. Update statuses and export data.',
        icon: Calendar,
        color: 'from-green-500 to-green-700',
        navigateTo: '/barber-bookings',
        highlight: 'bookings',
        tip: 'Use filters to quickly find today\'s bookings',
      },
      {
        id: 'queue',
        title: 'Live Queue Management',
        description: 'Call next customer, manage walk-ins, and track service times — all in real-time.',
        icon: Users,
        color: 'from-orange-500 to-orange-700',
        navigateTo: '/barber-dashboard',
        highlight: 'queue',
        tip: 'Customers get notified automatically when their turn is near',
      },
      {
        id: 'done',
        title: 'You\'re All Set! 🎉',
        description: 'Start by adding your services, then toggle to "Available" to receive bookings. Your customers will love the experience!',
        icon: CheckCircle,
        color: 'from-green-500 to-emerald-600',
        navigateTo: '/barber-services',
        tip: null,
      },
    ];
  }

  // Customer tour
  return [
    {
      id: 'welcome',
      title: 'Welcome to BarberQueue! 💈',
      description: 'No more waiting at the shop. Book appointments or join live queues from your phone.',
      icon: Scissors,
      color: 'from-primary-600 to-primary-800',
      image: null,
      tip: 'This tour takes about 30 seconds',
    },
    {
      id: 'find-barbers',
      title: 'Find Your Barber',
      description: 'Browse barbers near you, check their ratings, availability, and services.',
      icon: Users,
      color: 'from-blue-500 to-blue-700',
      navigateTo: '/barbers',
      highlight: 'barbers',
      tip: 'Use search to find barbers by name or location',
    },
    {
      id: 'book',
      title: 'Book an Appointment',
      description: 'Select services, pick a date & time, and confirm your booking in seconds.',
      icon: Calendar,
      color: 'from-purple-500 to-purple-700',
      highlight: 'booking',
      tip: 'You can select multiple services in one booking',
    },
    {
      id: 'queue',
      title: 'Join Live Queue',
      description: 'Walk-in? Join the live queue and track your position and wait time in real-time.',
      icon: Clock,
      color: 'from-green-500 to-green-700',
      navigateTo: '/queue',
      highlight: 'queue',
      tip: 'You\'ll get notified when your turn is approaching',
    },
    {
      id: 'notifications',
      title: 'Stay Updated',
      description: 'Get real-time notifications for booking confirmations, queue position updates, and more.',
      icon: Bell,
      color: 'from-orange-500 to-orange-700',
      highlight: 'notifications',
      tip: 'Notifications appear in the top-right corner',
    },
    {
      id: 'done',
      title: 'You\'re Ready! 🎉',
      description: 'Start by finding a barber near you and booking your first appointment. Skip the queue!',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      navigateTo: '/barbers',
      tip: null,
    },
  ];
};

const OnboardingTour = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = user ? getSteps(user.role) : [];

  useEffect(() => {
    if (!user) return;

    // Check if user just registered (flag set by AuthContext/RegisterPage)
    const justRegistered = sessionStorage.getItem('barberqueue_just_registered');
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);

    if (justRegistered && !tourCompleted) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.removeItem('barberqueue_just_registered');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const goToStep = useCallback((stepIndex) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      const step = steps[stepIndex];
      if (step?.navigateTo) {
        navigate(step.navigateTo);
      }
      setIsAnimating(false);
    }, 200);
  }, [steps, navigate]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsVisible(false);
    setCurrentStep(0);
    // Navigate to appropriate dashboard
    if (user?.role === 'barber') {
      navigate('/barber-services');
    } else {
      navigate('/barbers');
    }
  };

  if (!isVisible || !steps.length) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div
          className={`
            pointer-events-auto w-full max-w-sm sm:max-w-md
            bg-white rounded-2xl shadow-2xl overflow-hidden
            transform transition-all duration-300 ease-out
            ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
            mb-safe
          `}
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-primary-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${step.color} p-6 sm:p-8 text-white relative`}>
            {/* Skip button */}
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Skip tour"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <StepIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <div className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                  Step {currentStep + 1} of {steps.length}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight">{step.title}</h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8">
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
              {step.description}
            </p>

            {step.tip && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                <p className="text-amber-800 text-sm flex items-start">
                  <span className="mr-2 flex-shrink-0">💡</span>
                  {step.tip}
                </p>
              </div>
            )}

            {/* Step indicators */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-primary-500'
                      : index < currentStep
                      ? 'w-2 bg-primary-300'
                      : 'w-2 bg-gray-200'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              {isFirstStep ? (
                <button
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Skip Tour
                </button>
              ) : (
                <button
                  onClick={handlePrev}
                  className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className={`flex items-center py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 active:scale-95 ${
                  isLastStep
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ChevronRight className="w-5 h-5 ml-1" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Hook to manually trigger the tour (e.g., from a help button)
export const useTour = () => {
  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    sessionStorage.setItem('barberqueue_just_registered', 'true');
    window.location.reload();
  };

  const isTourCompleted = () => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  };

  return { resetTour, isTourCompleted };
};

export default OnboardingTour;
