import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import JobSearch from './pages/JobSearch';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Stats from './pages/Stats';
import { JobProvider } from './context/JobContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? children : <Navigate to="/login" replace />;
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
    return (
        <AuthProvider>
            <NotificationProvider>
                <JobProvider>
                    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                        <Navbar />
                        <main className="pt-16">
                            <AnimatePresence mode="wait" initial={false}>
                                <Routes location={location} key={location.pathname}>
                                    <Route
                                        path="/login"
                                        element={
                                            <PageTransition>
                                                <Login />
                                            </PageTransition>
                                        }
                                    />
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
                                    <Route
                                        path="/search"
                                        element={
                                            <PageTransition>
                                                <PrivateRoute>
                                                    <JobSearch />
                                                </PrivateRoute>
                                            </PageTransition>
                                        }
                                    />
                                    <Route
                                        path="/applications"
                                        element={
                                            <PageTransition>
                                                <PrivateRoute>
                                                    <Applications />
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
                        <Footer />
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
                </JobProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;