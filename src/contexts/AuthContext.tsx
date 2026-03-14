import { createContext, useContext, useEffect, useState, useRef } from 'react';
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
    const initializingRef = useRef(false);

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            // Prevent concurrent initialization
            if (initializingRef.current) return;
            initializingRef.current = true;

            try {
                // Add small delay to let any pending auth operations complete
                await new Promise(resolve => setTimeout(resolve, 50));
                const u = await getCurrentUser();
                if (mounted) {
                    setUser(u);
                }
            } catch (e) {
                console.error("Auth init failed", e);
            } finally {
                if (mounted) setLoading(false);
                initializingRef.current = false;
            }
        }

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            // Debounce rapid auth state changes
            await new Promise(resolve => setTimeout(resolve, 50));

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
