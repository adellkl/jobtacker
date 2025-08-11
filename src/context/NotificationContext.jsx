import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [prefs, setPrefs] = useState({})

    useEffect(() => {
        const loadPrefs = async () => {
            if (!user) { setPrefs({}); return }
            const { data } = await supabase.from('infouser').select('data').eq('user_id', user.id).maybeSingle()
            const p = (data && data.data && data.data.preferences) || {}
            setPrefs(p)
        }
        loadPrefs()
    }, [user?.id])

    useEffect(() => {
        let channel;
        const load = async () => {
            if (!user) { setNotifications([]); setUnreadCount(0); return; }
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                setNotifications(data);
            } else {
                setNotifications([])
            }
            channel = supabase.channel('notif_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
                    setNotifications((prev) => {
                        const shouldKeep = (n) => {
                            if (n.type === 'alert' && prefs.jobAlerts === false) return false
                            return true
                        }
                        if (payload.eventType === 'INSERT') {
                            const next = [payload.new, ...prev]
                            return next.filter(shouldKeep)
                        }
                        if (payload.eventType === 'UPDATE') return prev.map(n => n.id === payload.new.id ? payload.new : n)
                        if (payload.eventType === 'DELETE') return prev.filter(n => n.id !== payload.old.id)
                        return prev
                    });
                })
                .subscribe();
        };
        load();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [user?.id, prefs.jobAlerts]);

    useEffect(() => {
        setUnreadCount((notifications || []).filter(n => !n.read_at).length);
    }, [notifications]);

    const markAllRead = async () => {
        if (!user) return;
        setNotifications((prev) => prev.map(n => n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
        try {
            await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
        } catch { }
    };

    const value = { notifications, unreadCount, markAllRead };
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => useContext(NotificationContext);


