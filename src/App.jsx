import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Preview from './pages/Preview';
import NotFound from './pages/NotFound';

import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Stats from './pages/Stats';
import Favorites from './pages/Favorites';
import { JobProvider } from './context/JobContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AlertsProvider } from './context/AlertsContext';
import Login from './pages/Login';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/preview" replace />;
}

function PageTransition({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}

function App() {
    const location = useLocation();
    const hideFooter = location.pathname === '/login';
    return (
        <AuthProvider>
            <NotificationProvider>
                <JobProvider>
                    <AlertsProvider>
                        <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
                            <Helmet>
                                <title>JobTracker</title>
                                <link rel="canonical" href={window.location.href} />
                            </Helmet>
                            <Navbar />
                            <main className="flex-1 pt-16">
                                <AnimatePresence mode="wait" initial={false}>
                                    <Routes location={location} key={location.pathname}>
                                        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                                        <Route
                                            path="/"
                                            element={
                                                <PageTransition>
                                                    <PrivateRoute>
                                                        <Dashboard />
                                                    </PrivateRoute>
                                                </PageTransition>
                                            }
                                        />
                                        <Route path="/preview" element={<PageTransition><Preview /></PageTransition>} />
                                        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />

                                        <Route
                                            path="/candidatures"
                                            element={
                                                <PageTransition>
                                                    <PrivateRoute>
                                                        <Applications />
                                                    </PrivateRoute>
                                                </PageTransition>
                                            }
                                        />
                                        <Route
                                            path="/favorites"
                                            element={
                                                <PageTransition>
                                                    <PrivateRoute>
                                                        <Favorites />
                                                    </PrivateRoute>
                                                </PageTransition>
                                            }
                                        />
                                        <Route
                                            path="/profile"
                                            element={
                                                <PageTransition>
                                                    <PrivateRoute>
                                                        <Profile />
                                                    </PrivateRoute>
                                                </PageTransition>
                                            }
                                        />
                                        <Route
                                            path="/stats"
                                            element={
                                                <PageTransition>
                                                    <PrivateRoute>
                                                        <Stats />
                                                    </PrivateRoute>
                                                </PageTransition>
                                            }
                                        />
                                    </Routes>
                                </AnimatePresence>
                            </main>
                            {!hideFooter && <Footer />}
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    duration: 4000,
                                    style: {
                                        background: '#363636',
                                        color: '#fff',
                                    },
                                }}
                            />
                        </div>
                    </AlertsProvider>
                </JobProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;