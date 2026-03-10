import { supabase } from './supabase';
import type { Property, DateStatus, User } from '@/types';

// Auth & Users
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return profile as User | null;
}

export async function getUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data as User[];
}

export async function signOut() {
    await supabase.auth.signOut();
}

export async function inviteAdmin(email: string, name: string, role: 'admin' | 'superadmin' = 'admin') {
    // Get the current session token to pass to the edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, name, role }),
    });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await res.json();
    } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}...`);
    }

    if (!res.ok) {
        console.error('Invite admin error:', data);
        throw new Error(data.error || 'Failed to send invite');
    }
    return data;
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
