import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  MessageCircle,
  Share2,
  Zap,
  Smartphone,
  Lock,
  ArrowRight,
  Check,
  Instagram,
  ExternalLink,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (searchParams.get('admin') === 'true') {
      setShowAdminLogin(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      // Step 1: Sign in - this will trigger onAuthStateChange but we handle it separately
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      if (!data.session?.user) {
        setLoginError('Authentication failed. Please try again.');
        return;
      }

      // Step 2: Wait for auth token lock to fully release
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Check user role
      const user = data.session.user;
      let profile = null;
      let profileError = null;
      
      try {
        const result = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        profile = result.data;
        profileError = result.error;
      } catch (e: any) {
        profileError = e;
      }

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        await supabase.auth.signOut();
        setLoginError('Error loading user profile. Please contact support.');
        return;
      }

      if (profile?.role === 'admin' || profile?.role === 'superadmin') {
        setShowAdminLogin(false);
        navigate('/admin');
      } else {
        await supabase.auth.signOut();
        setLoginError(`Access denied: Your account role is "${profile?.role || 'unknown'}". Admin privileges required.`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">BookPage</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-gray-900 transition-colors">
                How it Works
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminLogin(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>Now in Beta — 1 Property Free Forever</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              The booking link for{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Instagram-native
              </span>{' '}
              resorts
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
              Stop typing "Is this date available?" 50 times a day. Turn your photos
              and Google Calendar into a shareable booking page — in 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8"
                onClick={() => navigate('/admin')}
              >
                Create Your Page Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('/p/villa-moonlight', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                See Demo
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                No credit card
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                30-second setup
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              From DM to booking in 3 taps
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The transaction stays in WhatsApp (where trust lives). You just kill the back-and-forth about availability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Owner Flow */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Owner Setup (30 sec)</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</span>
                  <span>Upload 5-10 vertical photos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</span>
                  <span>Enter your WhatsApp number</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</span>
                  <span>Click dates to mark booked 🔴</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">4</span>
                  <span>Copy link to Instagram bio</span>
                </li>
              </ul>
            </div>

            {/* Guest Flow */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-emerald-100">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Guest Discovers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</span>
                  <span>DMs "Rates?" → Gets auto-reply with link</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</span>
                  <span>Swipes through Stories-style gallery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</span>
                  <span>Sees live calendar with 🟢 dates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">4</span>
                  <span>Selects dates, taps "Request to Book"</span>
                </li>
              </ul>
            </div>

            {/* Close Flow */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">3. Close in WhatsApp</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</span>
                  <span>WhatsApp opens with pre-filled message</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</span>
                  <span>Guest sends booking request</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</span>
                  <span>You reply with UPI for advance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">4</span>
                  <span>Mark booked → Dates turn 🔴 instantly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built for resort owners who live on Instagram and WhatsApp. No complex systems, no monthly fees.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Visual Calendar</h3>
              <p className="text-sm text-gray-600">Click to toggle 🟢🟡🔴. Updates instantly on your public page.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Stories-Style Gallery</h3>
              <p className="text-sm text-gray-600">Vertical swipe gallery optimized for mobile — just like Instagram Stories.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">WhatsApp Deep Links</h3>
              <p className="text-sm text-gray-600">Pre-filled booking messages. No API, no subscriptions.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instant Updates</h3>
              <p className="text-sm text-gray-600">Mark a date booked → Public page updates in &lt;1 second.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multiple Properties</h3>
              <p className="text-sm text-gray-600">Manage all your properties from one dashboard. Each gets its own link.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Instagram className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instagram-Ready</h3>
              <p className="text-sm text-gray-600">Bio link optimized for mobile. Vertical photos look stunning.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Password Protected</h3>
              <p className="text-sm text-gray-600">Simple HTTP auth for your admin dashboard. No complex JWT.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <ExternalLink className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Custom Slug</h3>
              <p className="text-sm text-gray-600">bookpage.app/p/your-villa-name — clean, shareable, memorable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                See it in action
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                This is what your guests see when they click your bio link. A beautiful,
                mobile-first experience that converts browsers into bookings.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Stories-Style Gallery</h4>
                    <p className="text-sm text-gray-600">Swipe through your property photos vertically</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Live Availability Calendar</h4>
                    <p className="text-sm text-gray-600">🟢 Open, 🟡 Hold, 🔴 Booked — updated in real-time</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">One-Tap WhatsApp</h4>
                    <p className="text-sm text-gray-600">Pre-filled message with dates and guest count</p>
                  </div>
                </div>
              </div>
              <Button
                className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => window.open('/p/villa-moonlight', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live Demo
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-3xl transform rotate-3" />
              <div className="relative bg-gray-900 rounded-3xl p-4 shadow-2xl max-w-sm mx-auto">
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="aspect-[9/16] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Villa Moonlight</h3>
                      <p className="text-white/80">Goa, India</p>
                      <div className="mt-8 space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="w-3 h-3 bg-green-400 rounded-full" />
                          <span>Open Dates Available</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="w-3 h-3 bg-red-400 rounded-full" />
                          <span>Instant Booking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, one-time pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No monthly fees. No commissions. No payment gateway charges.
              You keep 100% of your bookings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">Free</span>
                </div>
                <p className="text-gray-500 mt-2">Forever free for 1 property</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-600">1 property</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-600">Up to 10 photos</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-600">WhatsApp booking</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-600">Basic analytics</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/admin')}
              >
                Get Started Free
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white relative">
              <div className="absolute -top-3 right-8 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">₹999</span>
                </div>
                <p className="text-emerald-100 mt-2">One-time payment, lifetime access</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-200" />
                  <span className="text-emerald-50">Unlimited properties</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-200" />
                  <span className="text-emerald-50">Unlimited photos + videos</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-200" />
                  <span className="text-emerald-50">Room types support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-200" />
                  <span className="text-emerald-50">Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-200" />
                  <span className="text-emerald-50">Custom domain (coming soon)</span>
                </li>
              </ul>
              <Button
                className="w-full bg-white text-emerald-600 hover:bg-gray-100"
                onClick={() => navigate('/admin')}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to stop typing "Is this date available?"
          </h2>
          <p className="text-lg text-emerald-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of resort owners who've reclaimed their time.
            Set up your booking page in 30 seconds — free forever for 1 property.
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-600 hover:bg-gray-100 px-8"
            onClick={() => navigate('/admin')}
          >
            Create Your Page Free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="mt-4 text-sm text-emerald-200">
            No credit card required • 30-second setup • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white">BookPage</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
                How it Works
              </button>
              <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">
                Pricing
              </button>
              <button onClick={() => setShowAdminLogin(true)} className="hover:text-white transition-colors">
                Admin
              </button>
            </div>
            <div className="text-sm">
              © 2025 BookPage. Built for resort owners.
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Login Dialog */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Admin Login
            </DialogTitle>
            <DialogDescription className="sr-only">
              Sign in with your admin email and password to access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email
              </label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  setLoginError('');
                }}
                placeholder="admin@example.com"
                className="w-full mb-4"
                required
              />
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Password
              </label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setLoginError('');
                }}
                placeholder="Enter password"
                className="w-full"
                required
              />
              {loginError && (
                <p className="text-sm text-red-500 mt-2">{loginError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAdminLogin(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                Login
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
