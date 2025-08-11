import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building, MapPin, Globe, Bookmark, Check, ExternalLink, Trash2 } from 'lucide-react'
import { useJobContext } from '../context/JobContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { sanitizeUrl } from '../lib/security'

const PAGE_SIZE = 6

const Favorites = () => {
    const { toggleSaveJob } = useJobContext()
    const { user } = useAuth()
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            if (!user) {
                setFavorites([])
                setLoading(false)
                return
            }
            const { data, error } = await supabase
                .from('saved_jobs')
                .select('job_id, job_data')
                .order('saved_at', { ascending: false })
            if (!error && Array.isArray(data)) {
                const mapped = data.map(r => ({ id: r.job_id, ...(r.job_data || {}) }))
                setFavorites(mapped)
            } else {
                setFavorites([])
            }
            setLoading(false)
            setPage(1)
        }
        load()
    }, [user])

    const totalPages = Math.max(1, Math.ceil(favorites.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const startIdx = (currentPage - 1) * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    const pageFavorites = favorites.slice(startIdx, endIdx)

    const handleToggleSave = async (jobId) => {
        await toggleSaveJob(jobId)
        setFavorites(prev => {
            const next = prev.filter(j => j.id !== jobId)
            // Ajuster la page si elle devient vide après suppression
            const newTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE))
            if (currentPage > newTotalPages) setPage(newTotalPages)
            else if (next.length > 0 && startIdx >= next.length) setPage(Math.max(1, currentPage - 1))
            return next
        })
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Chargement des favoris...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Favoris</h1>
                <p className="text-gray-600">Vos annonces sauvegardées</p>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun favori</h3>
                    <p className="text-gray-600">Ajoutez des annonces à vos favoris depuis la recherche.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence>
                            {pageFavorites.map((job, index) => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="bg-white rounded-xl shadow border border-gray-200/60 overflow-hidden hover:shadow-md transition-all"
                                >
                                    <div className="px-5 pt-5">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{job.title || 'Poste'}</h3>
                                                <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                                                    <span className="inline-flex items-center space-x-1"><Building className="w-4 h-4" /><span>{job.company || 'Entreprise'}</span></span>
                                                    <span className="inline-flex items-center space-x-1"><MapPin className="w-4 h-4" /><span>{job.location || '—'}</span></span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleSave(job.id)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-medium transition-colors"
                                                    aria-label="Supprimer des favoris"
                                                    title="Supprimer des favoris"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Supprimer</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Globe className="w-4 h-4" />
                                                <span>{job.source || '—'}</span>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {(job.description || '').replace(/<[^>]*>/g, ' ')}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">{job.experience || ''}</span>
                                            <div className="flex items-center space-x-2">
                                                <a
                                                    href={sanitizeUrl(job.url)}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center mt-6 space-x-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-2 border rounded-lg text-sm ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Précédent
                            </button>
                            <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-2 border rounded-lg text-sm ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Favorites
