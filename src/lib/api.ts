import { supabase } from './supabase';
import type { Property, DateStatus, User } from '@/types';

// Auth & Users
export async function getCurrentUser() {
    try {
        // Get user from localStorage (workaround for broken Supabase Auth)
        const stored = localStorage.getItem('auth_user');
        if (!stored) return null;
        
        const userData = JSON.parse(stored);
        // Check if session is still valid (not expired after 24 hours)
        if (Date.now() - userData.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('auth_user');
            return null;
        }

        return {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            name: userData.full_name || userData.name,
            createdAt: userData.createdAt || new Date().toISOString()
        };
    } catch {
        return null;
    }
}

export async function getUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data.map(mapUserFromDB) as User[];
}

export async function signOut() {
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new Event('auth-changed'));
}

export async function verifyPassword(email: string, password: string) {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
    }

    return data.user;
}

export async function inviteAdmin(email: string, name: string, role: 'admin' | 'superadmin' = 'admin') {
    // Check if user is logged in via localStorage
    const stored = localStorage.getItem('auth_user');
    if (!stored) {
        throw new Error('You must be logged in to invite admins.');
    }

    const currentUser = JSON.parse(stored);
    if (currentUser.role !== 'superadmin') {
        throw new Error('Only superadmins can invite new admins.');
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

    if (existingUser) {
        throw new Error('A user with this email already exists.');
    }

    // Create the new admin profile directly
    // Note: In production, you would send an email invitation instead
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            email: email.toLowerCase(),
            full_name: name,
            role: role,
            // Password hash for 'admin123' - user should change this
            password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message || 'Failed to create admin account.');
    }

    return { 
        success: true, 
        message: `Admin account created for ${email}. Default password is 'admin123'.`,
        user: data 
    };
}

// Properties
export async function getProperties() {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapPropertyFromDB) as Property[];
}

export async function getPropertyBySlug(slug: string) {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .single();
    if (error || !data) return null;
    return mapPropertyFromDB(data) as Property;
}

export async function saveProperty(property: Partial<Property>, adminId: string) {
    const { id, ...rest } = property;
    const dbProp = mapPropertyToDB({ ...rest, adminId });

    if (id && !id.startsWith('new_')) {
        const { data, error } = await supabase
            .from('properties')
            .update(dbProp)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return mapPropertyFromDB(data) as Property;
    } else {
        const { data, error } = await supabase
            .from('properties')
            .insert({ ...dbProp, id: undefined })
            .select()
            .single();
        if (error) throw error;
        return mapPropertyFromDB(data) as Property;
    }
}

export async function deleteProperty(id: string) {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
}

// Calendars
export async function getMonthCalendar(propertyId: string, year: number, month: number) {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('calendars')
        .select('date, status')
        .eq('property_id', propertyId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) throw error;

    const result: Record<number, DateStatus> = {};
    data.forEach((row: any) => {
        const day = parseInt(row.date.split('-')[2], 10);
        result[day] = row.status as DateStatus;
    });

    return result;
}

export async function setDateStatus(propertyId: string, date: string, status: DateStatus) {
    // Try to update or insert
    const { error } = await supabase
        .from('calendars')
        .upsert(
            { property_id: propertyId, date, status },
            { onConflict: 'property_id, date' }
        );
    if (error) throw error;
}

// Media Storage
export async function uploadMedia(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `properties/${fileName}`;

    const { error } = await supabase.storage.from('media').upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
}

// Helpers
function mapPropertyFromDB(dbParam: any): Property {
    return {
        id: dbParam.id,
        adminId: dbParam.admin_id,
        slug: dbParam.slug,
        name: dbParam.name,
        description: dbParam.description || '',
        location: dbParam.location,
        pricePerNight: dbParam.price_per_night,
        currency: dbParam.currency,
        whatsappNumber: dbParam.whatsapp_number,
        instagram: dbParam.instagram,
        mapLink: dbParam.map_link,
        amenities: dbParam.amenities || [],
        images: dbParam.images || [],
        videos: dbParam.videos || [],
        createdAt: dbParam.created_at,
        updatedAt: dbParam.updated_at,
    };
}

function mapPropertyToDB(prop: any) {
    return {
        admin_id: prop.adminId,
        slug: prop.slug,
        name: prop.name,
        description: prop.description,
        location: prop.location,
        price_per_night: prop.pricePerNight,
        currency: prop.currency,
        whatsapp_number: prop.whatsappNumber,
        instagram: prop.instagram,
        map_link: prop.mapLink,
        amenities: prop.amenities,
        images: prop.images,
        videos: prop.videos,
    };
}
function mapUserFromDB(dbUser: any): User {
    return {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.full_name || dbUser.name || 'No Name',
        createdAt: dbUser.created_at || new Date().toISOString(),
    };
}
