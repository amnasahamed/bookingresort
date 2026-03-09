import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  X,
  Upload,
  IndianRupee,
  MapPin,
  Phone,
  Video,
  Wifi,
  Waves,
  Wind,
  Car,
  Trees,
  Utensils,
  Tv,
  Shirt
} from 'lucide-react';

export const AMENITIES_LIST = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'parking', label: 'Free Parking', icon: Car },
  { id: 'balcony', label: 'Balcony/Terrace', icon: Trees },
  { id: 'kitchen', label: 'Kitchen', icon: Utensils },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'washer', label: 'Washer', icon: Shirt }
];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Property, DateStatus } from '@/types';
import {
  getProperties,
  getPropertyById,
  saveProperty,
  deleteProperty,
  generateSlug,
  getMonthCalendar,
  setDateStatus,
  logoutAdmin,
  storeImage
} from '@/lib/storage';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<number, DateStatus>>({});
  const [activeTab, setActiveTab] = useState('calendar');

  // Form states
  const [propertyName, setPropertyName] = useState('');
  const [propertyDescription, setPropertyDescription] = useState('');
  const [propertyLocation, setPropertyLocation] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [propertyWhatsapp, setPropertyWhatsapp] = useState('');
  const [propertyInstagram, setPropertyInstagram] = useState('');
  const [propertyMapLink, setPropertyMapLink] = useState('');
  const [propertyAmenities, setPropertyAmenities] = useState<string[]>([]);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [propertyVideos, setPropertyVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadCalendar();
    }
  }, [selectedPropertyId, currentMonth]);

  // Listen for calendar updates from other tabs
  useEffect(() => {
    const handleCalendarUpdate = () => {
      if (selectedPropertyId) {
        loadCalendar();
      }
    };
    window.addEventListener('calendar:updated', handleCalendarUpdate);
    return () => window.removeEventListener('calendar:updated', handleCalendarUpdate);
  }, [selectedPropertyId]);

  const loadProperties = () => {
    const props = getProperties();
    setProperties(props);
    if (props.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(props[0].id);
    }
  };

  const loadCalendar = () => {
    if (!selectedPropertyId) return;
    const data = getMonthCalendar(
      selectedPropertyId,
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
    setCalendarData(data);
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim()) return;

    const newProperty: Property = {
      id: Date.now().toString(),
      slug: generateSlug(propertyName),
      name: propertyName,
      description: propertyDescription,
      location: propertyLocation,
      pricePerNight: parseInt(propertyPrice) || 0,
      currency: '₹',
      whatsappNumber: propertyWhatsapp.replace(/\D/g, ''),
      instagram: propertyInstagram,
      mapLink: propertyMapLink,
      amenities: propertyAmenities,
      images: propertyImages,
      videos: propertyVideos,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProperty(newProperty);
    setShowAddProperty(false);
    resetForm();
    loadProperties();
    setSelectedPropertyId(newProperty.id);
  };

  const handleEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return;

    const property = getPropertyById(selectedPropertyId);
    if (!property) return;

    const updatedProperty: Property = {
      ...property,
      name: propertyName,
      description: propertyDescription,
      location: propertyLocation,
      pricePerNight: parseInt(propertyPrice) || 0,
      whatsappNumber: propertyWhatsapp.replace(/\D/g, ''),
      instagram: propertyInstagram,
      mapLink: propertyMapLink,
      amenities: propertyAmenities,
      images: propertyImages,
      videos: propertyVideos,
      updatedAt: new Date().toISOString(),
    };

    saveProperty(updatedProperty);
    setShowEditProperty(false);
    loadProperties();
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('Are you sure you want to delete this property? This cannot be undone.')) {
      deleteProperty(id);
      loadProperties();
      if (selectedPropertyId === id) {
        const remaining = getProperties();
        setSelectedPropertyId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const openEditDialog = () => {
    const property = getPropertyById(selectedPropertyId!);
    if (!property) return;

    setPropertyName(property.name);
    setPropertyDescription(property.description);
    setPropertyLocation(property.location);
    setPropertyPrice(property.pricePerNight.toString());
    setPropertyWhatsapp(property.whatsappNumber);
    setPropertyInstagram(property.instagram || '');
    setPropertyMapLink(property.mapLink || '');
    setPropertyAmenities(property.amenities || []);
    setPropertyImages(property.images);
    setPropertyVideos(property.videos || []);
    setShowEditProperty(true);
  };

  const resetForm = () => {
    setPropertyName('');
    setPropertyDescription('');
    setPropertyLocation('');
    setPropertyPrice('');
    setPropertyWhatsapp('');
    setPropertyInstagram('');
    setPropertyMapLink('');
    setPropertyAmenities([]);
    setPropertyImages([]);
    setPropertyVideos([]);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newImages: string[] = [];
    const newVideos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const base64 = await storeImage(file);
        newImages.push(base64);
      } else if (file.type.startsWith('video/')) {
        const base64 = await storeImage(file);
        newVideos.push(base64);
      }
    }

    setPropertyImages([...propertyImages, ...newImages]);
    setPropertyVideos([...propertyVideos, ...newVideos]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setPropertyImages(propertyImages.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setPropertyVideos(propertyVideos.filter((_, i) => i !== index));
  };

  const copyPropertyLink = (slug: string) => {
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const toggleDateStatus = (day: number) => {
    if (!selectedPropertyId) return;
    const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    const currentStatus = calendarData[day] || 'open';
    const newStatus: DateStatus =
      currentStatus === 'open' ? 'booked' :
        currentStatus === 'booked' ? 'hold' : 'open';

    setDateStatus(selectedPropertyId, dateStr, newStatus);
    setCalendarData({ ...calendarData, [day]: newStatus });
  };

  const getStatusColor = (status: DateStatus) => {
    switch (status) {
      case 'open': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'hold': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'booked': return 'bg-red-500 hover:bg-red-600';
    }
  };

  const selectedProperty = selectedPropertyId ? getPropertyById(selectedPropertyId) : null;

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-bold text-xl text-gray-900">BookPage Admin</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Property List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Your Properties</h2>
              </div>
              <div className="p-2">
                {properties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => setSelectedPropertyId(property.id)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${selectedPropertyId === property.id
                      ? 'bg-emerald-50 border-emerald-200 border'
                      : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${selectedPropertyId === property.id ? 'text-emerald-700' : 'text-gray-700'
                        }`}>
                        {property.name}
                      </span>
                      {selectedPropertyId === property.id && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{property.location}</p>
                  </button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full mt-2 justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setShowAddProperty(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border mt-4 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Properties</span>
                  <Badge variant="secondary">{properties.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {properties.length <= 1 ? 'Free' : 'Pro'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedProperty ? (
              <div className="space-y-6">
                {/* Property Header */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedProperty.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedProperty.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {selectedProperty.pricePerNight.toLocaleString()}/night
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          +{selectedProperty.whatsappNumber}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPropertyLink(selectedProperty.slug)}
                      >
                        {copiedLink === selectedProperty.slug ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/p/${selectedProperty.slug}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openEditDialog}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteProperty(selectedProperty.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-white border">
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendar
                    </TabsTrigger>
                    <TabsTrigger value="media" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Media
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* Calendar Tab */}
                  <TabsContent value="calendar" className="mt-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {format(currentMonth, 'MMMM yyyy')}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Click dates to toggle status • Updates instantly on your public page
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonth(new Date())}
                          >
                            Today
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-emerald-500 rounded" />
                          <span className="text-sm text-gray-600">🟢 Open</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded" />
                          <span className="text-sm text-gray-600">🟡 Hold</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded" />
                          <span className="text-sm text-gray-600">🔴 Booked</span>
                        </div>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        {daysInMonth.map((day) => {
                          const dayNum = day.getDate();
                          const status = calendarData[dayNum] || 'open';
                          return (
                            <button
                              key={dayNum}
                              onClick={() => toggleDateStatus(dayNum)}
                              className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${getStatusColor(status)} text-white`}
                            >
                              <span className="text-lg font-semibold">{dayNum}</span>
                              <span className="text-xs opacity-80">
                                {status === 'open' ? 'Open' : status === 'hold' ? 'Hold' : 'Booked'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Media Tab */}
                  <TabsContent value="media" className="mt-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Property Media</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Upload vertical photos and videos for best mobile experience
                          </p>
                        </div>
                        <Label className="cursor-pointer">
                          <Input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleMediaUpload}
                            disabled={uploading}
                          />
                          <Button variant="outline" className="cursor-pointer" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              {uploading ? 'Uploading...' : 'Upload Media'}
                            </span>
                          </Button>
                        </Label>
                      </div>

                      {selectedProperty.images.length === 0 && (!selectedProperty.videos || selectedProperty.videos.length === 0) ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No media yet</p>
                          <p className="text-sm text-gray-400">Upload photos and videos to showcase your property</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {selectedProperty.images.map((image, index) => (
                            <div key={`img-${index}`} className="relative group aspect-[3/4] rounded-lg overflow-hidden">
                              <img
                                src={image}
                                alt={`${selectedProperty.name} - Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => {
                                  const updatedImages = selectedProperty.images.filter((_, i) => i !== index);
                                  const updatedProperty = { ...selectedProperty, images: updatedImages };
                                  saveProperty(updatedProperty);
                                  loadProperties();
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {selectedProperty.videos?.map((video, index) => (
                            <div key={`vid-${index}`} className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-black">
                              <video
                                src={video}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Video className="w-8 h-8 text-white/70" />
                              </div>
                              <button
                                onClick={() => {
                                  const updatedVideos = selectedProperty.videos!.filter((_, i) => i !== index);
                                  const updatedProperty = { ...selectedProperty, videos: updatedVideos };
                                  saveProperty(updatedProperty);
                                  loadProperties();
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="mt-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-600">Property URL</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm">
                              {window.location.origin}/p/{selectedProperty.slug}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyPropertyLink(selectedProperty.slug)}
                            >
                              {copiedLink === selectedProperty.slug ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm text-gray-600">WhatsApp Number</Label>
                          <p className="text-sm font-medium mt-1">+{selectedProperty.whatsappNumber}</p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm text-gray-600">Price per Night</Label>
                          <p className="text-sm font-medium mt-1">
                            {selectedProperty.currency}{selectedProperty.pricePerNight.toLocaleString()}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm text-gray-600">Instagram</Label>
                          <p className="text-sm font-medium mt-1">
                            {selectedProperty.instagram ? `@${selectedProperty.instagram}` : 'Not provided'}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm text-gray-600">Created</Label>
                          <p className="text-sm font-medium mt-1">
                            {format(new Date(selectedProperty.createdAt), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
                <p className="text-gray-500 mb-6">Add your first property to get started</p>
                <Button onClick={() => setShowAddProperty(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Property Dialog */}
      <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Create a new booking page for your property
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProperty} className="space-y-4">
            <div>
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g., Villa Moonlight"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                placeholder="Describe your property..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={propertyLocation}
                onChange={(e) => setPropertyLocation(e.target.value)}
                placeholder="e.g., Goa, India"
              />
            </div>
            <div>
              <Label htmlFor="price">Price per Night (₹)</Label>
              <Input
                id="price"
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(e.target.value)}
                placeholder="4500"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp Number *</Label>
              <Input
                id="whatsapp"
                value={propertyWhatsapp}
                onChange={(e) => setPropertyWhatsapp(e.target.value)}
                placeholder="919876543210 (with country code)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Include country code without +</p>
            </div>
            <div>
              <Label htmlFor="instagram">Instagram Username</Label>
              <Input
                id="instagram"
                value={propertyInstagram}
                onChange={(e) => setPropertyInstagram(e.target.value)}
                placeholder="e.g., bookingresort"
              />
              <p className="text-xs text-gray-500 mt-1">Username without @ symbol</p>
            </div>
            <div>
              <Label htmlFor="mapLink">Google Maps Link</Label>
              <Input
                id="mapLink"
                value={propertyMapLink}
                onChange={(e) => setPropertyMapLink(e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AMENITIES_LIST.map((amenity) => (
                  <label key={`add-amn-${amenity.id}`} className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={propertyAmenities.includes(amenity.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPropertyAmenities([...propertyAmenities, amenity.id]);
                        } else {
                          setPropertyAmenities(propertyAmenities.filter(id => id !== amenity.id));
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <amenity.icon className="w-4 h-4 text-emerald-600" />
                      {amenity.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Media</Label>
              <div className="mt-2">
                <Label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                    disabled={uploading}
                  />
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload photos and videos'}
                    </span>
                  </div>
                </Label>
              </div>
              {(propertyImages.length > 0 || propertyVideos.length > 0) && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {propertyImages.map((image, index) => (
                    <div key={`add-img-${index}`} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={image} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {propertyVideos.map((video, index) => (
                    <div key={`add-vid-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-black">
                      <video src={video} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Video className="w-6 h-6 text-white/70" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddProperty(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              >
                Create Property
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={showEditProperty} onOpenChange={setShowEditProperty}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update your property details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProperty} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Property Name *</Label>
              <Input
                id="edit-name"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={propertyLocation}
                onChange={(e) => setPropertyLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price per Night (₹)</Label>
              <Input
                id="edit-price"
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-whatsapp">WhatsApp Number *</Label>
              <Input
                id="edit-whatsapp"
                value={propertyWhatsapp}
                onChange={(e) => setPropertyWhatsapp(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-instagram">Instagram Username</Label>
              <Input
                id="edit-instagram"
                value={propertyInstagram}
                onChange={(e) => setPropertyInstagram(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-mapLink">Google Maps Link</Label>
              <Input
                id="edit-mapLink"
                value={propertyMapLink}
                onChange={(e) => setPropertyMapLink(e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AMENITIES_LIST.map((amenity) => (
                  <label key={`edit-amn-${amenity.id}`} className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={propertyAmenities.includes(amenity.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPropertyAmenities([...propertyAmenities, amenity.id]);
                        } else {
                          setPropertyAmenities(propertyAmenities.filter(id => id !== amenity.id));
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <amenity.icon className="w-4 h-4 text-emerald-600" />
                      {amenity.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Media</Label>
              <div className="mt-2">
                <Label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                    disabled={uploading}
                  />
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Add more photos and videos'}
                    </span>
                  </div>
                </Label>
              </div>
              {(propertyImages.length > 0 || propertyVideos.length > 0) && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {propertyImages.map((image, index) => (
                    <div key={`edit-img-${index}`} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={image} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {propertyVideos.map((video, index) => (
                    <div key={`edit-vid-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-black">
                      <video src={video} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Video className="w-6 h-6 text-white/70" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditProperty(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
