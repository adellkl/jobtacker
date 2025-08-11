import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    MapPin,
    Building,
    Clock,
    DollarSign,
    Briefcase,
    Globe,
    Star,
    Bookmark,
    ExternalLink,
    X,
    Check
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { Helmet } from 'react-helmet-async';
import { sanitizeUrl } from '../lib/security';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const JobSearch = () => {
    const { searchResults, loading, filters, setFilters, searchJobs, addApplication, toggleSaveJob, error } = useJobContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('recent');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 6;
    const [selectedJob, setSelectedJob] = useState(null);
    const sources = ['LinkedIn', 'Welcome to the Jungle', 'Monster', 'Indeed'];
    const contractTypes = ['CDI', 'CDD', 'Intérim', 'Alternance', 'Stage'];

    useEffect(() => {
        if (searchQuery || Object.values(filters).some(v => v)) {
            searchJobs(searchQuery, filters);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, filters, sortBy]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        searchJobs(searchQuery, filters);
    };

    const handleApply = (job) => {
        addApplication(job.id, job);
        toast.success(`Candidature envoyée pour ${job.title} chez ${job.company}`);
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({
            location: '',
            remote: false,
            experience: '',
            salary: '',
            company: '',
            keywords: '',
            source: '',
            type: ''
        });
        setSearchQuery('');
    };

    const extractSalary = (s) => {
        if (!s) return 0;
        const match = String(s).match(/(\d+)k/);
        return match ? parseInt(match[1], 10) : 0;
    };

    const sortedJobs = [...searchResults].sort((a, b) => {
        switch (sortBy) {
            case 'recent':
                return new Date(b.postedAt) - new Date(a.postedAt);
            case 'salary':
                return extractSalary(b.salary) - extractSalary(a.salary);
            case 'company':
                return a.company.localeCompare(b.company);
            default:
                return 0;
        }
    });

    const baseFiltered = sortedJobs.filter(job => {
        if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        if (filters.remote && !job.remote) return false;
        if (filters.experience && job.experience !== filters.experience) return false;
        if (filters.company && !job.company.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.keywords && !job.title.toLowerCase().includes(filters.keywords.toLowerCase())) return false;
        if (filters.source && job.source !== filters.source) return false;
        if (filters.type && job.type !== filters.type) return false;
        if (filters.salaryMin && extractSalary(job.salary) < Number(filters.salaryMin)) return false;
        if (filters.savedOnly && !job.saved) return false;
        if (filters.datePosted) {
            const days = { '24h': 1, '7d': 7, '14d': 14, '30d': 30 }[filters.datePosted] || 0;
            if (days > 0) {
                const since = Date.now() - days * 24 * 60 * 60 * 1000;
                if (new Date(job.postedAt).getTime() < since) return false;
            }
        }
        return true;
    });
    const filteredJobs = baseFiltered;

    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageJobs = filteredJobs.slice(startIdx, endIdx);

    const stripHtml = (html) => {
        if (!html) return '';
        return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    };
    const sanitize = (html) => DOMPurify.sanitize(html || '', {
        ALLOWED_TAGS: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'span', 'div', 'b', 'i', 'u', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class']
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Helmet>
                <title>Recherche d'emplois • JobTracker</title>
                <meta name="description" content="Filtrez par remote, salaire, date de publication et source pour trouver votre prochain emploi." />
            </Helmet>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Recherche d'emplois
                </h1>
                <p className="text-gray-600">
                    Trouvez votre prochain emploi parmi des milliers d'offres
                </p>
            </div>

            {/* Search Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
            >
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Titre du poste, compétences, entreprise..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Rechercher
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 border rounded-lg transition-colors flex items-center space-x-2 ${showFilters
                            ? 'border-blue-600 text-blue-600 bg-blue-50'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        <span className="hidden sm:inline">Filtres</span>
                    </button>
                </form>
            </motion.div>

            {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Localisation
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Ville, région..."
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entreprise
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Nom de l'entreprise..."
                                        value={filters.company}
                                        onChange={(e) => handleFilterChange('company', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expérience
                                </label>
                                <select
                                    value={filters.experience}
                                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Tous niveaux</option>
                                    <option value="Junior">Junior</option>
                                    <option value="Mid-level">Mid-level</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de contrat
                                </label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Tous</option>
                                    {contractTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Source
                                </label>
                                <select
                                    value={filters.source}
                                    onChange={(e) => handleFilterChange('source', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Toutes</option>
                                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>



                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date de publication</label>
                                <select
                                    value={filters.datePosted}
                                    onChange={(e) => handleFilterChange('datePosted', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Toutes</option>
                                    <option value="24h">Dernières 24h</option>
                                    <option value="7d">7 derniers jours</option>
                                    <option value="14d">14 derniers jours</option>
                                    <option value="30d">30 derniers jours</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-3">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.savedOnly || false}
                                        onChange={(e) => handleFilterChange('savedOnly', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Favoris uniquement</span>
                                </label>
                            </div>



                            <div className="flex items-center space-x-3">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.remote}
                                        onChange={(e) => handleFilterChange('remote', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Télétravail</span>
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Effacer les filtres
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sort and Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                    <span className="text-sm text-gray-600">
                        {filteredJobs.length} emploi{filteredJobs.length > 1 ? 's' : ''} trouvé{filteredJobs.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Trier par:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="recent">Plus récent</option>
                        <option value="salary">Salaire</option>
                        <option value="company">Entreprise</option>
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Recherche en cours...</p>
                </div>
            )}

            {/* Jobs Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {pageJobs.map((job, index) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-xl shadow border border-gray-200/60 overflow-hidden hover:shadow-md transition-all"
                            >
                                <div className="px-5 pt-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                            <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                                                <span className="inline-flex items-center space-x-1"><Building className="w-4 h-4" /><span>{job.company}</span></span>
                                                <span className="inline-flex items-center space-x-1"><MapPin className="w-4 h-4" /><span>{job.location}{job.remote ? ' (Remote)' : ''}</span></span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { toggleSaveJob(job.id); toast.success(job.saved ? 'Retiré des favoris' : 'Ajouté aux favoris'); }}
                                            className={`p-2 rounded-lg border ${job.saved ? 'border-yellow-300 text-yellow-600 bg-yellow-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                            aria-label="Sauvegarder l'offre"
                                        >
                                            {job.saved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5">

                                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>{job.type}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>{job.experience}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>{job.salary}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>{job.source}</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {stripHtml(job.description)}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {job.requirements.slice(0, 3).map((req, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                            >
                                                {req}
                                            </span>
                                        ))}
                                        {job.requirements.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                +{job.requirements.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            Publié {formatDistanceToNow(new Date(job.postedAt), {
                                                addSuffix: true,
                                                locale: fr
                                            })}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleApply(job)}
                                                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                            >
                                                Postuler
                                            </button>
                                            <a
                                                href={sanitizeUrl(job.url)}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="p-2 sm:p-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </a>
                                            <button
                                                onClick={() => setSelectedJob(job)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                Détails
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!loading && totalPages > 1 && (
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

            {selectedJob && (
                <div className="fixed inset-0 z-[55] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedJob(null)} />
                    <div className="relative bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl shadow-lg border border-gray-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Détails de l'offre</h3>
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="p-2 text-gray-600 hover:text-gray-900"
                                aria-label="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">{selectedJob.title}</h2>
                                <p className="text-gray-600">{selectedJob.company} • {selectedJob.location}{selectedJob.remote ? ' (Remote)' : ''}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">Type: <span className="font-medium text-gray-900">{selectedJob.type || '—'}</span></div>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">Expérience: <span className="font-medium text-gray-900">{selectedJob.experience || '—'}</span></div>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">Salaire: <span className="font-medium text-gray-900">{selectedJob.salary || '—'}</span></div>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">Source: <span className="font-medium text-gray-900">{selectedJob.source || '—'}</span></div>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 col-span-2 md:col-span-1">Publiée {formatDistanceToNow(new Date(selectedJob.postedAt), { addSuffix: true, locale: fr })}</div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: sanitize(selectedJob.description) }} />
                            </div>
                            {Array.isArray(selectedJob.requirements) && selectedJob.requirements.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Compétences requises</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedJob.requirements.map((req, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{req}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <a href={selectedJob.url} target="_blank" rel="noreferrer noopener" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Voir l'offre originale</a>
                                <button onClick={() => { handleApply(selectedJob); setSelectedJob(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Postuler</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Results */}
            {!loading && filteredJobs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun emploi trouvé
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Essayez de modifier vos critères de recherche ou vos filtres
                    </p>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Effacer les filtres
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default JobSearch;
