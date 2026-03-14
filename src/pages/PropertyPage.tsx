import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  IndianRupee,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  X,
  Share2,
  ArrowLeft,
  Instagram,
  Video,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AMENITIES_LIST } from './AdminDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getPropertyBySlug, getMonthCalendar } from '@/lib/api';
import type { Property, DateStatus } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';

export default function PropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<number, DateStatus>>({});
  const [selectedDates, setSelectedDates] = useState<{ checkIn: Date | null; checkOut: Date | null }>({
    checkIn: null,
    checkOut: null,
  });
  const [guests, setGuests] = useState(2);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const mediaList = property
    ? [
      ...(property.images || []).map(url => ({ type: 'image', url })),
      ...(property.videos || []).map(url => ({ type: 'video', url }))
    ]
    : [];

  useEffect(() => {
    async function loadProp() {
      if (slug) {
        setLoading(true);
        try {
          const prop = await getPropertyBySlug(slug);
          if (prop) {
            setProperty(prop);
          }
        } catch (error) {
          console.error("Failed to load property:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadProp();
  }, [slug]);

  useEffect(() => {
    if (property) {
      document.title = `${property.name} - BookPage`;

      const metaTags = {
        'og:title': property.name,
        'og:description': property.description,
        'og:image': property.images?.[0] || '',
        'og:url': window.location.href,
        'twitter:card': 'summary_large_image',
      };

      Object.entries(metaTags).forEach(([name, content]) => {
        let meta = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          if (name.startsWith('og:')) {
            meta.setAttribute('property', name);
          } else {
            meta.setAttribute('name', name);
          }
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    }
  }, [property]);

  useEffect(() => {
    if (property) {
      loadCalendar();
    }
  }, [property, currentMonth]);

  useEffect(() => {
    const handleCalendarUpdate = () => {
      loadCalendar();
    };
    window.addEventListener('calendar:updated', handleCalendarUpdate);
    return () => window.removeEventListener('calendar:updated', handleCalendarUpdate);
  }, [property, currentMonth]);

  const loadCalendar = async () => {
    if (!property) return;
    try {
      const data = await getMonthCalendar(
        property.id,
        currentMonth.getFullYear(),
        currentMonth.getMonth()
      );
      setCalendarData(data);
    } catch (error) {
      console.error("Failed to load calendar", error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!property || mediaList.length <= 1) return;
    const diff = touchStart - touchEnd;
    const threshold = 50;
    if (diff > threshold) {
      setCurrentImageIndex((prev) => (prev + 1) % mediaList.length);
    } else if (diff < -threshold) {
      setCurrentImageIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    }
  };

  const nextImage = () => {
    if (!property) return;
    setCurrentImageIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevImage = () => {
    if (!property) return;
    setCurrentImageIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const handleDateClick = (day: number) => {
    const status = calendarData[day] || 'open';
    if (status === 'booked') return;
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
      setSelectedDates({ checkIn: clickedDate, checkOut: null });
    } else if (selectedDates.checkIn && !selectedDates.checkOut) {
      if (clickedDate < selectedDates.checkIn) {
        setSelectedDates({ checkIn: clickedDate, checkOut: selectedDates.checkIn });
      } else {
        setSelectedDates({ ...selectedDates, checkOut: clickedDate });
      }
    }
  };

  const generateWhatsAppLink = () => {
    if (!property || !selectedDates.checkIn) return '#';
    const checkInStr = format(selectedDates.checkIn, 'MMM d, yyyy');
    const checkOutStr = selectedDates.checkOut
      ? format(selectedDates.checkOut, 'MMM d, yyyy')
      : 'next day';
    const nights = selectedDates.checkOut
      ? Math.ceil((selectedDates.checkOut.getTime() - selectedDates.checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    const message = `Hi! I want to book ${property.name} for ${checkInStr} to ${checkOutStr} (${nights} night${nights > 1 ? 's' : ''}), ${guests} guest${guests > 1 ? 's' : ''}. Your page shows ${property.currency}${property.pricePerNight.toLocaleString()}/night. Is this still available?`;
    return `https://wa.me/${property.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const shareProperty = async () => {
    if (!property) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: `Check out ${property.name} on BookPage!`,
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selectedDates.checkIn && isSameDay(date, selectedDates.checkIn)) return true;
    if (selectedDates.checkOut && isSameDay(date, selectedDates.checkOut)) return true;
    if (selectedDates.checkIn && selectedDates.checkOut) {
      return date > selectedDates.checkIn && date < selectedDates.checkOut;
    }
    return false;
  };

  const isDateInRange = (day: number) => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date > selectedDates.checkIn && date < selectedDates.checkOut;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-4">This property does not exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const nights = selectedDates.checkIn && selectedDates.checkOut
    ? Math.ceil((selectedDates.checkOut.getTime() - selectedDates.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = nights * property.pricePerNight;

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile */}
      <div className="lg:hidden">
        <div
          ref={galleryRef}
          className="relative h-screen bg-black"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {mediaList.length > 0 ? (
              mediaList.map((_, index) => (
                <div key={index} className={`flex-1 h-1 rounded-full transition-all ${index <= currentImageIndex ? 'bg-white' : 'bg-white/30'}`} />
              ))
            ) : (
              <div className="flex-1 h-1 bg-white/30 rounded-full" />
            )}
          </div>

          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="w-10 h-10 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={shareProperty} className="w-10 h-10 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="h-full flex items-center justify-center">
            {mediaList.length > 0 ? (
              mediaList[currentImageIndex].type === 'video' ? (
                <video src={mediaList[currentImageIndex].url} autoPlay loop muted playsInline className="w-full h-full object-cover" onClick={() => setShowImageModal(true)} />
              ) : (
                <img src={mediaList[currentImageIndex].url} alt={property.name} className="w-full h-full object-cover" onClick={() => setShowImageModal(true)} />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <BedDouble className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg opacity-80">No media yet</p>
                </div>
              </div>
            )}
          </div>

          {mediaList.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-32 flex items-center justify-center">
                <ChevronLeft className="w-8 h-8 text-white/70" />
              </button>
              <button onClick={nextImage} className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-32 flex items-center justify-center">
                <ChevronRight className="w-8 h-8 text-white/70" />
              </button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <h1 className="text-2xl font-bold text-white mb-2">{property.name}</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{property.location}</span>
              {property.mapLink && (
                <a href={property.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <Map className="w-4 h-4" />View on Map
                </a>
              )}
              <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" />{property.pricePerNight.toLocaleString()}/night</span>
              {property.instagram && (
                <a href={`https://instagram.com/${property.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" />@{property.instagram}
                </a>
              )}
            </div>
            <p className="text-white/70 text-sm mt-3 line-clamp-2">{property.description}</p>
          </div>
        </div>

        <div className="p-4 bg-white">
          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 gap-3">
                {AMENITIES_LIST.filter(a => property.amenities!.includes(a.id)).map(amenity => (
                  <div key={amenity.id} className="flex items-center gap-2 text-gray-700">
                    <amenity.icon className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="mb-6" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Check Availability</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium">{format(currentMonth, 'MMM yyyy')}</span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded" /><span className="text-gray-600">Available</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded" /><span className="text-gray-600">Hold</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /><span className="text-gray-600">Booked</span></div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 py-2">{day}</div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const dayNum = day.getDate();
              const status = calendarData[dayNum] || 'open';
              const isSelected = isDateSelected(dayNum);
              const inRange = isDateInRange(dayNum);
              return (
                <button
                  key={dayNum}
                  onClick={() => handleDateClick(dayNum)}
                  disabled={status === 'booked'}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                    ${status === 'booked' ? 'bg-red-100 text-red-400 cursor-not-allowed' : ''}
                    ${status === 'hold' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${status === 'open' && !isSelected ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''}
                    ${isSelected ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2' : ''}
                    ${inRange ? 'bg-emerald-200 text-emerald-800' : ''}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {selectedDates.checkIn && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Selected Dates</p>
                  <p className="font-medium text-gray-900">
                    {format(selectedDates.checkIn, 'MMM d')}
                    {selectedDates.checkOut && ` - ${format(selectedDates.checkOut, 'MMM d')}`}
                    {nights > 0 && ` (${nights} nights)`}
                  </p>
                </div>
                {nights > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-emerald-600">₹{totalPrice.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-6 text-lg"
            onClick={() => setShowBookingDialog(true)}
            disabled={!selectedDates.checkIn}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {selectedDates.checkIn ? 'Request to Book on WhatsApp' : 'Select Dates to Book'}
          </Button>

          <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <p className="text-sm text-gray-600 text-center">
              Own a resort? <button onClick={() => navigate('/admin')} className="text-emerald-600 font-medium hover:underline">Create your page free</button>
            </p>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl">BookPage</span>
              </div>
              <Button variant="outline" onClick={shareProperty}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                {mediaList.length > 0 ? (
                  mediaList[currentImageIndex].type === 'video' ? (
                    <video src={mediaList[currentImageIndex].url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={mediaList[currentImageIndex].url} alt={property.name} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <BedDouble className="w-24 h-24 text-white/50" />
                  </div>
                )}
                {mediaList.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                  {currentImageIndex + 1} / {mediaList.length || 1}
                </div>
              </div>
              {mediaList.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {mediaList.map((media, index) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)} className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${index === currentImageIndex ? 'ring-2 ring-emerald-500' : ''}`}>
                      {media.type === 'video' ? (
                        <>
                          <video src={media.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <img src={media.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{property.location}</span>
                  {property.mapLink && (
                    <a href={property.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                      <Map className="w-4 h-4" />View on Map
                    </a>
                  )}
                  {property.instagram && (
                    <a href={`https://instagram.com/${property.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                      <Instagram className="w-4 h-4" />@{property.instagram}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-emerald-600">{property.currency}{property.pricePerNight.toLocaleString()}</span>
                <span className="text-gray-500">/ night</span>
              </div>
              <p className="text-gray-600 mb-8">{property.description}</p>

              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {AMENITIES_LIST.filter(a => property.amenities!.includes(a.id)).map(amenity => (
                      <div key={amenity.id} className="flex items-center gap-3 text-gray-700">
                        <amenity.icon className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="mb-6" />

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Select Dates</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded" /><span className="text-gray-600">Available</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded" /><span className="text-gray-600">Hold</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /><span className="text-gray-600">Booked</span></div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">{day}</div>
                  ))}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {daysInMonth.map((day) => {
                    const dayNum = day.getDate();
                    const status = calendarData[dayNum] || 'open';
                    const isSelected = isDateSelected(dayNum);
                    const inRange = isDateInRange(dayNum);
                    return (
                      <button
                        key={dayNum}
                        onClick={() => handleDateClick(dayNum)}
                        disabled={status === 'booked'}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                          ${status === 'booked' ? 'bg-red-100 text-red-400 cursor-not-allowed' : ''}
                          ${status === 'hold' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${status === 'open' && !isSelected ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''}
                          ${isSelected ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2' : ''}
                          ${inRange ? 'bg-emerald-200 text-emerald-800' : ''}`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDates.checkIn && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Selected Dates</p>
                      <p className="font-medium text-gray-900">
                        {format(selectedDates.checkIn, 'MMM d')}
                        {selectedDates.checkOut && ` - ${format(selectedDates.checkOut, 'MMM d')}`}
                        {nights > 0 && ` (${nights} nights)`}
                      </p>
                    </div>
                    {nights > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-bold text-emerald-600 text-xl">₹{totalPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-6 text-lg"
                onClick={() => setShowBookingDialog(true)}
                disabled={!selectedDates.checkIn}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {selectedDates.checkIn ? 'Request to Book on WhatsApp' : 'Select Dates to Book'}
              </Button>

              <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <p className="text-sm text-gray-600 text-center">
                  Own a resort? <button onClick={() => navigate('/admin')} className="text-emerald-600 font-medium hover:underline">Create your page free</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Booking Request</DialogTitle>
            <DialogDescription className="sr-only">
              Review your booking details before sending the inquiry via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Property</span>
                <span className="font-medium">{property.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Check-in</span>
                <span className="font-medium">{selectedDates.checkIn && format(selectedDates.checkIn, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Check-out</span>
                <span className="font-medium">{selectedDates.checkOut ? format(selectedDates.checkOut, 'MMM d, yyyy') : 'Next day'}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Guests</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">-</button>
                  <span className="font-medium w-6 text-center">{guests}</span>
                  <button onClick={() => setGuests(guests + 1)} className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">+</button>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total ({nights || 1} nights)</span>
                <span className="font-bold text-emerald-600 text-lg">₹{((nights || 1) * property.pricePerNight).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">You will be redirected to WhatsApp with a pre-filled message. The owner will confirm availability and share payment details.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowBookingDialog(false)}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white" onClick={() => { window.open(generateWhatsAppLink(), '_blank'); setShowBookingDialog(false); }}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="sm:max-w-4xl bg-black border-none p-0">
          <div className="relative h-[80vh]">
            {mediaList[currentImageIndex] && (
              mediaList[currentImageIndex].type === 'video' ? (
                <video src={mediaList[currentImageIndex].url} controls autoPlay className="w-full h-full object-contain" />
              ) : (
                <img src={mediaList[currentImageIndex].url} alt={property.name} className="w-full h-full object-contain" />
              )
            )}
            {mediaList.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
