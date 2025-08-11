import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import { searchJobsExternal } from '../services/jobApi'

const AlertsContext = createContext(null)

export const AlertsProvider = ({ children }) => {
    const { user } = useAuth()
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let channel
        const load = async () => {
            if (!user) { setAlerts([]); return }
            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (!error && Array.isArray(data)) setAlerts(data)
            channel = supabase.channel('alerts_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `user_id=eq.${user.id}` }, (payload) => {
                    setAlerts((prev) => {
                        if (payload.eventType === 'INSERT') return [payload.new, ...prev]
                        if (payload.eventType === 'UPDATE') return prev.map(a => a.id === payload.new.id ? payload.new : a)
                        if (payload.eventType === 'DELETE') return prev.filter(a => a.id !== payload.old.id)
                        return prev
                    })
                })
                .subscribe()
        }
        load()
        return () => { if (channel) supabase.removeChannel(channel) }
    }, [user?.id])

    const createAlert = async ({ query = '', filters = {} }) => {
        if (!user) return
        const { data, error } = await supabase
            .from('alerts')
            .insert({ user_id: user.id, query, filters })
            .select('*')
            .single()
        if (!error && data) setAlerts(prev => [data, ...prev])
    }

    const deleteAlert = async (id) => {
        await supabase.from('alerts').delete().eq('id', id)
    }

    const loadUserPreferences = async () => {
        if (!user) return {}
        // Essayer de lire depuis infouser.data.preferences
        const { data, error } = await supabase
            .from('infouser')
            .select('data')
            .eq('user_id', user.id)
            .maybeSingle()
        if (!error && data && data.data && typeof data.data === 'object') {
            return data.data.preferences || {}
        }
        return {}
    }

    const runAlertNow = async (alertId) => {
        if (!user) return
        const alert = alerts.find(a => a.id === alertId)
        if (!alert) return
        setLoading(true)
        try {
            const results = await searchJobsExternal(alert.query || '', alert.filters || {})
            const newCount = Array.isArray(results) ? results.length : 0
            const { error: upErr } = await supabase
                .from('alerts')
                .update({ last_run_at: new Date().toISOString(), last_results_count: newCount })
                .eq('id', alertId)
                .eq('user_id', user.id)
            if (!upErr && newCount > (alert.last_results_count || 0)) {
                const prefs = await loadUserPreferences()
                const allowAlerts = prefs.jobAlerts !== false // défaut: autorisé
                if (allowAlerts) {
                    const diff = newCount - (alert.last_results_count || 0)
                    await supabase.from('notifications').insert({
                        user_id: user.id,
                        type: 'alert',
                        title: `Nouvelle alerte: ${diff} offre(s) trouvée(s)`,
                        body: (alert.query || '').slice(0, 140)
                    })
                }
            }
        } finally {
            setLoading(false)
        }
    }

    // Exécution périodique simple côté client pendant la session (toutes les 10 min)
    useEffect(() => {
        if (!user) return
        const id = setInterval(() => {
            alerts.forEach(a => runAlertNow(a.id))
        }, 10 * 60 * 1000)
        return () => clearInterval(id)
    }, [user?.id, alerts.map(a => a.id).join(',')])

    return (
        <AlertsContext.Provider value={{ alerts, loading, createAlert, deleteAlert, runAlertNow }}>
            {children}
        </AlertsContext.Provider>
    )
}

export const useAlerts = () => useContext(AlertsContext)
