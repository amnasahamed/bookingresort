import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            try {
                const u = await getCurrentUser();
                if (mounted) {
                    setUser(u);
                }
            } catch (e) {
                console.error("Auth init failed", e);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            if (session) {
                try {
                    const u = await getCurrentUser();
                    if (mounted) setUser(u);
                } catch (e) {
                    console.error("Auth state change error:", e);
                    if (mounted) setUser(null);
                }
            } else {
                if (mounted) setUser(null);
            }
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
