import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInView, useStaggerAnimation, useCountUp } from '../hooks/useScrollAnimation';
import { 
  Calendar, 
  Clock, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  Bell,
  MapPin,
  Scissors,
  Sparkles,
  TrendingUp,
  Shield
} from 'lucide-react';

/* ─── Animated Section Wrapper ─── */
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ─── Floating particle for hero background ─── */
const FloatingParticle = ({ size, left, top, delay, duration }) => (
  <div
    className="absolute rounded-full bg-white/10 animate-float pointer-events-none"
    style={{
      width: size,
      height: size,
      left,
      top,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  />
);

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Typed-text effect for hero
  const phrases = ['Book Your Barber', 'Skip the Wait', 'Look Your Best'];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setHeroLoaded(true);
  }, []);

  useEffect(() => {
    const current = phrases[phraseIndex];
    const speed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting && charIndex < current.length) {
        setDisplayText(current.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (!isDeleting && charIndex === current.length) {
        // Pause at end before deleting
        setTimeout(() => setIsDeleting(true), 1800);
      } else if (isDeleting && charIndex > 0) {
        setDisplayText(current.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  // Animated counters
  const [barbersRef, barbersCount] = useCountUp(500, 2000);
  const [bookingsRef, bookingsCount] = useCountUp(25000, 2500);
  const [citiesRef, citiesCount] = useCountUp(50, 1500);
  const [ratingRef, ratingCount] = useCountUp(49, 2000); // 4.9 rendered with decimal

  const features = [
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book appointments with your favorite barber in just a few clicks',
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      icon: Clock,
      title: 'Real-time Queue',
      description: 'Join live queues and get real-time updates on your wait time',
      color: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50',
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get notified when your turn is approaching via SMS or WhatsApp',
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
    },
    {
      icon: MapPin,
      title: 'Find Nearby',
      description: 'Discover top-rated barbers in your area with reviews and ratings',
      color: 'from-orange-500 to-orange-600',
      bgLight: 'bg-orange-50',
    }
  ];

  const services = [
    { name: 'Haircut', icon: '✂️', price: '₹100-300', popular: true },
    { name: 'Beard Trim', icon: '🧔', price: '₹50-150', popular: false },
    { name: 'Head Massage', icon: '💆', price: '₹150-400', popular: true },
    { name: 'Face Cleanup', icon: '🧴', price: '₹200-500', popular: false },
    { name: 'Hair Color', icon: '🎨', price: '₹500-1500', popular: false },
    { name: 'Hair Wash', icon: '🚿', price: '₹50-100', popular: false }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Customer',
      content: 'BarberQueue has revolutionized my grooming routine. No more waiting in long queues!',
      rating: 5,
      avatar: '👨'
    },
    {
      name: 'Suresh Patel',
      role: 'Barber',
      content: 'Managing my appointments has never been easier. My customers love the convenience.',
      rating: 5,
      avatar: '💈'
    },
    {
      name: 'Amit Sharma',
      role: 'Customer',
      content: 'Great app! I can book my slot during lunch break and arrive just in time.',
      rating: 5,
      avatar: '🧑'
    }
  ];

  const steps = [
    { icon: Users, title: 'Choose Your Barber', desc: 'Browse through verified barbers in your area and read reviews', num: '01' },
    { icon: Calendar, title: 'Book Your Slot', desc: 'Select your preferred time and services, or join the live queue', num: '02' },
    { icon: CheckCircle, title: 'Get Notified', desc: 'Receive real-time updates and arrive just when it\'s your turn', num: '03' },
  ];

  return (
    <div className="min-h-screen overflow-hidden">

      {/* ── HERO SECTION ── */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        {/* Animated background particles */}
        <FloatingParticle size="80px" left="10%" top="20%" delay={0} duration={6} />
        <FloatingParticle size="40px" left="80%" top="10%" delay={2} duration={8} />
        <FloatingParticle size="60px" left="70%" top="60%" delay={4} duration={7} />
        <FloatingParticle size="30px" left="20%" top="70%" delay={1} duration={9} />
        <FloatingParticle size="50px" left="50%" top="40%" delay={3} duration={5} />
        <FloatingParticle size="25px" left="90%" top="80%" delay={5} duration={6} />

        {/* Decorative gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="relative container mx-auto px-4 py-16 sm:py-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6 transition-all duration-700 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
              }`}
            >
              <Sparkles className="w-4 h-4 text-accent-300" />
              <span className="text-sm font-medium text-white/90">India's #1 Barber Platform</span>
            </div>

            {/* Hero Title with typed effect */}
            <h1
              className={`text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight transition-all duration-700 delay-150 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <span className="block mb-2">Skip the Queue,</span>
              <span className="block bg-gradient-to-r from-accent-300 via-yellow-300 to-accent-400 bg-clip-text text-transparent">
                {displayText}
                <span className="animate-blink text-accent-300">|</span>
              </span>
            </h1>

            <p
              className={`text-lg sm:text-xl md:text-2xl mb-10 text-primary-100/90 max-w-2xl mx-auto transition-all duration-700 delay-300 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              The barber-centric appointment & queue management platform trusted by thousands
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'barber' ? '/barber-dashboard' : '/dashboard'}
                  className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-gray-50 font-semibold text-lg px-8 py-3.5 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-gray-50 font-semibold text-lg px-8 py-3.5 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/barbers"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm font-semibold text-lg px-8 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <MapPin className="w-5 h-5" />
                    Find Barbers
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,64 C360,20 720,80 1080,40 C1260,20 1380,40 1440,64 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 bg-white relative z-10">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div ref={barbersRef} className="text-center group">
                <div className="text-3xl md:text-4xl font-extrabold text-primary-600 mb-1 tabular-nums">
                  {barbersCount}+
                </div>
                <p className="text-sm text-gray-500 font-medium">Barbers</p>
              </div>
              <div ref={bookingsRef} className="text-center group">
                <div className="text-3xl md:text-4xl font-extrabold text-primary-600 mb-1 tabular-nums">
                  {bookingsCount.toLocaleString()}+
                </div>
                <p className="text-sm text-gray-500 font-medium">Bookings</p>
              </div>
              <div ref={citiesRef} className="text-center group">
                <div className="text-3xl md:text-4xl font-extrabold text-primary-600 mb-1 tabular-nums">
                  {citiesCount}+
                </div>
                <p className="text-sm text-gray-500 font-medium">Cities</p>
              </div>
              <div ref={ratingRef} className="text-center group">
                <div className="text-3xl md:text-4xl font-extrabold text-primary-600 mb-1 flex items-center justify-center gap-1 tabular-nums">
                  {(ratingCount / 10).toFixed(1)}
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Avg Rating</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="py-20 bg-gray-50/70">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              Why BarberQueue?
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Everything you need,{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                one app
              </span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Experience the future of barbershop visits with our innovative platform
            </p>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <AnimatedSection key={index} delay={index * 120}>
                  <div className={`group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-default overflow-hidden`}>
                    {/* Hover gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    <div className={`relative`}>
                      <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block bg-accent-100 text-accent-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              Our Services
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Popular Services
            </h2>
            <p className="text-lg text-gray-500">
              Choose from a wide range of grooming services
            </p>
          </AnimatedSection>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((service, index) => (
              <AnimatedSection key={index} delay={index * 80}>
                <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-primary-200 hover:shadow-lg text-center transition-all duration-400 hover:-translate-y-1 cursor-default">
                  {service.popular && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Popular
                    </div>
                  )}
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 group-hover:animate-bounce-gentle">
                    {service.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-primary-600 font-medium">{service.price}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Three simple steps
            </h2>
            <p className="text-lg text-gray-500">
              Start booking in under a minute
            </p>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <AnimatedSection key={index} delay={index * 200}>
                  <div className="relative text-center group">
                    <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/30 group-hover:shadow-xl group-hover:shadow-primary-500/40 group-hover:scale-105 transition-all duration-300">
                      <Icon className="w-9 h-9 text-white" />
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-white text-primary-600 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm border-2 border-primary-100">
                        {step.num.replace('0', '')}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Loved by thousands
            </h2>
            <p className="text-lg text-gray-500">
              Join happy customers and barbers across India
            </p>
          </AnimatedSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} delay={index * 150}>
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-xl shadow-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <AnimatedSection>
            <Scissors className="w-12 h-12 mx-auto mb-6 text-accent-300 animate-float" />
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Ready to Transform Your
              <br />
              <span className="bg-gradient-to-r from-accent-300 via-yellow-300 to-accent-300 bg-clip-text text-transparent">
                Barber Experience?
              </span>
            </h2>
            <p className="text-xl mb-10 text-primary-100/80 max-w-xl mx-auto">
              Join BarberQueue today and never wait in line again
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-gray-50 font-semibold text-lg px-8 py-3.5 rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Sign Up Now — It's Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/barbers"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold text-lg px-8 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Explore Barbers
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
