// Local Storage Utilities for BookPage

import type { Property, DateStatus, BookingCalendar, User } from '@/types';
import { DEMO_PROPERTIES } from '@/types';

const STORAGE_KEYS = {
  PROPERTIES: 'bookpage_properties',
  CALENDARS: 'bookpage_calendars',
  AUTH_USER: 'bookpage_auth_user',
  USERS: 'bookpage_users',
};

// Initialize with demo data if empty
export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.PROPERTIES)) {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(DEMO_PROPERTIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CALENDARS)) {
    const defaultCalendar: Record<string, BookingCalendar> = {};
    DEMO_PROPERTIES.forEach(prop => {
      defaultCalendar[prop.id] = { propertyId: prop.id, dates: {} };
    });
    localStorage.setItem(STORAGE_KEYS.CALENDARS, JSON.stringify(defaultCalendar));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    // Default superadmin user
    const defaultUsers: User[] = [
      {
        id: 'superadmin-1',
        email: 'superadmin@bookpage.com',
        role: 'superadmin',
        name: 'Super Admin',
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
}

// Properties
export function getProperties(): Property[] {
  const data = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
  return data ? JSON.parse(data) : [];
}

export function getPropertyBySlug(slug: string): Property | undefined {
  const properties = getProperties();
  return properties.find(p => p.slug === slug);
}

export function getPropertyById(id: string): Property | undefined {
  const properties = getProperties();
  return properties.find(p => p.id === id);
}

export function saveProperty(property: Property): void {
  const properties = getProperties();
  const index = properties.findIndex(p => p.id === property.id);
  if (index >= 0) {
    properties[index] = { ...property, updatedAt: new Date().toISOString() };
  } else {
    properties.push(property);
  }
  localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
}

export function deleteProperty(id: string): void {
  const properties = getProperties().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));

  // Also delete associated calendar
  const calendars = getCalendars();
  delete calendars[id];
  localStorage.setItem(STORAGE_KEYS.CALENDARS, JSON.stringify(calendars));
}

export function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const properties = getProperties();
  let slug = base;
  let counter = 1;
  while (properties.some(p => p.slug === slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

// Calendars
export function getCalendars(): Record<string, BookingCalendar> {
  const data = localStorage.getItem(STORAGE_KEYS.CALENDARS);
  return data ? JSON.parse(data) : {};
}

export function getCalendar(propertyId: string): BookingCalendar {
  const calendars = getCalendars();
  return calendars[propertyId] || { propertyId, dates: {} };
}

export function setDateStatus(propertyId: string, date: string, status: DateStatus): void {
  const calendars = getCalendars();
  if (!calendars[propertyId]) {
    calendars[propertyId] = { propertyId, dates: {} };
  }
  calendars[propertyId].dates[date] = status;
  localStorage.setItem(STORAGE_KEYS.CALENDARS, JSON.stringify(calendars));

  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('calendar:updated', {
    detail: { propertyId, date, status }
  }));
}

export function getDateStatus(propertyId: string, date: string): DateStatus {
  const calendar = getCalendar(propertyId);
  return calendar.dates[date] || 'open';
}

export function getMonthCalendar(propertyId: string, year: number, month: number): Record<number, DateStatus> {
  const calendar = getCalendar(propertyId);
  const result: Record<number, DateStatus> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    result[day] = calendar.dates[dateStr] || 'open';
  }

  return result;
}

// Mock User Management & Auth
export function getUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User): void {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Simple mock for authentication
export function getAuthenticatedUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
  return data ? JSON.parse(data) : null;
}

export function setAuthenticatedUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
}

// Retained for backward compat in UI mock
export function checkAdminPassword(password: string): boolean {
  return password === 'admin123';
}

export function isAdminAuthenticated(): boolean {
  const user = getAuthenticatedUser();
  return user !== null && user.role === 'admin';
}

export function isSuperadminAuthenticated(): boolean {
  const user = getAuthenticatedUser();
  return user !== null && user.role === 'superadmin';
}

// Image storage (using base64 for demo - in production use Vercel Blob)
export async function storeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function removeImage(imageUrl: string, propertyId: string): void {
  const property = getPropertyById(propertyId);
  if (property) {
    property.images = property.images.filter(img => img !== imageUrl);
    saveProperty(property);
  }
}
