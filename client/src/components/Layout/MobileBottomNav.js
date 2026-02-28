import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Users, Clock, User, BarChart3, Calendar, Scissors } from 'lucide-react';

const MobileBottomNav = () => {
  const { isAuthenticated, isBarber } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  const customerItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/barbers', label: 'Barbers', icon: Users },
    { path: '/queue', label: 'Queue', icon: Clock },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const barberItems = [
    { path: '/barber-dashboard', label: 'Home', icon: BarChart3 },
    { path: '/barber-bookings', label: 'Bookings', icon: Calendar },
    { path: '/barber-services', label: 'Services', icon: Scissors },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const items = isBarber ? barberItems : customerItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 pt-2.5 touch-target transition-colors ${
                active
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-0.5 font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
