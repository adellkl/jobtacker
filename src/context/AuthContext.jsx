import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const ensureProfile = async () => {
            if (!user) return;
            const { data, error } = await supabase.from('profiles').select('user_id').eq('user_id', user.id).maybeSingle();
            if (!error && !data) {
                await supabase.from('profiles').insert({ user_id: user.id, full_name: user.email, avatar_url: null });
            }
        };
        ensureProfile();
    }, [user]);

    const value = { user, loading };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


