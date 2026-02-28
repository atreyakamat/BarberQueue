// ...existing code...
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className={`flex-1 ${isAuthenticated ? 'pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
