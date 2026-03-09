// BookPage Types

export type DateStatus = 'open' | 'hold' | 'booked';

export interface Property {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  currency: string;
  whatsappNumber: string;
  instagram?: string;
  images: string[];
  videos?: string[];
  video?: string;
  amenities?: string[];
  mapLink?: string;
  roomTypes?: RoomType[];
  adminId?: string; // Links property to an admin
  createdAt: string;
  updatedAt: string;
}

export type Role = 'superadmin' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
  createdAt: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
}

export interface DateEntry {
  date: string; // YYYY-MM-DD format
  status: DateStatus;
  propertyId: string;
  roomTypeId?: string;
}

export interface BookingCalendar {
  propertyId: string;
  dates: Record<string, DateStatus>; // key: YYYY-MM-DD, value: status
}

export interface AuthUser {
  user: User | null;
  isAuthenticated: boolean;
}

export interface BookingRequest {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType?: string;
  propertyName: string;
  pricePerNight: number;
}

// Demo data
export const DEMO_PROPERTIES: Property[] = [
  {
    id: '1',
    slug: 'villa-moonlight',
    name: 'Villa Moonlight',
    description: 'A serene hillside retreat with panoramic ocean views, private pool, and modern amenities. Perfect for couples seeking tranquility.',
    location: 'Goa, India',
    pricePerNight: 4500,
    currency: '₹',
    whatsappNumber: '919876543210',
    instagram: 'villamoonlight',
    images: [],
    videos: [],
    amenities: ['wifi', 'pool', 'ac', 'parking', 'balcony'],
    mapLink: 'https://maps.google.com/?q=Goa',
    roomTypes: [
      { id: 'r1', name: 'Deluxe Suite', description: 'King bed, ocean view, private balcony', pricePerNight: 4500, maxGuests: 2 },
      { id: 'r2', name: 'Garden Room', description: 'Queen bed, garden access', pricePerNight: 3500, maxGuests: 2 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'treehouse-retreat',
    name: 'Treehouse Retreat',
    description: 'Elevated living among the canopy. Wake up to birdsong and misty mountain views in this eco-friendly sanctuary.',
    location: 'Kerala, India',
    pricePerNight: 3200,
    currency: '₹',
    whatsappNumber: '919876543210',
    instagram: 'treehouseretreat',
    images: [],
    videos: [],
    amenities: ['wifi', 'balcony'],
    mapLink: 'https://maps.google.com/?q=Kerala',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
