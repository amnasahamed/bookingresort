import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshUser: async () => {} });

// Global lock to prevent concurrent auth operations
let authOperationInProgress = false;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const isProcessingRef = useRef(false);

    const refreshUser = useCallback(async () => {
        // Wait for any pending auth operation
        while (authOperationInProgress) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            // Wait for auth state to settle
            await new Promise(resolve => setTimeout(resolve, 200));
            const u = await getCurrentUser();
            setUser(u);
        } catch (e) {
            console.error("Refresh user failed", e);
            setUser(null);
        } finally {
            isProcessingRef.current = false;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
                // Longer initial delay to let browser settle
                await new Promise(resolve => setTimeout(resolve, 300));
                const u = await getCurrentUser();
                if (mounted) {
                    setUser(u);
                }
            } catch (e) {
                console.error("Auth init failed", e);
            } finally {
                if (mounted) setLoading(false);
                isProcessingRef.current = false;
            }
        }

        initializeAuth();

        // Use a simpler auth state listener - just trigger a delayed refresh
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (!mounted) return;

            // Don't process during sign in/sign out operations
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                // Wait longer for the operation to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                if (!mounted) return;
                
                try {
                    const u = await getCurrentUser();
                    if (mounted) setUser(u);
                } catch (e) {
                    console.error("Auth state change error:", e);
                    if (mounted) setUser(null);
                }
                if (mounted) setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
