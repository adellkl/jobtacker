import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [mode, setMode] = useState('login');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success('Vérifiez votre e-mail pour confirmer votre compte');
    };

    React.useEffect(() => {
        const m = searchParams.get('mode');
        if (m === 'signup') setMode('signup');
    }, [searchParams]);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success('Connecté');
        navigate('/');
    };

    const handleMagicLink = async () => {
        if (!email) return toast.error('Entrez votre e-mail');
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success('Lien magique envoyé à votre e-mail');
    };

    return (
        <div className="h-[calc(100vh-4rem)] bg-gray-50 flex flex-col overflow-y-auto md:overflow-hidden">
            <Helmet>
                <title>Connexion • JobTracker</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-3xl" />
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="hidden md:block">
                        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
                            <div className="relative p-8">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">JobTracker</span>
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">Reprenez le contrôle de vos candidatures</h2>
                                <p className="mt-3 text-gray-600">Centralisez vos opportunités, suivez vos avancées et visualisez vos statistiques en un clin d'œil.</p>
                                <ul className="mt-6 space-y-3 text-sm">
                                    <li className="flex items-center space-x-2"><span className="inline-block h-2 w-2 rounded-full bg-blue-600" /><span className="text-gray-700">Recherche multi-sources</span></li>
                                    <li className="flex items-center space-x-2"><span className="inline-block h-2 w-2 rounded-full bg-purple-600" /><span className="text-gray-700">Suivi des candidatures</span></li>
                                    <li className="flex items-center space-x-2"><span className="inline-block h-2 w-2 rounded-full bg-pink-600" /><span className="text-gray-700">Statistiques claires</span></li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-md ml-auto">
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-2xl font-bold text-gray-900">{mode === 'login' ? 'Connexion' : 'Inscription'}</h1>
                                    <div className="relative inline-flex bg-gray-100 rounded-lg p-1">
                                        <button type="button" onClick={() => setMode('login')} className={`px-3 py-1.5 text-sm rounded-md transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Log in</button>
                                        <button type="button" onClick={() => setMode('signup')} className={`px-3 py-1.5 text-sm rounded-md transition-all ${mode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Sign up</button>
                                    </div>
                                </div>
                                <p className="text-gray-600 mt-1">{mode === 'login' ? "Accédez à votre espace et continuez là où vous vous êtes arrêté." : "Créez votre compte en quelques secondes."}</p>
                            </div>

                            <form className="space-y-4" onSubmit={mode === 'login' ? handleSignIn : handleSignUp}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="nom@exemple.com"
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                        <button type="button" onClick={() => toast('Lien de réinitialisation envoyé si le compte existe')} className="text-xs text-blue-600 hover:text-blue-700">Mot de passe oublié ?</button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700"
                                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {mode === 'login' && (
                                    <div className="flex items-center justify-between">
                                        <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span>Se souvenir de moi</span>
                                        </label>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                    <button disabled={loading} type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
                                    {mode === 'login' ? (
                                        <button disabled={loading} onClick={handleMagicLink} type="button" className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 font-medium">Lien magique</button>
                                    ) : (
                                        <button type="button" onClick={() => setMode('login')} className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 font-medium">J'ai déjà un compte</button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Login;


