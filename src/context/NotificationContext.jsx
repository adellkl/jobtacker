import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let channel;
        const load = async () => {
            if (!user) { setNotifications([]); setUnreadCount(0); return; }
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (!error) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read_at).length);
            }
            channel = supabase.channel('notif_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                    }
                    setUnreadCount(prev => {
                        const list = (payload.eventType === 'INSERT') ? [payload.new, ...notifications] : notifications;
                        return list.filter(n => !n.read_at).length;
                    });
                })
                .subscribe();
        };
        load();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [user?.id]);

    const markAllRead = async () => {
        if (!user) return;
        await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    };

    const value = { notifications, unreadCount, markAllRead };
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => useContext(NotificationContext);


