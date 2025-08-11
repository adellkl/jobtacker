import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) return toast.error(error.message);
        toast.success('Vérifiez votre e-mail pour confirmer votre compte');
    };

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

    // OAuth désactivé

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Connexion</h1>
                <form className="space-y-4" onSubmit={handleSignIn}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Se connecter</button>
                        <button disabled={loading} onClick={handleSignUp} type="button" className="px-4 py-2 text-blue-600 hover:text-blue-700">Créer un compte</button>
                        <button disabled={loading} onClick={handleMagicLink} type="button" className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Lien magique</button>
                    </div>
                </form>
                {/* OAuth désactivé */}
            </div>
        </div>
    );
};

export default Login;


