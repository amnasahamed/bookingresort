import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { User } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true, 
    refreshUser: async () => {},
    logout: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const isProcessingRef = useRef(false);

    // Get current user from localStorage (workaround for broken Supabase Auth)
    const getCurrentUserLocal = useCallback((): User | null => {
        try {
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
        } catch (e) {
            console.error('[v0] Failed to parse auth_user:', e);
            return null;
        }
    }, []);

    const refreshUser = useCallback(async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            const u = getCurrentUserLocal();
            setUser(u);
        } catch (e) {
            console.error('[v0] Refresh user failed', e);
            setUser(null);
        } finally {
            isProcessingRef.current = false;
        }
    }, [getCurrentUserLocal]);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_user');
        setUser(null);
        console.log('[v0] User logged out');
    }, []);

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
                await new Promise(resolve => setTimeout(resolve, 100));
                const u = getCurrentUserLocal();
                if (mounted) {
                    setUser(u);
                    setLoading(false);
                }
            } catch (e) {
                console.error('[v0] Auth init failed', e);
                if (mounted) setLoading(false);
            } finally {
                isProcessingRef.current = false;
            }
        }

        initializeAuth();

        // Listen for custom auth change events
        const handleAuthChange = () => {
            if (mounted) {
                console.log('[v0] Auth changed, refreshing user');
                const u = getCurrentUserLocal();
                setUser(u);
            }
        };

        window.addEventListener('auth-changed', handleAuthChange);

        return () => {
            mounted = false;
            window.removeEventListener('auth-changed', handleAuthChange);
        };
    }, [getCurrentUserLocal]);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
