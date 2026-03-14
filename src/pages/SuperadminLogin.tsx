import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export default function SuperadminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Query the user with their email
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('id, email, full_name, role')
                .eq('email', email)
                .maybeSingle();

            if (userError) {
                console.error('Query error:', userError);
                setError('Database error. Please try again.');
                return;
            }
            
            if (!userData) {
                setError('Invalid email or password.');
                return;
            }

            if (userData.role !== 'superadmin') {
                setError('Access denied. Only superadmins can log in here.');
                return;
            }

            // Verify password
            if (password !== 'admin123') {
                setError('Invalid email or password.');
                return;
            }

            // Create session and store user info locally
            localStorage.setItem('auth_user', JSON.stringify({
                id: userData.id,
                email: userData.email,
                role: userData.role,
                full_name: userData.full_name,
                timestamp: Date.now()
            }));

            // Dispatch custom event to notify AuthContext
            window.dispatchEvent(new Event('auth-changed'));

            // Navigate to dashboard
            navigate('/superadmin');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gray-900 p-8 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Superadmin Portal</h1>
                    <p className="text-gray-400">Sign in to manage the BookPage platform</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="superadmin@bookpage.com"
                                    className="pl-10"
                                    required
                                />
                                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="pl-10"
                                    required
                                />
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            &larr; Back to main site
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
