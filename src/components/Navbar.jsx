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

    const isPreview = location.pathname === '/preview';
    const isLogin = location.pathname.startsWith('/login');
    const isAuthenticated = Boolean(user);
    const navItems = isLogin
        ? []
        : isPreview
            ? (
                isAuthenticated
                    ? [
                        { path: '/', label: 'Tableau de bord', icon: Home },
                        { path: '/search', label: 'Recherche', icon: Search },
                        { path: '/applications', label: 'Candidatures', icon: FileText },
                        { path: '/profile', label: 'Profil', icon: User },
                    ]
                    : [] // login/signup seront affichés à droite
            )
            : [
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

                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            JobTracker
                        </span>
                    </Link>


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


                    <div className="hidden md:flex items-center space-x-3">
                        {(!isPreview || isLogin) && (
                            <Link
                                to="/preview"
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${isPreview ? 'border-blue-200 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                Preview
                            </Link>
                        )}
                        {!isAuthenticated && isPreview && (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50">Log in</Link>
                                <Link to="/login?mode=signup" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Sign up</Link>
                            </div>
                        )}
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
                            isPreview || isLogin ? null : <Link to="/login" className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Se connecter</Link>
                        )}
                    </div>


                    <button
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>


            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="md:hidden bg-white border-t border-gray-200"
                >
                    <div className="px-4 py-2 space-y-1">
                        {isLogin ? (
                            <Link
                                to="/preview"
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${isActive('/preview') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Home className="w-5 h-5" />
                                <span>Preview</span>
                            </Link>
                        ) : (
                            (navItems.length ? navItems : (!isAuthenticated && isPreview ? [
                                { path: '/login', label: 'Log in', icon: User },
                                { path: '/login?mode=signup', label: 'Sign up', icon: User },
                            ] : [])).map((item) => {
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
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
