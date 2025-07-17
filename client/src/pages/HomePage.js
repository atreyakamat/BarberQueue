import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  Scissors,
  Smartphone,
  Bell,
  MapPin
} from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book appointments with your favorite barber in just a few clicks',
      color: 'bg-blue-500'
    },
    {
      icon: Clock,
      title: 'Real-time Queue',
      description: 'Join live queues and get real-time updates on your wait time',
      color: 'bg-green-500'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get notified when your turn is approaching via SMS or WhatsApp',
      color: 'bg-purple-500'
    },
    {
      icon: MapPin,
      title: 'Find Nearby',
      description: 'Discover top-rated barbers in your area with reviews and ratings',
      color: 'bg-orange-500'
    }
  ];

  const services = [
    { name: 'Haircut', icon: '✂️', price: '₹100-300' },
    { name: 'Beard Trim', icon: '🧔', price: '₹50-150' },
    { name: 'Head Massage', icon: '💆', price: '₹150-400' },
    { name: 'Face Cleanup', icon: '🧴', price: '₹200-500' },
    { name: 'Hair Color', icon: '🎨', price: '₹500-1500' },
    { name: 'Hair Wash', icon: '🚿', price: '₹50-100' }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Customer',
      content: 'BarberQueue has revolutionized my grooming routine. No more waiting in long queues!',
      rating: 5
    },
    {
      name: 'Suresh Patel',
      role: 'Barber',
      content: 'Managing my appointments has never been easier. My customers love the convenience.',
      rating: 5
    },
    {
      name: 'Amit Sharma',
      role: 'Customer',
      content: 'Great app! I can book my slot during lunch break and arrive just in time.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Skip the Queue, 
              <span className="block text-accent-300">Book Your Barber</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              India's first barber-centric appointment and queue management platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'barber' ? '/barber-dashboard' : '/dashboard'}
                  className="btn btn-accent text-lg px-8 py-3"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/barbers"
                    className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-3"
                  >
                    Find Barbers
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose BarberQueue?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of barbershop visits with our innovative platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card text-center hover:shadow-lg transition-shadow">
                  <div className="card-body">
                    <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Popular Services
            </h2>
            <p className="text-xl text-gray-600">
              Choose from a wide range of grooming services
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {services.map((service, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-2">{service.icon}</div>
                  <h3 className="font-semibold mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-600">{service.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to book your appointment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Choose Your Barber</h3>
              <p className="text-gray-600">Browse through verified barbers in your area and read reviews</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Book Your Slot</h3>
              <p className="text-gray-600">Select your preferred time and services, or join the live queue</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Get Notified</h3>
              <p className="text-gray-600">Receive real-time updates and arrive just when it's your turn</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of happy customers and barbers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Barber Experience?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join BarberQueue today and never wait in line again!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Sign Up Now
            </Link>
            <Link
              to="/barbers"
              className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-3"
            >
              Find Barbers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
