import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Building2, LogOut, Plus, Mail, ShieldCheck, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getUsers, getProperties, signOut } from '@/lib/api';
import type { User, Property } from '@/types';

export default function SuperadminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<User[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [u, p] = await Promise.all([getUsers(), getProperties()]);
            setUsers(u);
            setProperties(p);
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/superadmin/login');
    };

    const getAdminForProperty = (adminId?: string) => {
        if (!adminId) return 'Unassigned';
        return users.find(u => u.id === adminId)?.email || 'Unknown';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 left-0">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                        <ShieldCheck className="w-8 h-8" />
                        <h1 className="text-xl font-bold">BookPage OS</h1>
                    </div>
                    <p className="text-xs text-gray-500 tracking-wider font-semibold uppercase">Superadmin Portal</p>
                </div>

                <Separator className="bg-gray-800" />

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        Users & Admins
                    </button>

                    <button
                        onClick={() => setActiveTab('properties')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'properties' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        <Building2 className="w-5 h-5" />
                        All Properties
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="bg-gray-800 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shadow-lg">
                                SA
                            </div>
                            <div>
                                <p className="text-sm font-medium leading-none text-white shadow-sm">Super Admin</p>
                                <p className="text-xs text-gray-400 mt-1">Platform Admin</p>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="pl-64 flex-1">
                <div className="p-8 max-w-7xl mx-auto h-full space-y-8">

                    {/* Header */}
                    <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {activeTab === 'users' ? 'Platform Users' : 'Platform Properties'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {activeTab === 'users'
                                    ? `Manage all ${users.length} users across the platform`
                                    : `Monitor ${properties.length} total properties active on the system`}
                            </p>
                        </div>
                        {activeTab === 'users' && (
                            <Button
                                onClick={() => window.open('https://supabase.com/dashboard/project/oscahatwnwgnccejrwft/auth/users', '_blank')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Manage Users in Supabase
                            </Button>
                        )}
                    </div>

                    {/* Users View */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">User Details</th>
                                            <th className="px-6 py-4 font-medium">Role</th>
                                            <th className="px-6 py-4 font-medium">Joined Date</th>
                                            <th className="px-6 py-4 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${user.role === 'superadmin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                                                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{user.name || 'No Name'}</p>
                                                            <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant="secondary"
                                                        className={user.role === 'superadmin' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}
                                                    >
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                                                        <Key className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Properties View */}
                    {activeTab === 'properties' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Property Details</th>
                                            <th className="px-6 py-4 font-medium">Location & Price</th>
                                            <th className="px-6 py-4 font-medium">Assigned Admin</th>
                                            <th className="px-6 py-4 font-medium">Created (System)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {properties.map(property => (
                                            <tr key={property.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-200"
                                                            style={{ backgroundImage: `url(${property.images[0] || ''})` }}>
                                                            {!property.images[0] && <Building2 className="w-6 h-6 m-auto mt-3 text-gray-400" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{property.name}</p>
                                                            <a href={`/p/${property.slug}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-xs mt-1 inline-block">
                                                                /p/{property.slug}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-900 font-medium">{property.currency}{property.pricePerNight}</p>
                                                    <p className="text-gray-500 text-xs mt-1">{property.location}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="text-gray-600 bg-gray-50">
                                                        {getAdminForProperty(property.adminId)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {new Date(property.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {properties.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                    <p>No properties have been created on the platform yet.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
