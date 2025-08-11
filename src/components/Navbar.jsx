import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home,
    Search,
    FileText,
    User,
    Menu,
    X,
    Briefcase,
    Bell,
    LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const { unreadCount, notifications, markAllRead } = useNotifications();
    const [openPanel, setOpenPanel] = useState(false);

    const navItems = [
        { path: '/', label: 'Tableau de bord', icon: Home },
        { path: '/search', label: 'Recherche', icon: Search },
        { path: '/applications', label: 'Candidatures', icon: FileText },
        { path: '/profile', label: 'Profil', icon: User },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            JobTracker
                        </span>
                    </Link>

                    {/* Navigation desktop */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {isActive(item.path) && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-blue-50 rounded-lg"
                                            initial={false}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative flex items-center space-x-2">
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Actions desktop */}
                    <div className="hidden md:flex items-center space-x-3">
                        <div className="relative">
                            <button onClick={() => { setOpenPanel(!openPanel); if (openPanel === false) markAllRead(); }} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-medium bg-red-600 text-white rounded-full">{unreadCount}</span>
                                )}
                            </button>
                            {openPanel && (
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">Notifications</span>
                                        <button onClick={() => setOpenPanel(false)} className="text-gray-500 text-sm hover:text-gray-700">Fermer</button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-sm text-gray-500">Aucune notification</div>
                                        ) : notifications.map((n) => (
                                            <div key={n.id} className={`px-4 py-3 text-sm ${n.read_at ? 'bg-white' : 'bg-blue-50'}`}>
                                                <p className="font-medium text-gray-900">{n.title}</p>
                                                {n.body && <p className="text-gray-600 mt-0.5">{n.body}</p>}
                                                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {user ? (
                            <>
                                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm sm:text-base font-medium">{user.email?.[0]?.toUpperCase() || 'U'}</span>
                                </div>
                                <button onClick={() => supabase.auth.signOut()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Se déconnecter">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Se connecter</Link>
                        )}
                    </div>

                    {/* Menu mobile button */}
                    <button
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Menu mobile */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="md:hidden bg-white border-t border-gray-200"
                >
                    <div className="px-4 py-2 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
