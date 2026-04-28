// @ts-nocheck
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Camera,
  Calendar,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Play,
  Linkedin,
  ArrowRight,
  Shield,
  User,
  LogOut,
  ChevronLeft,
  Package,
  Loader2,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  Video,
  Image as ImageIcon,
  ChevronDown,
  Send,
  ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useStore, useAuth, useBooking } from '@/hooks/useStore';
import { formatPrice, formatDate, formatTime } from '@/data/mockData';
import { authService, contactMessagesService, bookingsService, portfolioService } from '@/lib/firebaseService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { AdminDashboard } from '@/components/AdminDashboard';
import { HeroVideo } from '@/components/HeroVideo';
import { PaymentForm } from '@/components/PaymentForm';
import { ClientPortal } from '@/components/ClientPortal';
import { SettingsPage } from '@/components/SettingsPage';
import { TermsOfServicePage, PrivacyPolicyPage, CancellationPolicyPage } from '@/components/LegalPages';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StatsCounter } from '@/components/StatsCounter';
import { TextReveal } from '@/components/TextReveal';
import { EnhancedTestimonials } from '@/components/EnhancedTestimonials';
import './App.css';
import type {
  Service,
  PortfolioItem,
  Testimonial,
  AddOn,
  Booking,
  Project,
  Invoice,
  Client
} from '@/types';

// View types for navigation
type View = 'home' | 'portfolio' | 'services' | 'booking' | 'about' | 'contact' | 'portal' | 'admin' | 'login' | 'settings' | 'terms' | 'privacy' | 'cancellation';

// Toast Component
function Toast() {
  const { toast, clearToast } = useStore();

  if (!toast) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[toast.type];

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-4`}>
      <div className="flex items-center gap-2">
        {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
        <span>{toast.message}</span>
        <button onClick={clearToast} className="ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Navigation Component
function Navigation({ currentView, setView }: { currentView: View; setView: (v: View) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', view: 'home' as View },
    { label: 'Portfolio', view: 'portfolio' as View },
    { label: 'Packages', view: 'services' as View },
    { label: 'About', view: 'about' as View },
    { label: 'Contact', view: 'contact' as View },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 glass ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => setView('home')}
            className="flex items-center"
          >
            <img
              src="/logo-color.png"
              alt="Thomas Samuel Media"
              className="h-10 w-auto"
            />
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`text-sm font-medium tracking-wide transition-colors ${currentView === item.view
                  ? 'text-[#8f5e25]'
                  : 'text-muted-foreground hover:text-[#cbb26a]'
                  }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {user?.role === 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('admin')}
                    className="text-muted-foreground hover:text-[#cbb26a] hover:bg-[#cbb26a]/20"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                )}
                {user?.role === 'client' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('portal')}
                    className="text-muted-foreground hover:text-[#cbb26a] hover:bg-[#cbb26a]/20"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Portal
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('settings')}
                  className="text-muted-foreground hover:text-[#cbb26a] hover:bg-[#cbb26a]/20"
                >
                  <User className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  size="sm"
                  onClick={() => setView('booking')}
                  className="btn-gold text-white font-medium tracking-wide"
                >
                  Book Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    setView('home');
                  }}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('login')}
                  className="text-muted-foreground hover:text-[#cbb26a] hover:bg-[#cbb26a]/20"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => setView('booking')}
                  className="btn-gold text-white font-medium tracking-wide"
                >
                  Book Now
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a]/95 backdrop-blur-lg border-t border-[#f5ecd5]">
          <div className="px-4 py-4 space-y-3">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => {
                  setView(item.view);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-2 text-sm font-medium ${currentView === item.view ? 'text-[#cbb26a]' : 'text-white/80 hover:text-white'
                  }`}
              >
                {item.label}
              </button>
            ))}
            <Separator className="bg-[#cbb26a]/20" />
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setView('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-sm font-medium text-white/80 hover:text-white"
                  >
                    Admin Dashboard
                  </button>
                )}
                {user?.role === 'client' && (
                  <button
                    onClick={() => {
                      setView('portal');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-sm font-medium text-white/80 hover:text-white"
                  >
                    Client Portal
                  </button>
                )}
                <button
                  onClick={() => {
                    setView('settings');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-sm font-medium text-white/80 hover:text-white"
                >
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    logout();
                    setView('home');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-sm font-medium text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setView('login');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm font-medium text-white/80 hover:text-white"
              >
                Login
              </button>
            )}
            <Button
              className="w-full btn-gold text-white"
              onClick={() => {
                setView('booking');
                setMobileMenuOpen(false);
              }}
            >
              Book Now
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

// Home Section
function HomeSection({ setView }: { setView: (v: View) => void }) {
  const { services, portfolioItems, testimonials } = useStore();
  const approvedTestimonials = testimonials.filter((t: Testimonial) => t.status === 'approved' || !t.status);
  const [expandedHomeDesc, setExpandedHomeDesc] = useState<string | null>(null);
  const formatLabel = (slug: string) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setParallaxOffset(window.scrollY * 0.35);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 parallax-hero"
          style={{ transform: `translateY(${parallaxOffset}px) scale(1.1)` }}
        >
          <HeroVideo />
        </div>

        <div
          className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto hero-text-shadow"
          style={{ transform: `translateY(${parallaxOffset * 0.15}px)` }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            <TextReveal text="Visual Stories that sell" delay={300} staggerMs={150} />
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto" style={{ opacity: 0, animation: 'fadeIn 0.8s ease-out 1.2s forwards' }}>
            Cinematic video + photo packages crafted for luxury agents, builders, and developers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="btn-gold text-white font-medium tracking-wide text-base"
              onClick={() => setView('booking')}
            >
              Book A Shoot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              className="btn-gold text-white font-medium tracking-wide text-base"
              onClick={() => setView('portfolio')}
            >
              View Portfolio
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <ChevronRight className="w-6 h-6 rotate-90" />
        </div>
      </section>

      {/* Packages Preview */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Our Packages</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                Photo and video packages for real estate, brands, social media, events, and hospitality
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: 'home-re',
                name: 'Real Estate',
                description: 'Cinematic photo, video, and drone packages crafted for luxury agents, builders, and developers.',
                image: services[0]?.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
                price: services[0] ? formatPrice(services[0].basePrice) : 'From $299',
                tab: 'real-estate',
              },
              {
                id: 'home-bc',
                name: 'Brand & Commercial',
                description: 'Elevated visual storytelling for founders, product launches, campaigns, and lifestyle marketing.',
                image: 'https://images.pexels.com/photos/15380337/pexels-photo-15380337.jpeg?auto=compress&cs=tinysrgb&w=800',
                price: 'From $1,250',
                tab: 'brand-commercial',
              },
              {
                id: 'home-sc',
                name: 'Social & Content',
                description: 'Scroll-stopping content for Instagram, TikTok, paid social, and professional headshots.',
                image: 'https://images.pexels.com/photos/33410864/pexels-photo-33410864.jpeg?auto=compress&cs=tinysrgb&w=800',
                price: 'From $395',
                tab: 'social-content',
              },
              {
                id: 'home-eh',
                name: 'Events & Hospitality',
                description: 'Refined coverage for events, hotel & Airbnb listings, and high-end food and beverage brands.',
                image: 'https://images.pexels.com/photos/33721374/pexels-photo-33721374.jpeg?auto=compress&cs=tinysrgb&w=800',
                price: 'From $850',
                tab: 'events-hospitality',
              },
            ].map((cat, index) => (
              <ScrollReveal key={cat.id} delay={index * 150}>
                <Card className="group cursor-pointer gold-border card-pop-glow overflow-hidden !pt-0 !gap-0" onClick={() => setView('services')}>
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pt-4 pb-2">
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {cat.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#8f5e25]">{cat.price}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full border-[#cbb26a] text-[#8f5e25] hover:bg-[#cbb26a]/20"
                      onClick={(e) => { e.stopPropagation(); setView('services'); }}
                    >
                      View Packages
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div className="text-center mt-10">
              <Button
                size="lg"
                className="btn-gold text-white font-medium tracking-wide"
                onClick={() => setView('services')}
              >
                View All Packages
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                From booking to delivery, we make the process seamless
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[#cbb26a]/20 via-[#cbb26a]/60 to-[#cbb26a]/20" />

            {[
              {
                step: '01',
                icon: Calendar,
                title: 'Book Online',
                description: 'Choose your package, select your property size, and pick a date that works for you.',
              },
              {
                step: '02',
                icon: ClipboardCheck,
                title: 'Confirm Details',
                description: 'We\'ll reach out to confirm the property address, access info, and any special requests.',
              },
              {
                step: '03',
                icon: Camera,
                title: 'We Shoot',
                description: 'Our team arrives on-site and captures stunning photos, video, and media for your listing.',
              },
              {
                step: '04',
                icon: Send,
                title: 'Fast Delivery',
                description: 'Receive your professionally edited media within 24\u201348 hours, ready to publish.',
              },
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 150}>
              <div className="relative flex flex-col items-center text-center group">
                {/* Step number */}
                <div className="relative z-10 mb-6">
                  <div className="w-28 h-28 rounded-full bg-card border-2 border-[#cbb26a]/30 flex items-center justify-center group-hover:border-[#cbb26a] group-hover:shadow-[0_0_30px_rgba(203,178,106,0.15)] transition-all duration-500">
                    <item.icon className="w-10 h-10 text-[#cbb26a]" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#cbb26a] text-black text-xs font-bold flex items-center justify-center shadow-lg">
                    {item.step}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2 text-white">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">
                  {item.description}
                </p>

                {/* Mobile arrow (between steps) */}
                {index < 3 && (
                  <div className="md:hidden mt-6 mb-2">
                    <ChevronDown className="w-6 h-6 text-[#cbb26a]/50 mx-auto" />
                  </div>
                )}
              </div>
              </ScrollReveal>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-14">
            <Button
              className="gold-gradient text-black font-semibold px-8 py-3 rounded-full hover:shadow-[0_0_30px_rgba(203,178,106,0.3)] transition-all duration-300"
              onClick={() => setView('booking')}
            >
              Book Your Shoot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Featured Work</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
                A selection of recent projects across real estate, brands, and events
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolioItems.filter((p: PortfolioItem) => p.featured).slice(0, 4).map((item: PortfolioItem, index: number) => (
              <ScrollReveal key={item.id} delay={index * 150}>
              <div
                className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer bg-black/5"
                onClick={() => setView('portfolio')}
              >
                {item.videoUrl ? (
                  <video
                    src={item.videoUrl}
                    poster={item.thumbnail || item.image}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    autoPlay
                    loop
                    playsInline
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.thumbnail || item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
                <div className="absolute top-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Badge className="w-fit bg-[#cbb26a]/30 text-white border-0 text-xs">
                    {formatLabel(item.category || 'photo')}
                  </Badge>
                </div>
              </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div className="text-center mt-10">
              <Button
                size="lg"
                className="btn-gold text-white font-medium tracking-wide"
                onClick={() => setView('portfolio')}
              >
                View Full Portfolio
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Counter */}
      <StatsCounter />

      {/* Enhanced Testimonials */}
      <EnhancedTestimonials testimonials={approvedTestimonials} />

      {/* CTA Section */}
      <ScrollReveal>
        <section className="py-20 px-4 bg-background text-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text-dark">
              Ready to Book?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              Check real-time availability and secure your session in under 2 minutes.
              No back-and-forth, no surprises.
            </p>
            <Button
              size="lg"
              className="btn-gold text-white font-medium tracking-wide"
              onClick={() => setView('booking')}
            >
              Check Availability
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

// Portfolio Video Component — lazy loads only when scrolled into viewport
function PortfolioVideo({ item }: { item: PortfolioItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSeeked, setHasSeeked] = useState(false); // true once video shows first frame

  // Two-stage IntersectionObserver:
  // 1. Preload trigger: 400px before entering viewport — mounts the video element with preload="auto"
  // 2. Visibility trigger: when actually visible — plays/pauses the video
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Stage 1: preload when near viewport
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          preloadObserver.disconnect();
        }
      },
      { rootMargin: '400px' }
    );

    // Stage 2: play/pause based on actual visibility
    const playObserver = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '0px', threshold: 0.25 }
    );

    preloadObserver.observe(el);
    playObserver.observe(el);
    return () => {
      preloadObserver.disconnect();
      playObserver.disconnect();
    };
  }, []);

  // Handle play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !inView) return;

    const onCanPlay = () => {
      setIsReady(true);
      setIsBuffering(false);
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onError = () => { setHasError(true); setIsBuffering(false); };

    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
    };
  }, [inView]);

  // Play when visible and ready, pause when scrolled away
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !inView) return;
    if (isVisible) {
      // Upgrade from metadata-only to full download when actually visible
      if (video.preload !== 'auto') {
        video.preload = 'auto';
        video.load();
      }
      if (video.readyState >= 3) {
        video.play().catch(() => {});
      } else {
        setIsBuffering(true);
        const onReady = () => { video.play().catch(() => {}); };
        video.addEventListener('canplay', onReady, { once: true });
        return () => video.removeEventListener('canplay', onReady);
      }
    } else {
      video.pause();
    }
  }, [isVisible, inView]);

  // Show video frame as soon as first data is ready — eliminates black screen
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !inView) return;
    const onData = () => setHasSeeked(true);
    video.addEventListener('loadeddata', onData);
    return () => video.removeEventListener('loadeddata', onData);
  }, [inView]);

  const formatLabel = (slug: string) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const storedThumb = item.thumbnail || item.image || null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2c1e0d 50%, #1a1208 100%)' }}
    >
      {/* Stored thumbnail image — shown until video has its own frame */}
      {(!inView || (!isReady && !hasSeeked)) && !hasError && storedThumb && (
        <img
          src={storedThumb}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-10"
          loading="eager"
        />
      )}

      {/* Gradient play-icon placeholder when no stored thumbnail and no frame yet */}
      {!inView && !hasError && !storedThumb && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#cbb26a]/20 border border-[#cbb26a]/40 flex items-center justify-center">
            <Play className="w-6 h-6 text-[#cbb26a] ml-1" />
          </div>
        </div>
      )}

      {/* Loading spinner — only when video is visible but neither seeked nor ready */}
      {inView && isVisible && !hasSeeked && !isReady && !hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#cbb26a]/40 border-t-[#cbb26a] animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-2">
          {storedThumb && (
            <img src={storedThumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <Play className="w-10 h-10 text-[#cbb26a] relative z-10" />
        </div>
      )}

      {/* Video element — visible once frame seeked OR playing */}
      {inView && !hasError && (
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={storedThumb || undefined}
          className={`w-full h-full object-cover transition-opacity duration-300 ${hasSeeked || isReady ? 'opacity-100' : 'opacity-0'}`}
          loop
          playsInline
          muted
          controls
          preload="metadata"
        />
      )}

      <div className="absolute top-0 left-0 px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
        <Badge className="w-fit bg-[#cbb26a]/90 text-white border-0 text-xs">
          {item.category ? formatLabel(item.category) : 'Video'}
        </Badge>
      </div>
    </div>
  );
}

// Helper: route Firebase Storage images through Vercel's image optimization CDN
function vercelImg(url: string, width: number, quality = 75): string {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}

// Portfolio Section
const PAGE_SIZE = 24;

function PortfolioSection() {
  const [mainTab, setMainTab] = useState<'photo' | 'video'>('video');
  const [subFilter, setSubFilter] = useState<string>('real-estate');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Paginated state — independent of global store
  const [displayedItems, setDisplayedItems] = useState<PortfolioItem[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Dynamic categories from Firestore (same source as admin dashboard)
  const { portfolioCategories } = useStore();
  // Format slug label: 'real-estate' → 'Real Estate'
  const formatLabel = (slug: string) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  // Categories hidden from the Videos tab (photo-only categories)
  const VIDEO_HIDDEN_CATS = new Set(['drone', 'portrait', 'food', 'video']);
  // Categories hidden from the Photos tab
  const PHOTO_HIDDEN_CATS = new Set(['video', 'social-media', 'social media', 'social', 'social-content']);
  // Use Firestore categories as sub-filter tabs; hide photo-only categories from the video tab
  const filteredSubCategories = portfolioCategories.filter(c =>
    mainTab === 'video' ? !VIDEO_HIDDEN_CATS.has(c) : !PHOTO_HIDDEN_CATS.has(c)
  );
  // For photo tab: pin real-estate first, portrait second, rest follows Firestore order
  const availableSubCategories = mainTab === 'photo'
    ? [
        ...filteredSubCategories.filter(c => c === 'real-estate'),
        ...filteredSubCategories.filter(c => c === 'portrait' || c === 'headshots-and-portraits'),
        ...filteredSubCategories.filter(c => c !== 'real-estate' && c !== 'portrait' && c !== 'headshots-and-portraits'),
      ]
    : filteredSubCategories;

  // Load the first page whenever tab or filter changes
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setDisplayedItems([]);
    setLastDoc(null);
    setHasMore(true);
    portfolioService.getPage(PAGE_SIZE, null, mainTab, subFilter === 'all' ? undefined : subFilter)
      .then(({ items, lastDoc: ld, hasMore: hm }) => {
        if (cancelled) return;
        setDisplayedItems(items);
        setLastDoc(ld);
        setHasMore(hm);
        setInitialLoading(false);
      })
      .catch(() => { if (!cancelled) setInitialLoading(false); });
    return () => { cancelled = true; };
  }, [mainTab, subFilter]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const { items, lastDoc: ld, hasMore: hm } = await portfolioService.getPage(
        PAGE_SIZE, lastDoc, mainTab, subFilter === 'all' ? undefined : subFilter
      );
      setDisplayedItems(prev => {
        const ids = new Set(prev.map(i => i.id));
        return [...prev, ...items.filter(i => !ids.has(i.id))];
      });
      setLastDoc(ld);
      setHasMore(hm);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, mainTab, subFilter]);

  // IntersectionObserver sentinel for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Portfolio</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            {mainTab === 'photo'
              ? 'Professional photography across fashion, portraits, food, and more'
              : 'Cinematic brand stories and travel films captured with precision'}
          </p>
        </div>

        {/* Main Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { id: 'video', label: 'Videos', icon: Video },
            { id: 'photo', label: 'Photos', icon: ImageIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                const newTab = tab.id as 'photo' | 'video';
                setMainTab(newTab);
                // Always default to Real Estate when switching tabs
                setSubFilter('real-estate');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${mainTab === tab.id
                ? 'bg-gradient-to-r from-[#8f5e25] to-[#cbb26a] text-white shadow-lg scale-105'
                : 'bg-[#cbb26a]/10 text-[#8f5e25] hover:bg-[#cbb26a]/20'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Filter Tabs */}
        {availableSubCategories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10 animate-in fade-in slide-in-from-top-2 duration-500">
            {availableSubCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSubFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${subFilter === cat
                  ? 'bg-[#8f5e25] text-white'
                  : 'bg-[#cbb26a]/10 text-[#8f5e25] hover:bg-[#cbb26a]/20'
                  }`}
              >
                {formatLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {/* Initial loading skeleton */}
        {initialLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Gallery */}
        {!initialLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedItems.map((item: PortfolioItem, index: number) => (
              <div
                key={item.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer bg-black/5"
                onClick={() => {
                  if (!item.videoUrl) {
                    setSelectedImage(item.image);
                  }
                }}
              >
                {item.videoUrl ? (
                  <PortfolioVideo item={item} />
                ) : (
                  <>
                    <img
                      src={vercelImg(item.image, 800)}
                      srcSet={`${vercelImg(item.image, 400)} 400w, ${vercelImg(item.image, 800)} 800w, ${vercelImg(item.image, 1200)} 1200w`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      alt=""
                      loading="eager"
                      fetchPriority={index < 6 ? 'high' : 'auto'}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient at the top for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Info overlay – category tag only, no title */}
                    <div className="absolute top-0 left-0 right-0 flex flex-col p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge className="w-fit bg-[#cbb26a]/30 text-white border-0">
                        {formatLabel(item.category || 'photo')}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More button + infinite scroll sentinel */}
        <div ref={sentinelRef} className="mt-10 flex flex-col items-center gap-4">
          {hasMore && !initialLoading && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-[#8f5e25] to-[#cbb26a] text-white shadow-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading…
                </>
              ) : (
                'Load More'
              )}
            </button>
          )}
          {!hasMore && displayedItems.length > 0 && !initialLoading && (
            <p className="text-sm text-muted-foreground">All photos loaded</p>
          )}
        </div>
      </div>

      {/* Full Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={vercelImg(selectedImage, 1200)}
            alt="Expanded view"
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── New Service Package Data (non-real-estate categories) ───────────────────
const NEW_SERVICE_TABS = [
  {
    id: 'brand-commercial',
    label: 'Brand & Commercial',
    sections: [
      {
        title: 'Brand & Promotional Photography',
        description: 'Elevated visual storytelling for founders, teams, service businesses, launches, and lifestyle-driven marketing.',
        image: 'https://images.pexels.com/photos/15380337/pexels-photo-15380337.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Basic', price: '$1,250*', badge: '', includes: ['Up to 2 hours', '1 location or setup', '20 edited images'] },
          { name: 'Standard', price: '$2,200*', badge: 'Most Popular', includes: ['Up to 4 hours', 'Up to 2 locations or multiple setups', '40 edited images', '1 edited vertical reel'] },
          { name: 'Full Service', price: '$3,800*', badge: '', includes: ['Up to 8 hours', 'Multiple scenes and creative variations', '60+ edited images', '2 edited vertical reels', 'Pre-production planning'] },
        ],
      },
      {
        title: 'Product Photography',
        description: 'Clean, elevated product imagery for e-commerce, launches, ads, and brand storytelling.',
        image: 'https://images.pexels.com/photos/3065075/pexels-photo-3065075.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Basic', price: '$1,250*', badge: '', includes: ['Half-day shoot', 'Simple styling and clean setup', 'Up to 15 final edited images', 'Basic retouching'] },
          { name: 'Standard', price: '$2,400*', badge: 'Most Popular', includes: ['Full-day shoot', 'Multiple setups, angles, and variations', 'Up to 30 final edited images', 'Advanced retouching'] },
          { name: 'Full Service', price: '$3,600*', badge: '', includes: ['Full-day production with expanded creative direction', 'Styled scenes and multiple concepts', 'Up to 45 final edited images', 'Ideal for launches, campaigns, and larger product lines'] },
        ],
      },
      {
        title: 'Brand Campaign Day Rates',
        description: 'For larger commercial productions, ad campaigns, product launches, and multi-deliverable shoots.',
        image: 'https://images.pexels.com/photos/36287813/pexels-photo-36287813.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Half-Day Campaign Rate', price: '$2,500*', badge: '', includes: ['Up to 4 hours production', 'Creative direction', 'Photo or hybrid photo/video capture'] },
          { name: 'Full-Day Campaign Rate', price: '$4,500*', badge: 'Most Popular', includes: ['Up to 8 hours production', 'Creative direction and shot planning', 'Photo or hybrid photo/video capture', 'Best for launches and multi-platform campaigns'] },
        ],
      },
    ],
  },
  {
    id: 'social-content',
    label: 'Social & Content',
    sections: [
      {
        title: 'Social Media Content Shoots',
        description: 'Built for brands that need scroll-stopping content for Instagram, TikTok, paid social, and web.',
        image: 'https://images.pexels.com/photos/33410864/pexels-photo-33410864.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Basic', price: '$1,250*', badge: '', includes: ['Up to 4 hours on-site', '1 location', '1 edited vertical reel', '20 edited photo selects', 'Light creative direction and shot planning', 'Organic social and web use'] },
          { name: 'Standard', price: '$2,200*', badge: 'Most Popular', includes: ['Up to 8 hours on-site', 'Up to 2 locations or multiple setups', '2 edited vertical reels', '40 edited photo selects', 'Expanded creative direction', 'Organic social and web use'] },
          { name: 'Full Service', price: '$3,250*', badge: '', includes: ['Full-day production coverage', 'Up to 3 edited vertical reels', '60 edited photo selects', 'Pre-production planning', 'Priority editing workflow', 'Best for launches and campaign-style social content'] },
        ],
      },
      {
        title: 'Headshots, Portraits & Studio Photography',
        description: 'Professional, polished imagery for founders, teams, talent, and personal brands.',
        image: 'https://images.pexels.com/photos/20230572/pexels-photo-20230572.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Basic', price: '$395*', badge: '', includes: ['Up to 30 minutes', '1 look', '1 retouched final image', 'Private proof gallery'] },
          { name: 'Standard', price: '$695*', badge: 'Most Popular', includes: ['Up to 60 minutes', '2 looks', '3 retouched final images', 'Private proof gallery', 'More variety in posing and framing'] },
          { name: 'Full Service', price: '$1,195*', badge: '', includes: ['Up to 90 minutes', '3 to 4 looks', '6 retouched final images', 'Creative direction throughout session', 'Priority turnaround'] },
        ],
      },
    ],
  },
  {
    id: 'events-hospitality',
    label: 'Events & Hospitality',
    sections: [
      {
        title: 'Event Coverage',
        description: 'Refined event photography for launches, private gatherings, corporate events, dinners, and brand activations.',
        image: 'https://images.pexels.com/photos/33721374/pexels-photo-33721374.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Basic', price: '$850*', badge: '', includes: ['Up to 2 hours of coverage', '50+ edited images', 'Online gallery delivery'] },
          { name: 'Standard', price: '$1,450*', badge: 'Most Popular', includes: ['Up to 4 hours of coverage', '125+ edited images', 'Online gallery delivery', 'Ideal for brand events, dinners, and networking events'] },
          { name: 'Full Service', price: '$2,650*', badge: '', includes: ['Up to 8 hours of coverage', '250+ edited images', '24-hour preview selects', 'Full event storytelling coverage'] },
        ],
      },
      {
        title: 'Hotel & Airbnb Photography',
        description: 'Hospitality-focused imagery designed to elevate bookings, listings, websites, and brand perception.',
        image: 'https://images.pexels.com/photos/36354489/pexels-photo-36354489.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Basic', price: '$850*', badge: '', includes: ['20 edited images', 'Interior and exterior coverage', 'Ideal for smaller properties or listing refreshes'] },
          { name: 'Standard', price: '$1,450*', badge: 'Most Popular', includes: ['35 edited images', 'Interior, exterior, and detail shots', 'Ideal for stronger listing and website presentation'] },
          { name: 'Full Service', price: '$2,400*', badge: '', includes: ['50+ edited images', 'Interior, exterior, amenities, and detail shots', 'Drone and twilight coverage', '1 short vertical teaser reel'] },
        ],
      },
      {
        title: 'Food Photography',
        description: 'High-end food and beverage imagery for restaurants, hospitality brands, menus, launches, and social campaigns.',
        image: 'https://images.pexels.com/photos/30469688/pexels-photo-30469688.jpeg?auto=compress&cs=tinysrgb&w=800',
        packages: [
          { name: 'Basic', price: '$950*', badge: '', includes: ['Up to 8 final edited images', '1 to 2 hero setups', 'Basic styling guidance'] },
          { name: 'Standard', price: '$1,650*', badge: 'Most Popular', includes: ['Up to 15 final edited images', '3 to 4 styled setups', 'Hero shots and detail shots', 'Ideal for seasonal updates and social content'] },
          { name: 'Full Service', price: '$2,850*', badge: '', includes: ['Up to 25 final edited images', '5 to 6 styled setups', 'Expanded art direction', 'Short motion clips or b-roll capture'] },
        ],
      },
    ],
  },
];

const NEW_ADDONS = [
  { name: 'Additional Vertical Reel Edit', description: 'Extra reel from existing footage', price: '$450*' },
  { name: 'Additional Short-Form Edit', description: 'From existing shoot footage', price: '$350*' },
  { name: 'Drone Coverage', description: 'Aerial drone photography add-on', price: '$250*' },
  { name: 'Rush Turnaround', description: 'Expedited editing and delivery', price: 'Custom' },
  { name: 'Advanced Retouching', description: 'Per image retouching', price: '$35*/image' },
  { name: 'Raw Footage Handoff', description: 'Unedited footage delivery', price: '$300*' },
  { name: 'Additional Hour (Photo Only)', description: 'Extra hour of photo coverage', price: '$250*' },
  { name: 'Additional Hour (Photo + Video)', description: 'Extra hour of photo and video', price: '$350*' },
  { name: 'Studio, Talent, HMU & More', description: 'Studio rental, talent, props, stylist, permits, licensing', price: 'Custom' },
];

// ─── Helper: derive display fields that work for both old and new service docs ───
function getServiceDisplayPrice(s: any): string {
  if (s.price) return s.price + (s.price.includes('*') ? '' : '*');
  if (s.displayPrice) return s.displayPrice;
  if (s.basePrice) return '$' + (s.basePrice / 100).toLocaleString() + '*';
  return 'Contact us';
}
function getServiceIncludes(s: any): string[] {
  if (Array.isArray(s.includes) && s.includes.length > 0) return s.includes;
  if (Array.isArray(s.deliverables) && s.deliverables.length > 0) return s.deliverables;
  return [];
}
function getServiceImage(s: any): string {
  return s.imageUrl || s.image || '';
}
function getServiceActive(s: any): boolean {
  if (typeof s.active === 'boolean') return s.active;
  if (typeof s.isActive === 'boolean') return s.isActive;
  return true;
}

// Services Section
function ServicesSection({ setView }: { setView: (v: View) => void }) {
  const { services, addOns } = useStore();
  const [expandedPricing, setExpandedPricing] = useState<string | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('real-estate');
  // Track selected sqft tier per service: { "pkg-base": "0-2000", "pkg-standard": "2001-3000", ... }
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});

  const sqftLabels: Record<string, string> = {
    '0-2000': '0–2,000 sqft',
    '2001-3000': '2,001–3,000 sqft',
    '3001-4000': '3,001–4,000 sqft',
    '4001-5000': '4,001–5,000 sqft',
    '5001+': '5,001+ sqft',
  };
  const sqftKeys = ['0-2000', '2001-3000', '3001-4000', '4001-5000', '5001+'];

  const getActivePrice = (service: Service) => {
    const tier = selectedTiers[service.id];
    if (tier && service.pricingTiers?.[tier]) return service.pricingTiers[tier];
    return service.basePrice;
  };

  const getActiveTierLabel = (service: Service) => {
    const tier = selectedTiers[service.id];
    return tier ? sqftLabels[tier] : null;
  };

  const handleSelectTier = (serviceId: string, tierKey: string) => {
    setSelectedTiers(prev => ({ ...prev, [serviceId]: tierKey }));
  };

  const handleBookPackage = (service: Service) => {
    const activePrice = getActivePrice(service);
    const tierLabel = getActiveTierLabel(service);
    const serviceWithTierPrice = {
      ...service,
      basePrice: activePrice,
      _selectedSqftTier: selectedTiers[service.id] || '0-2000',
      _selectedSqftLabel: tierLabel || '0–2,000 sqft',
    };
    useStore.getState().setService(serviceWithTierPrice as Service);
    setView('booking');
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Packages & Pricing</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Strategic photo, video, and drone packages that make you stand out.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap justify-center gap-2 p-1.5 bg-card rounded-xl border border-[#cbb26a]/20">
            {['real-estate', ...NEW_SERVICE_TABS.map(t => t.id)].map((tabId) => {
              const label = tabId === 'real-estate' ? 'Real Estate'
                : NEW_SERVICE_TABS.find(t => t.id === tabId)?.label || tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tabId
                      ? 'btn-gold text-white shadow-md'
                      : 'text-muted-foreground hover:text-[#cbb26a] hover:bg-[#cbb26a]/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── REAL ESTATE TAB ── */}
        {activeTab === 'real-estate' && (
          <>
            <div className="flex justify-center mb-10">
              <Badge className="bg-[#cbb26a]/20 text-[#8f5e25] border-[#cbb26a]/30 text-sm px-4 py-1">
                Select your property size below to see exact pricing
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {services.filter((s: any) => !s.tabCategory || s.tabCategory === 'real-estate').map((service: Service) => {
                const activePrice = getActivePrice(service);
                const activeTier = selectedTiers[service.id];
                const isExpanded = expandedPricing === service.id;

                return (
                  <Card key={service.id} className="flex flex-col gold-border card-lift relative overflow-hidden !pt-0 !gap-0">
                    {service.slug === 'standard-package' && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-gradient-to-r from-[#8f5e25] to-[#cbb26a] text-white border-0 shadow-lg text-xs">Most Popular</Badge>
                      </div>
                    )}
                    {service.slug === 'unlimited-package' && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-gradient-to-r from-[#1a1a1a] to-[#444] text-[#cbb26a] border border-[#cbb26a]/50 shadow-lg text-xs">Best Value</Badge>
                      </div>
                    )}
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={service.image} alt={service.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </div>
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription
                        className={`text-sm leading-relaxed cursor-pointer transition-all ${expandedDesc === service.id ? '' : 'line-clamp-2 md:line-clamp-none'}`}
                        onClick={() => setExpandedDesc(expandedDesc === service.id ? null : service.id)}
                      >
                        {service.description}
                      </CardDescription>
                      <button
                        onClick={() => setExpandedDesc(expandedDesc === service.id ? null : service.id)}
                        className="text-xs text-[#cbb26a] hover:text-[#8f5e25] flex items-center gap-0.5 mt-1 md:hidden transition-colors"
                      >
                        {expandedDesc === service.id ? 'Show less' : 'Read more'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedDesc === service.id ? 'rotate-180' : ''}`} />
                      </button>
                    </CardHeader>
                    <CardContent className="flex-1 pt-2">
                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-[#8f5e25]">{formatPrice(activePrice)}</span>
                          {activeTier ? (
                            <span className="text-xs text-[#cbb26a] font-medium">{sqftLabels[activeTier]}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">starting from</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">What's included:</p>
                          <ul className="space-y-1.5">
                            {service.deliverables.map((item: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#cbb26a] flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {service.pricingTiers && (
                          <div>
                            <button
                              onClick={() => setExpandedPricing(isExpanded ? null : service.id)}
                              className="text-sm text-[#8f5e25] hover:text-[#cbb26a] font-medium flex items-center gap-1 transition-colors"
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              {activeTier ? 'Change property size' : 'Select property size'}
                            </button>
                            {isExpanded && (
                              <div className="mt-3 rounded-lg border border-[#cbb26a]/20 overflow-hidden">
                                {sqftKeys.map((key) => {
                                  const isSelected = activeTier === key;
                                  const tierPrice = service.pricingTiers?.[key];
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => handleSelectTier(service.id, key)}
                                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all ${isSelected ? 'bg-[#cbb26a]/20 border-l-2 border-l-[#cbb26a]' : 'hover:bg-[#cbb26a]/10 border-l-2 border-l-transparent'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#cbb26a]' : 'border-muted-foreground/30'}`}>
                                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#cbb26a]" />}
                                        </div>
                                        <span className={isSelected ? 'text-[#cbb26a] font-medium' : 'text-muted-foreground'}>{sqftLabels[key]}</span>
                                      </div>
                                      <span className={`font-semibold ${isSelected ? 'text-[#cbb26a]' : 'text-[#8f5e25]'}`}>
                                        {tierPrice ? formatPrice(tierPrice) : '—'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pb-4 pt-2">
                      <Button className="w-full btn-gold text-white" onClick={() => handleBookPackage(service)}>
                        {activeTier ? `Book — ${formatPrice(activePrice)}` : 'Book This Package'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Real Estate Add-ons */}
            <div className="bg-card rounded-2xl p-8 border border-[#cbb26a]/20 mb-8">
              <h2 className="text-2xl font-bold mb-2 gradient-text">Add-Ons / A La Carte</h2>
              <p className="text-muted-foreground mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
                Enhance your package with individual services. Prices shown are for 0–2,000 sqft.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addOns.filter((a: AddOn) => a.isActive).map((addon: AddOn) => (
                  <div key={addon.id} className="bg-card p-4 rounded-lg border border-[#cbb26a]/20 hover:border-[#cbb26a]/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{addon.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-[#8f5e25]">{formatPrice(addon.price)}</span>
                        {addon.priceType === 'per-photo' && (
                          <span className="block text-xs text-muted-foreground">/photo</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── NEW SERVICE TABS (hybrid: Firestore if available, else hardcoded) ── */}
        {NEW_SERVICE_TABS.map(tab => activeTab === tab.id && (() => {
          // Use Firestore services if they exist for this tab, otherwise fall back to hardcoded
          const firestoreServices = (services as any[])
            .filter((s: any) => s.tabCategory === tab.id && getServiceActive(s))
            .sort((a: any, b: any) => {
              const pos = (s: any) => s.order > 0 ? s.order : s.sortOrder > 0 ? s.sortOrder : 999;
              const pa = pos(a), pb = pos(b);
              if (pa !== pb) return pa - pb;
              // Tiebreaker: sort by price ascending so Basic < Standard < Full Service
              const parsePrice = (s: any) => {
                const raw = s.price || s.displayPrice || '';
                const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
                return isNaN(n) ? (s.basePrice || 999999) : n;
              };
              return parsePrice(a) - parsePrice(b);
            });

          // Normalize to a common shape: { sectionTitle, pkgs[] }
          // Only use Firestore if it has a COMPLETE replacement set (all packages seeded)
          // This prevents partial admin saves from hiding hardcoded tiers
          const hardcodedPackageCount = tab.sections.reduce((sum, s) => sum + s.packages.length, 0);
          let sectionGroups: Array<{ title: string; description: string; image: string; pkgs: any[] }>;
          if (firestoreServices.length >= hardcodedPackageCount) {
            const sectionMap: Record<string, any[]> = {};
            firestoreServices.forEach((s: any) => {
              const sec = s.serviceSection || 'Other';
              if (!sectionMap[sec]) sectionMap[sec] = [];
              sectionMap[sec].push(s);
            });
            sectionGroups = Object.entries(sectionMap).map(([title, pkgs]) => ({
              title,
              description: pkgs[0]?.description || '',
              image: getServiceImage(pkgs[0]) || '',
              pkgs,
            }));
          } else {
            sectionGroups = tab.sections.map(section => ({
              title: section.title,
              description: section.description,
              image: section.image,
              pkgs: section.packages.map(pkg => ({
                id: `static-${tab.id}-${pkg.name}`,
                name: pkg.name,
                price: pkg.price,
                badge: pkg.badge,
                includes: pkg.includes,
                image: section.image,
                description: section.description,
              })),
            }));
          }

          return (
            <div key={tab.id}>
              {sectionGroups.map((group, gi) => (
                <div key={gi} className="mb-14">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold gradient-text mb-1">{group.title}</h2>
                    <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{group.description}</p>
                  </div>
                  <div className={`grid gap-6 ${
                    group.pkgs.length === 2
                      ? 'md:grid-cols-2 max-w-3xl'
                      : 'md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {group.pkgs.map((pkg: any, pi: number) => {
                      const badge = pkg.badge || '';
                      const imgSrc = getServiceImage(pkg) || group.image;
                      const displayPrice = getServiceDisplayPrice(pkg);
                      const includes = getServiceIncludes(pkg);
                      return (
                        <div key={pkg.id || pi} className="relative">
                          {badge && (
                            <div className="absolute top-3 right-3 z-10">
                              <Badge className="bg-gradient-to-r from-[#8f5e25] to-[#cbb26a] text-white border-0 shadow-lg text-xs">{badge}</Badge>
                            </div>
                          )}
                          <Card className="flex flex-col gold-border card-lift relative overflow-hidden !pt-0 !gap-0 h-full">
                            {imgSrc && (
                              <div className="aspect-[16/10] overflow-hidden">
                                <img src={imgSrc} alt={pkg.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <CardHeader className="pb-2 pt-4">
                              <CardTitle className="text-lg">{pkg.name}</CardTitle>
                              <CardDescription className="text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                                {pkg.description || group.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pt-2">
                              <div className="space-y-4">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-bold text-[#8f5e25]">{displayPrice}</span>
                                  <span className="text-xs text-muted-foreground">starting from</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-2">What's included:</p>
                                  <ul className="space-y-1.5">
                                    {includes.map((item: string, ii: number) => (
                                      <li key={ii} className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#cbb26a] flex-shrink-0" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="pb-4 pt-2">
                              <Button className="w-full btn-gold text-white" onClick={() => setView('booking')}>
                                Book This Package
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Popular Add-Ons for new tabs */}
              <div className="bg-card rounded-2xl p-8 border border-[#cbb26a]/20 mb-8">
                <h2 className="text-2xl font-bold mb-2 gradient-text">Popular Add-Ons</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {NEW_ADDONS.map((addon, ai) => (
                    <div key={ai} className="bg-card p-4 rounded-lg border border-[#cbb26a]/20 hover:border-[#cbb26a]/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{addon.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-semibold text-[#8f5e25]">{addon.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card/50 rounded-xl p-6 border border-[#cbb26a]/10 mb-8">
                <ul className="space-y-1.5">
                  {['Half-day = up to 4 hours on-site', 'Full-day = up to 8 hours on-site', 'Standard turnaround: 5 to 7 business days unless otherwise noted', 'Custom quotes available for recurring content, multi-day productions, and commercial campaigns'].map((note, ni) => (
                    <li key={ni} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-[#cbb26a] mt-0.5">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto mb-8">
                *All prices are starting at. Final pricing may vary based on scope, creative direction, location, licensing, talent, studio rental, styling, assistants, travel, rush turnaround, retouching, and other production needs.
              </p>
            </div>
          );
        })())}

        {/* Custom Quote CTA */}
        <div className="mt-8 text-center bg-card rounded-2xl p-10 border border-[#cbb26a]/20">
          <h2 className="text-2xl font-bold gradient-text mb-3">Need something custom?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            Every shoot is different. If you need a custom package, recurring content, multi-day coverage, or a campaign quote, reach out and we'll build the right solution for your goals.
          </p>
          <Button className="btn-gold text-white px-8 py-3 text-base" onClick={() => setView('contact')}>
            Get a Custom Quote
          </Button>
        </div>
      </div>
    </div>
  );
}

// Booking Section - Multi-step booking flow
function BookingSection({ setView }: { setView: (v: View) => void }) {
  const [step, _setStep] = useState(1);
  const stepRef = useRef(1);
  const isPopStepRef = useRef(false);

  // Wrap setStep to push browser history entries for each booking step
  const setStep = useCallback((newStep: number) => {
    _setStep(newStep);
    stepRef.current = newStep;
    if (!isPopStepRef.current) {
      window.history.pushState({ view: 'booking', bookingStep: newStep }, '', '/booking');
    }
    isPopStepRef.current = false;
  }, []);

  // Handle browser back/forward within booking steps
  useEffect(() => {
    const handleBookingPopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state?.view === 'booking' && typeof state.bookingStep === 'number') {
        // Going back/forward between booking steps
        isPopStepRef.current = true;
        _setStep(state.bookingStep);
        stepRef.current = state.bookingStep;
      } else if (stepRef.current > 1) {
        // User pressed back from step > 1 but no booking state — go to previous step
        event.preventDefault();
        const prevStep = stepRef.current - 1;
        isPopStepRef.current = true;
        _setStep(prevStep);
        stepRef.current = prevStep;
        window.history.pushState({ view: 'booking', bookingStep: prevStep }, '', '/booking');
      }
      // If step is 1 and no booking state, let the default popstate handler in App handle it
    };
    // Push initial booking step 1 into history
    window.history.replaceState({ view: 'booking', bookingStep: 1 }, '', '/booking');
    window.addEventListener('popstate', handleBookingPopState);
    return () => window.removeEventListener('popstate', handleBookingPopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // IMPORTANT: useBooking() must be called BEFORE any state that references selectedService
  const {
    selectedService,
    selectedAddOns,
    selectedDate,
    selectedTimeSlot,
    setService,
    toggleAddOn,
    setDate,
    setTimeSlot,
    clearBooking
  } = useBooking();

  const [expandedBookingDesc, setExpandedBookingDesc] = useState<string | null>(null);
  const [selectedSqftTier, setSelectedSqftTier] = useState<string | null>(
    (selectedService as any)?._selectedSqftTier || null
  );
  const [sqftDropdownOpen, setSqftDropdownOpen] = useState(false);

  const sqftLabels: Record<string, string> = {
    '0-2000': '0–2,000 sqft',
    '2001-3000': '2,001–3,000 sqft',
    '3001-4000': '3,001–4,000 sqft',
    '4001-5000': '4,001–5,000 sqft',
    '5001+': '5,001+ sqft',
  };
  const sqftKeys = ['0-2000', '2001-3000', '3001-4000', '4001-5000', '5001+'];

  // Add-on pricing tiers by name (lowercase match) and sqft tier (values in cents)
  const addOnPricingByTier: Record<string, Record<string, number>> = {
    'hdr photos': { '0-2000': 25000, '2001-3000': 32500, '3001-4000': 37500, '4001-5000': 42500, '5001+': 50000 },
    'matterport 3d tour': { '0-2000': 22500, '2001-3000': 22500, '3001-4000': 37500, '4001-5000': 42500, '5001+': 50000 },
    'cinematic video': { '0-2000': 50000, '2001-3000': 50000, '3001-4000': 70000, '4001-5000': 80000, '5001+': 90000 },
    'twilight photos': { '0-2000': 22500, '2001-3000': 22500, '3001-4000': 22500, '4001-5000': 22500, '5001+': 22500 },
    'drone photos': { '0-2000': 22500, '2001-3000': 22500, '3001-4000': 22500, '4001-5000': 22500, '5001+': 22500 },
    'ig walkthrough reel': { '0-2000': 25000, '2001-3000': 25000, '3001-4000': 27500, '4001-5000': 27500, '5001+': 27500 },
    'floor plan': { '0-2000': 10000, '2001-3000': 10000, '3001-4000': 10000, '4001-5000': 10000, '5001+': 10000 },
    'agent intro/outro': { '0-2000': 10000, '2001-3000': 10000, '3001-4000': 10000, '4001-5000': 10000, '5001+': 10000 },
    'area highlight video': { '0-2000': 15000, '2001-3000': 15000, '3001-4000': 15000, '4001-5000': 15000, '5001+': 15000 },
    'virtual staging': { '0-2000': 2500, '2001-3000': 2500, '3001-4000': 2500, '4001-5000': 2500, '5001+': 2500 },
  };

  // Get the add-on price adjusted for the selected sqft tier
  const getAddonPrice = (addon: AddOn) => {
    if (!selectedSqftTier) return addon.price;
    const key = addon.name.toLowerCase();
    const tierPricing = addOnPricingByTier[key];
    if (tierPricing && tierPricing[selectedSqftTier] !== undefined) {
      return tierPricing[selectedSqftTier];
    }
    return addon.price;
  };

  // Handle sqft tier selection — update the service price
  const handleSqftSelect = (tierKey: string) => {
    setSelectedSqftTier(tierKey);
    setSqftDropdownOpen(false);
    if (selectedService && selectedService.pricingTiers?.[tierKey]) {
      const updatedService = {
        ...selectedService,
        basePrice: selectedService.pricingTiers[tierKey],
        _selectedSqftTier: tierKey,
        _selectedSqftLabel: sqftLabels[tierKey],
      };
      setService(updatedService as Service);
    }
  };

  // Handle package selection — reset sqft tier
  const handlePackageSelect = (service: Service) => {
    setSelectedSqftTier(null);
    setSqftDropdownOpen(true);
    setService(service);
  };
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'venmo' | 'zelle'>('stripe');
  const [paymentOption, setPaymentOption] = useState<'full' | 'deposit'>('deposit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', notes: '' });
  // Holds the Firestore booking ID created before payment is initiated
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const { user } = useAuth();
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [calendarBusySlots, setCalendarBusySlots] = useState<Array<{start: string; end: string; source: string}>>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);


  useEffect(() => {
    if (selectedDate) {
      setIsCheckingAvailability(true);
      // Check availability from both Firestore AND Google Calendar
      const checkAvailabilityFunc = httpsCallable(functions, 'checkAvailability');
      checkAvailabilityFunc({ date: selectedDate.toISOString() })
        .then((result: any) => {
          const data = result.data;
          if (data.success && data.busySlots) {
            setCalendarBusySlots(data.busySlots);
          }
        })
        .catch((err: any) => {
          console.warn('Calendar availability check failed, falling back to Firestore only:', err.message);
        })
        .finally(() => setIsCheckingAvailability(false));

      // Also get Firestore bookings as fallback
      bookingsService.getByDate(selectedDate).then(setExistingBookings);
    } else {
      setExistingBookings([]);
      setCalendarBusySlots([]);
    }
  }, [selectedDate]);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user?.profile) {
      setFormData(prev => ({
        ...prev,
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        email: user.email || '',
        phone: user.profile.phone || ''
      }));
    }
  }, [user]);

  // Scroll to top on step change or completion
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step, isComplete]);



  const { showToast, services, addOns } = useStore();

  // Helper to get add-ons for a specific service
  const getServiceAddOns = (serviceId: string) =>
    addOns.filter((a: AddOn) => a.applicableServices.includes(serviceId) && a.isActive);

  // Generate time slots for selected date
  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    const duration = selectedService?.duration || 60;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min of [0, 30]) {
        const start = new Date(date);
        start.setHours(hour, min, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);

        if (end.getHours() <= endHour) {
          slots.push({ start, end });
        }
      }
    }
    return slots;
  };

  // Calculate raw subtotal (before any discount)
  const calculateTotal = () => {
    if (!selectedService) return 0;
    const addonsTotal = selectedAddOns.reduce((sum: number, a: AddOn) => sum + getAddonPrice(a), 0);
    return selectedService.basePrice + addonsTotal;
  };

  // Calculate the actual amount due after applying the 5% full-payment discount
  const FULL_PAYMENT_DISCOUNT = 0.05;
  const calculateFinalAmount = () => {
    const subtotal = calculateTotal();
    if (paymentOption === 'full') {
      return subtotal * (1 - FULL_PAYMENT_DISCOUNT);
    }
    return subtotal;
  };

  // ─── Create Booking BEFORE payment (fixes race condition) ───────────────────
  // Called when user reaches Step 4 (Payment). Creates a pending_payment booking
  // in Firestore first so the webhook has a real bookingId to confirm.
  const ensureBookingCreated = async (): Promise<{ bookingId: string; clientId: string } | null> => {
    if (pendingBookingId) return { bookingId: pendingBookingId, clientId: pendingClientId || '' };
    if (!selectedService || !selectedDate || !selectedTimeSlot) return null;

    try {
      const subtotal = calculateTotal();
      const total = paymentOption === 'full'
        ? subtotal * (1 - FULL_PAYMENT_DISCOUNT)
        : subtotal;
      const depositAmount = paymentOption === 'deposit'
        ? (subtotal * (selectedService.depositRequired || 0)) / 100
        : 0;

      // Lookup client record for this user
      let resolvedClientId = '';
      if (user?.id) {
        const { clientsService } = await import('@/lib/firebaseService');
        const client = await clientsService.getByUserId(user.id);
        resolvedClientId = client?.id || '';
      }

      const bookingId = await bookingsService.create({
        clientId: resolvedClientId || user?.id || 'guest',
        clientName: `${formData.firstName} ${formData.lastName}`,
        clientEmail: formData.email,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        addons: selectedAddOns.map((a: AddOn) => ({
          addonId: a.id,
          name: a.name,
          price: getAddonPrice(a)
        })),
        sqftTier: selectedSqftTier || null,
        sqftLabel: selectedSqftTier ? sqftLabels[selectedSqftTier] : null,
        dateTime: {
          start: selectedTimeSlot.start,
          end: selectedTimeSlot.end,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: {
          address: formData.address,
          notes: formData.notes
        },
        pricing: {
          subtotal: selectedService.basePrice,
          travelFee: 0,
          total: total,
          depositAmount: depositAmount
        },
        payment: {
          status: 'pending',
          method: paymentMethod as any,
        },
        status: 'pending_payment', // Will be updated to 'confirmed' by webhook
        notes: formData.notes
      } as any);

      setPendingBookingId(bookingId);
      setPendingClientId(resolvedClientId);
      return { bookingId, clientId: resolvedClientId };
    } catch (err) {
      console.error('Failed to pre-create booking:', err);
      return null;
    }
  };

  // Called by non-Stripe payment paths
  const handleComplete = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) return;
    setIsProcessing(true);
    try {
      await ensureBookingCreated();
      setIsComplete(true);
      showToast('Booking submitted! You can view it in your portal.', 'success');
    } catch (error) {
      console.error('Booking failed:', error);
      showToast('Failed to create booking. Please contact support.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen pt-20 pb-20 px-4">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 bg-[#cbb26a]/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-gold-pulse">
            <CheckCircle className="w-10 h-10 text-[#8f5e25]" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Your session has been booked for {selectedDate && formatDate(selectedDate)} at {selectedTimeSlot && formatTime(selectedTimeSlot.start)}.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full btn-gold text-white font-medium"
              onClick={() => {
                clearBooking();
                setIsComplete(false);
                setStep(1);
              }}
            >
              Book Another Session
            </Button>
            <Button
              variant="outline"
              className="w-full border-[#cbb26a] text-[#8f5e25] hover:bg-[#cbb26a]/20"
              onClick={() => setView('portal')}
            >
              Go to Client Portal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Book Your Session</h1>
        <p className="text-gray-400 mb-8">Complete the steps below to secure your booking</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= s ? 'bg-gradient-to-r from-[#8f5e25] to-[#cbb26a] text-white shadow-lg' : 'bg-gray-200 text-muted-foreground'
                }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {i < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${step > s ? 'bg-[#cbb26a]' : 'bg-gray-200'
                  }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center">
              <button
                onClick={() => setView('services')}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-[#cbb26a] transition-colors"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Packages
              </button>
            </div>
            <h2 className="text-xl font-semibold">Select a Package</h2>

            {/* Show pre-selected sqft tier info if coming from packages page */}
            {selectedService && (selectedService as any)._selectedSqftLabel && (
              <div className="p-3 rounded-lg bg-[#cbb26a]/10 border border-[#cbb26a]/30 flex items-center gap-2">
                <Check className="w-4 h-4 text-[#cbb26a]" />
                <span className="text-sm">
                  Property size: <span className="font-semibold text-[#cbb26a]">{(selectedService as any)._selectedSqftLabel}</span>
                  {' — '}
                  <span className="font-semibold text-[#8f5e25]">{formatPrice(selectedService.basePrice)}</span>
                </span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {services.map((service: Service) => (
                <div
                  key={service.id}
                  onClick={() => handlePackageSelect(service)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedService?.id === service.id
                    ? 'border-[#cbb26a] bg-[#cbb26a]/20 ring-1 ring-[#cbb26a]'
                    : 'border-border hover:border-[#dbc88a]'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={service.image}
                      alt={service.name}
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      <p
                        className={`text-sm text-muted-foreground cursor-pointer transition-all ${expandedBookingDesc === service.id ? '' : 'line-clamp-2'}`}
                        onClick={(e) => { e.stopPropagation(); setExpandedBookingDesc(expandedBookingDesc === service.id ? null : service.id); }}
                      >
                        {service.description}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedBookingDesc(expandedBookingDesc === service.id ? null : service.id); }}
                        className="text-xs text-[#cbb26a] hover:text-[#8f5e25] flex items-center gap-0.5 mt-0.5 transition-colors"
                      >
                        {expandedBookingDesc === service.id ? 'Show less' : 'Read more'}
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedBookingDesc === service.id ? 'rotate-180' : ''}`} />
                      </button>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="font-bold text-[#8f5e25]">
                          {selectedService?.id === service.id
                            ? formatPrice(selectedService.basePrice)
                            : formatPrice(service.basePrice)}
                        </span>
                        {selectedService?.id === service.id && selectedSqftTier ? (
                          <span className="text-xs text-[#cbb26a] font-medium">{sqftLabels[selectedSqftTier]}</span>
                        ) : selectedService?.id !== service.id ? (
                          <span className="text-xs text-muted-foreground">starting from</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Square Footage Selection */}
            {selectedService && selectedService.pricingTiers && (
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-2">Property Size</h3>
                <p className="text-sm text-muted-foreground mb-4">Select the approximate square footage of the property</p>
                <div className="relative">
                  <button
                    onClick={() => setSqftDropdownOpen(!sqftDropdownOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedSqftTier
                        ? 'border-[#cbb26a] bg-[#cbb26a]/10'
                        : 'border-border hover:border-[#dbc88a] bg-card'
                    }`}
                  >
                    <span className={selectedSqftTier ? 'text-[#cbb26a] font-medium' : 'text-muted-foreground'}>
                      {selectedSqftTier ? sqftLabels[selectedSqftTier] : 'Select property size...'}
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedSqftTier && selectedService.pricingTiers?.[selectedSqftTier] && (
                        <span className="font-semibold text-[#8f5e25]">
                          {formatPrice(selectedService.pricingTiers[selectedSqftTier])}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform ${sqftDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {sqftDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 rounded-lg border border-[#cbb26a]/20 bg-card shadow-lg overflow-hidden">
                      {sqftKeys.map((key) => {
                        const tierPrice = selectedService.pricingTiers?.[key];
                        const isSelected = selectedSqftTier === key;
                        return (
                          <button
                            key={key}
                            onClick={(e) => { e.stopPropagation(); handleSqftSelect(key); }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all ${
                              isSelected
                                ? 'bg-[#cbb26a]/20 border-l-2 border-l-[#cbb26a]'
                                : 'hover:bg-[#cbb26a]/10 border-l-2 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-[#cbb26a]' : 'border-muted-foreground/30'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#cbb26a]" />}
                              </div>
                              <span className={isSelected ? 'text-[#cbb26a] font-medium' : 'text-muted-foreground'}>
                                {sqftLabels[key]}
                              </span>
                            </div>
                            <span className={`font-semibold ${isSelected ? 'text-[#cbb26a]' : 'text-[#8f5e25]'}`}>
                              {tierPrice ? formatPrice(tierPrice) : '\u2014'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedService && (
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-4">Add-Ons (Optional)</h3>
                <div className="space-y-3">
                  {getServiceAddOns(selectedService.id).map((addon: AddOn) => (
                    <label
                      key={addon.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-[#cbb26a]/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAddOns.some((a: AddOn) => a.id === addon.id)}
                          onChange={() => toggleAddOn(addon)}
                          className="w-5 h-5 rounded border-gray-300 text-[#8f5e25] focus:ring-[#cbb26a]"
                        />
                        <div>
                          <p className="font-medium">{addon.name}</p>
                          <p className="text-sm text-muted-foreground">{addon.description}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-[#8f5e25]">{formatPrice(getAddonPrice(addon))}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Compact How It Works */}
            <div className="bg-card rounded-xl p-6 border border-[#cbb26a]/20">
              <h3 className="text-lg font-bold text-center mb-4 gradient-text">How It Works</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { num: '01', icon: Calendar, title: 'Book Online', desc: 'Choose your package and pick a date' },
                  { num: '02', icon: ClipboardCheck, title: 'Confirm Details', desc: 'We confirm address and access info' },
                  { num: '03', icon: Camera, title: 'We Shoot', desc: 'Our team captures stunning media' },
                  { num: '04', icon: Send, title: 'Fast Delivery', desc: 'Edited media delivered in 24–48 hrs' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="relative mx-auto w-12 h-12 rounded-full border-2 border-[#cbb26a]/40 flex items-center justify-center mb-2">
                      <s.icon className="w-5 h-5 text-[#cbb26a]" />
                      <span className="absolute -top-1 -right-1 bg-[#8f5e25] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{s.num}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                disabled={!selectedService || (selectedService.pricingTiers && !selectedSqftTier)}
                onClick={() => setStep(2)}
                className="btn-gold text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && selectedService && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(1)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">Select Date & Time</h2>
            </div>

            {/* Simple date picker - in real app use a calendar component */}
            <div className="bg-card p-6 rounded-lg border">
              <Label className="mb-2 block">Select Date</Label>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(14)].map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i + 1);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <button
                      key={i}
                      onClick={() => setDate(date)}
                      className={`p-3 rounded-lg text-center transition-colors ${isSelected
                        ? 'bg-[#0a0a0a] text-white border border-[#cbb26a]'
                        : 'bg-[#faf8f2] text-black hover:bg-[#cbb26a]/20 border border-transparent'
                        }`}
                    >
                      <p className="text-xs uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="text-lg font-semibold">{date.getDate()}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-card p-6 rounded-lg border">
                <Label className="mb-4 block">Available Times</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {isCheckingAvailability ? (
                    <div className="col-span-full flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#cbb26a] mr-2" />
                      <span className="text-muted-foreground">Checking availability...</span>
                    </div>
                  ) : generateTimeSlots(selectedDate).map((slot, i) => {
                    // Check Firestore bookings
                    const isFirestoreBooked = existingBookings.some(b =>
                      b.status !== 'cancelled' &&
                      b.status !== 'pending_payment' &&
                      slot.start < b.dateTime.end &&
                      slot.end > b.dateTime.start
                    );

                    // Check Google Calendar busy slots
                    const isCalendarBusy = calendarBusySlots.some(busy => {
                      const busyStart = new Date(busy.start);
                      const busyEnd = new Date(busy.end);
                      return slot.start < busyEnd && slot.end > busyStart;
                    });

                    const isBooked = isFirestoreBooked || isCalendarBusy;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (isBooked) {
                            showToast('This time slot is already booked. Please choose another.', 'error');
                            return;
                          }
                          setTimeSlot(slot);
                        }}
                        disabled={isBooked}
                        className={`p-3 rounded-lg text-center transition-colors relative ${selectedTimeSlot?.start.getTime() === slot.start.getTime()
                          ? 'bg-[#0a0a0a] text-white border border-[#cbb26a]'
                          : isBooked
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-[#faf8f2] text-black hover:bg-[#cbb26a]/20 border border-transparent'
                          }`}
                      >
                        {formatTime(slot.start)}
                        {isBooked && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{isCalendarBusy && !isFirestoreBooked ? 'Busy' : 'Booked'}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                disabled={!selectedDate || !selectedTimeSlot}
                onClick={() => setStep(3)}
                className="btn-gold text-white font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(2)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">Your Details</h2>
            </div>

            <div className="bg-card p-6 rounded-lg border space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="address">Location Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requests or instructions..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={async () => {
                // Pre-create the booking now so PaymentForm has a real bookingId
                await ensureBookingCreated();
                setStep(4);
              }} className="btn-gold text-white font-medium">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && selectedService && selectedDate && selectedTimeSlot && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(3)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">Payment</h2>
            </div>

            {/* Order Summary */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <div>
                    <span>{selectedService.name}</span>
                    {selectedSqftTier && (
                      <span className="text-xs text-muted-foreground ml-2">({sqftLabels[selectedSqftTier]})</span>
                    )}
                  </div>
                  <span>{formatPrice(selectedService.basePrice)}</span>
                </div>
                {selectedAddOns.map((addon: AddOn) => (
                  <div key={addon.id} className="flex justify-between">
                    <span>{addon.name}</span>
                    <span>{formatPrice(getAddonPrice(addon))}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                {paymentOption === 'full' && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>5% Full Payment Discount</span>
                    <span>-{formatPrice(calculateTotal() * FULL_PAYMENT_DISCOUNT)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-[#8f5e25]">{formatPrice(calculateFinalAmount())}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#cbb26a]/20 border border-[#cbb26a]/20 rounded-lg">
                <p className="text-sm text-[#8f5e25]">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatDate(selectedDate)} at {formatTime(selectedTimeSlot.start)}
                </p>
              </div>
            </div>

            {/* Payment Option */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">Payment Option</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setPaymentOption('deposit')}
                  className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${paymentOption === 'deposit'
                    ? 'border-[#cbb26a] bg-[#cbb26a]/20'
                    : 'border-border hover:border-[#dbc88a]'
                    }`}
                >
                  <p className="font-medium">Pay Deposit ({selectedService.depositRequired}%)</p>
                  <p className="text-2xl font-bold text-[#8f5e25]">{formatPrice(calculateTotal() * selectedService.depositRequired / 100)}</p>
                  <p className="text-sm text-muted-foreground">Balance due at delivery</p>
                </button>
                <button
                  onClick={() => setPaymentOption('full')}
                  className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${paymentOption === 'full'
                    ? 'border-[#cbb26a] bg-[#cbb26a]/20'
                    : 'border-border hover:border-[#dbc88a]'
                    }`}
                >
                  <p className="font-medium">Pay Full Amount</p>
                  <p className="text-2xl font-bold text-[#8f5e25]">{formatPrice(calculateTotal() * (1 - FULL_PAYMENT_DISCOUNT))}</p>
                  <p className="text-sm text-green-600 font-medium">Save {formatPrice(calculateTotal() * FULL_PAYMENT_DISCOUNT)} (5% off)</p>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">Payment Method</h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-[#cbb26a] bg-[#cbb26a]/20/30' : 'hover:border-[#dbc88a]'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="w-5 h-5 text-[#8f5e25] focus:ring-[#cbb26a]"
                  />
                  <div className="flex items-center justify-center w-8">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 rounded-md" aria-label="Stripe">
                      <rect width="24" height="24" fill="#635bff" />
                      <polygon points="5.5,16.5 5.5,9.5 18.5,6 18.5,13" fill="#ffffff" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Stripe / Credit Card</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-[#cbb26a] bg-[#cbb26a]/5' : 'hover:bg-muted/50'}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                    className="w-5 h-5"
                  />
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">P</div>
                  <div className="flex-1">
                    <p className="font-medium">PayPal</p>
                    <p className="text-sm text-muted-foreground">Send to Feezel24@gmail.com — booking held 30 min</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'venmo' ? 'border-[#cbb26a] bg-[#cbb26a]/5' : 'hover:bg-muted/50'}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'venmo'}
                    onChange={() => setPaymentMethod('venmo')}
                    className="w-5 h-5"
                  />
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">V</div>
                  <div className="flex-1">
                    <p className="font-medium">Venmo</p>
                    <p className="text-sm text-muted-foreground">Send to @Thomas-Feezel — booking held 30 min</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'zelle' ? 'border-[#cbb26a] bg-[#cbb26a]/5' : 'hover:bg-muted/50'}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'zelle'}
                    onChange={() => setPaymentMethod('zelle')}
                    className="w-5 h-5"
                  />
                  <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">Z</div>
                  <div className="flex-1">
                    <p className="font-medium">Zelle</p>
                    <p className="text-sm text-muted-foreground">Send to Feezel24@gmail.com — booking held 30 min</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Form or Confirmation */}
            {paymentMethod === 'stripe' ? (
              <div className="bg-card p-6 rounded-lg border mt-6">
                <h3 className="font-semibold mb-4">Enter Card Details</h3>
                <PaymentForm
                  amount={paymentOption === 'deposit'
                    ? calculateTotal() * (selectedService.depositRequired || 0) / 100
                    : calculateFinalAmount()
                  }
                  email={formData.email}
                  invoiceId={undefined}
                  bookingId={pendingBookingId || undefined}
                  clientId={pendingClientId || undefined}
                  paymentOption={paymentOption}
                  onSuccess={async () => {
                    // Ensure booking is created before Stripe confirms (race-condition guard)
                    if (!pendingBookingId) await ensureBookingCreated();
                    setIsComplete(true);
                    showToast('Payment successful! Booking confirmed.', 'success');
                  }}
                />
                <div className="mt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Terms */}
                <div className="flex items-start gap-3 mt-6">
                  <input type="checkbox" id="terms" className="w-5 h-5 mt-0.5 rounded text-[#8f5e25] focus:ring-[#cbb26a]" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the <button className="underline">Terms of Service</button> and
                    <button className="underline">Cancellation Policy</button>.
                    I understand that cancellations within 24 hours are non-refundable.
                  </label>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    disabled={isProcessing}
                    className="btn-gold text-white font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Booking
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// About Section
function AboutSection() {
  const { portfolioItems } = useStore();
  const [btsImages, setBtsImages] = useState<string[]>([]);
  const [btsLoading, setBtsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SLIDE_INTERVAL = 2000; // 2 seconds per image

  // Fetch BTS images from Firestore, fall back to BTS portfolio images
  useEffect(() => {
    async function fetchBtsImages() {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const snap = await getDoc(doc(db, 'siteConfig', 'aboutBtsImages'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.images && data.images.length > 0) {
            setBtsImages(data.images);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch BTS images:', err);
      }
      // Fallback: use BTS portfolio images if no dedicated about images exist
      const btsFallback = portfolioItems
        .filter((item: PortfolioItem) => item.category === 'bts' && item.image)
        .map((item: PortfolioItem) => item.image);
      if (btsFallback.length > 0) {
        setBtsImages(btsFallback);
      }
    }
    fetchBtsImages().finally(() => setBtsLoading(false));
  }, [portfolioItems]);

  // Auto-rotate images every 2 seconds
  useEffect(() => {
    if (btsImages.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % btsImages.length);
    }, SLIDE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [btsImages.length]);

  const goToImage = (index: number) => {
    if (index === currentImageIndex) return;
    setCurrentImageIndex(index);
    // Reset the auto-rotate timer on manual nav
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % btsImages.length);
    }, SLIDE_INTERVAL);
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">About</h1>
          <p className="text-muted-foreground">Professional Photography and videography that focus on details and results</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Slideshow Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] group">
            {btsImages.length > 0 ? (
              <>
                {/* All images stacked — only the active one is visible */}
                {btsImages.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Behind the scenes ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                    style={{ opacity: idx === currentImageIndex ? 1 : 0 }}
                  />
                ))}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {/* Dot Navigation */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {btsImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToImage(idx)}
                      className={`rounded-full transition-all duration-300 ${idx === currentImageIndex
                        ? 'w-6 h-2 bg-[#cbb26a]'
                        : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                        }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Image counter */}
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {currentImageIndex + 1} / {btsImages.length}
                </div>
              </>
            ) : btsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <Loader2 className="w-8 h-8 animate-spin text-[#cbb26a]" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-[#cbb26a]" />
                  <p className="text-sm">Behind the scenes</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Hi, I'm Thomas</h2>
            <p className="text-muted-foreground mb-4">
              I'm a freelance photographer and videographer with 8 years of experience creating high-impact visuals that feel cinematic, intentional, and built to perform. I'm obsessive about the details—lighting, composition, pacing, and polish—because the small choices are what separate "nice content" from a story people actually remember.
            </p>
            <p className="text-muted-foreground mb-6">
              My approach blends creative, outside-the-box thinking with clear storytelling narratives designed to convert: capturing what makes your brand different, then translating it into photos and videos that build trust, attention, and action. I take real pride in my work, and I'm excited to partner with new clients to expand their business and grow their social reach.
            </p>
            <div className="flex gap-8">
              <div>
                <p className="text-3xl font-bold text-[#8f5e25]">1000+</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#8f5e25]">8+</p>
                <p className="text-sm text-muted-foreground">Years</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#8f5e25]">98%</p>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-card rounded-2xl p-8 mb-16 border border-[#cbb26a]/20">
          <h2 className="text-2xl font-bold mb-6 text-center">Professional Equipment</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <Camera className="w-10 h-10 mx-auto mb-3 text-[#cbb26a]" />
              <h3 className="font-semibold mb-1">Cameras</h3>
              <p className="text-sm text-muted-foreground">Sony A7R V, Canon R5</p>
            </div>
            <div className="text-center">
              <Video className="w-10 h-10 mx-auto mb-3 text-[#cbb26a]" />
              <h3 className="font-semibold mb-1">Video</h3>
              <p className="text-sm text-muted-foreground">Sony FX3, DJI RS3 Pro</p>
            </div>
            <div className="text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-[#cbb26a]" />
              <h3 className="font-semibold mb-1">Drone</h3>
              <p className="text-sm text-muted-foreground">DJI Mavic 3 Pro</p>
            </div>
          </div>
        </div>

        {/* BTS Gallery */}
        <div className="mt-16">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {portfolioItems.filter((p: PortfolioItem) => p.category === 'bts').map((item: PortfolioItem) => (
              <div key={item.id} className="aspect-square rounded-lg overflow-hidden group">
                <img
                  src={item.image}
                  alt={item.title || "Behind the scenes"}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Section
function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const { showToast } = useStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setLoading(true);
    try {
      await contactMessagesService.create(formData);
      showToast('Message sent successfully', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Contact</h1>
          <p className="text-muted-foreground">Have questions? Get in touch</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-card p-8 rounded-2xl border">
            <h2 className="text-xl font-semibold mb-6">Send a Message</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your name" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" required />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="How can we help?" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Your message..."
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full btn-gold text-white font-medium">
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
              <p className="text-muted-foreground mb-6">
                Whether you have questions about services, need a custom quote,
                or want to discuss a project, I'm here to help.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#cbb26a]/20 rounded-lg flex items-center justify-center text-[#8f5e25]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">Thomassamuelmedia@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#cbb26a]/20 rounded-lg flex items-center justify-center text-[#8f5e25]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">520-312-8020</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#cbb26a]/20 rounded-lg flex items-center justify-center text-[#8f5e25]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">Los Angeles, CA</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#cbb26a]/20 rounded-lg flex items-center justify-center text-[#8f5e25]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Hours</p>
                  <p className="text-muted-foreground">Mon-Fri: 9am - 6pm</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-medium mb-3">Follow</p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/thomassamuelmedia/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#cbb26a]/20 text-[#8f5e25] rounded-lg flex items-center justify-center hover:bg-[#e8d9b0] transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/in/thomas-feezel/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#cbb26a]/20 text-[#8f5e25] rounded-lg flex items-center justify-center hover:bg-[#e8d9b0] transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Login Section
function LoginSection({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { login } = useAuth();
  const { showToast } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'forgot') {
        const { authService: authSvc } = await import('@/lib/firebaseService');
        await authSvc.resetPassword(email);
        setResetSent(true);
        showToast('Password reset email sent! Check your inbox.', 'success');
      } else if (mode === 'signup') {
        const { authService: authSvc } = await import('@/lib/firebaseService');
        await authSvc.register(email, password, { firstName, lastName });
        // Auto-login after signup
        await login(email, password);
        showToast('Account created! Welcome!', 'success');
        setView('home');
      } else if (mode === 'login') {
        const success = await login(email, password);
        if (success) {
          showToast('Welcome back!', 'success');
          setView('home');
        } else {
          setError('Invalid credentials. Please try again.');
        }
      }
    } catch (err: any) {
      const msg = err?.code === 'auth/user-not-found' ? 'No account found with that email.'
        : err?.code === 'auth/wrong-password' ? 'Incorrect password.'
          : err?.code === 'auth/email-already-in-use' ? 'An account with that email already exists.'
            : err?.code === 'auth/weak-password' ? 'Password should be at least 6 characters.'
              : err?.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.'
                : err?.message || 'Something went wrong.';
      setError(msg);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {mode === 'forgot' ? 'Reset Password' : mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'forgot'
              ? 'Enter your email and we\'ll send you a reset link'
              : mode === 'signup'
                ? 'Sign up to book sessions and manage your projects'
                : 'Sign in to access your portal'}
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl border">
          {mode !== 'forgot' && (
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
              <button
                onClick={() => { setMode('login'); setError(''); setResetSent(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'login' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-muted-foreground'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); setResetSent(false); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'signup' ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-muted-foreground'
                  }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'forgot' && resetSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-lg">Check your email</p>
                <p className="text-muted-foreground text-sm mt-1">
                  We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setResetSent(false); setError(''); }}
                  className="text-[#cbb26a] hover:underline font-medium"
                >
                  try again
                </button>
              </p>
              <Button
                onClick={() => { setMode('login'); setError(''); setResetSent(false); }}
                className="w-full btn-gold text-white font-medium mt-4"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-sm text-[#cbb26a] hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-gold text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'forgot' ? (
                  'Send Reset Link'
                ) : mode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="w-full text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  );
}





// Footer Component
function Footer({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="bg-black text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4 text-[#cbb26a]">
              <img src="/logo-white.png" alt="Thomas Samuel Media Logo" className="w-8 h-8" />
              <span>Thomas Samuel Media</span>
            </div>
            <p className="text-gray-400 text-sm">
              Premium photography and video for real estate, brands, and businesses.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => setView('home')} className="hover:text-white">Home</button></li>
              <li><button onClick={() => setView('portfolio')} className="hover:text-white">Portfolio</button></li>
              <li><button onClick={() => setView('services')} className="hover:text-white">Packages</button></li>
              <li><button onClick={() => setView('about')} className="hover:text-white">About</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => setView('contact')} className="hover:text-white">Contact</button></li>
              <li><button onClick={() => setView('portal')} className="hover:text-white">Client Portal</button></li>
              <li><button onClick={() => setView('privacy')} className="hover:text-white">Privacy Policy</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/thomassamuelmedia/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#cbb26a] hover:text-[#0a0a0a] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/thomas-feezel/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#cbb26a] hover:text-[#0a0a0a] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10 mb-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; 2026 Thomas Samuel Media. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => setView('terms')} className="hover:text-white">Terms of Service</button>
            <button onClick={() => setView('privacy')} className="hover:text-white">Privacy Policy</button>
            <button onClick={() => setView('cancellation')} className="hover:text-white">Cancellation Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper: map URL pathname to a View
const validViews: View[] = ['home','portfolio','services','booking','about','contact','portal','admin','login','settings','terms','privacy','cancellation'];
function pathToView(pathname: string): View {
  const segment = pathname.replace(/^\//, '').split('/')[0].toLowerCase();
  if (segment === 'packages') return 'services';
  if (segment && validViews.includes(segment as View)) return segment as View;
  return 'home';
}
function viewToPath(view: View): string {
  if (view === 'services') return '/packages';
  return view === 'home' ? '/' : `/${view}`;
}

// ─── Protected Route Guards ──────────────────────────────────────────────────
function RequireAdmin({ children, setView }: { children: React.ReactNode; setView: (v: View) => void }) {
  const { isAuthenticated, authLoading, user } = useAuth();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== 'admin') {
    setTimeout(() => setView('login'), 0);
    return null;
  }
  return <>{children}</>;
}

function RequireAuth({ children, setView }: { children: React.ReactNode; setView: (v: View) => void }) {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!isAuthenticated) {
    setTimeout(() => setView('login'), 0);
    return null;
  }
  return <>{children}</>;
}

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState<View>(() => pathToView(window.location.pathname));
  const { setUser, loadPublicData, loadAdminData, dataLoaded, authLoading } = useStore();
  const isPopRef = useRef(false);

  // Wrap setCurrentView to also push browser history
  const setView = useCallback((view: View) => {
    setCurrentView(view);
    if (!isPopRef.current) {
      window.history.pushState({ view }, '', viewToPath(view));
    }
    isPopRef.current = false;
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If this is a booking step change, let BookingSection handle it
      if (event.state?.view === 'booking' && typeof event.state?.bookingStep === 'number') {
        return;
      }
      const view = event.state?.view || pathToView(window.location.pathname);
      isPopRef.current = true;
      setView(view);
    };
    window.addEventListener('popstate', handlePopState);
    // Replace the initial history entry so it has state too
    window.history.replaceState({ view: currentView }, '', viewToPath(currentView));
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Firebase auth listener — runs once on mount
  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await authService.getUserProfile(firebaseUser.uid);
        setUser(profile);
        // Load admin data if admin
        if (profile?.role === 'admin') {
          loadAdminData();
        }
      } else {
        setUser(null);
        setCurrentView(prev => { if (['settings', 'portal', 'admin'].includes(prev)) { window.history.replaceState({ view: 'home' }, '', '/'); return 'home'; } return prev; });
      }
    });
    return () => unsubscribe();
  }, []);

  // Load public data (services, portfolio, testimonials) on mount
  useEffect(() => {
    if (!dataLoaded) {
      loadPublicData();
    }
  }, [dataLoaded]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} setView={setView} />
      <main>
        {/* Persist HomeSection to keep video loaded / buffering */}
        <div style={{ display: currentView === 'home' ? 'block' : 'none' }}>
          <HomeSection setView={setView} />
        </div>

        {/* Render other views conditionally */}
        {currentView === 'portfolio' && <PortfolioSection />}
        {currentView === 'services' && <ServicesSection setView={setView} />}
        {currentView === 'booking' && <BookingSection setView={setView} />}
        {currentView === 'about' && <AboutSection />}
        {currentView === 'contact' && <ContactSection />}
        {currentView === 'login' && <LoginSection setView={setView} />}
        {currentView === 'portal' && <ClientPortal setView={setView} />}
        {currentView === 'admin' && <RequireAdmin setView={setView}><AdminDashboard setView={setView} /></RequireAdmin>}
        {currentView === 'settings' && <RequireAuth setView={setView}><SettingsPage /></RequireAuth>}
        {currentView === 'terms' && <TermsOfServicePage setView={setView} />}
        {currentView === 'privacy' && <PrivacyPolicyPage setView={setView} />}
        {currentView === 'cancellation' && <CancellationPolicyPage setView={setView} />}
      </main>

      {currentView !== 'portal' && currentView !== 'admin' && currentView !== 'login' && (
        <Footer setView={setView} />
      )}
      <Toast />
    </div>
  );
}

export default App;
