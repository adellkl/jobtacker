import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Filter,
    Search,
    Calendar,
    MapPin,
    Building,
    Clock,
    Edit,
    Trash2,
    Eye,
    Plus,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreVertical,
    ExternalLink,
    Bookmark,
    Check
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { sanitizeUrl } from '../lib/security';

// Helpers extraits hors composant pour ne pas être recréés à chaque rendu
const getStatusColor = (status) => {
    switch (status) {
        case 'applied': return 'bg-yellow-100 text-yellow-800';
        case 'accepted': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'interview': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const toTitleCase = (s) => String(s)
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
    .join(' ');

const extractTitleFromUrl = (rawUrl) => {
    try {
        const u = new URL(String(rawUrl));
        let slug = u.pathname.split('/').filter(Boolean).pop() || '';
        slug = slug
            .replace(/\.(html?|php|aspx?)$/i, '')
            .replace(/[-_+]+/g, ' ');
        slug = decodeURIComponent(slug).replace(/\s+/g, ' ').trim();
        if (!slug) return '';
        // Retirer identifiants numériques très longs en fin de slug
        slug = slug.replace(/\b\d{6,}\b$/, '').trim();
        if (!slug) return '';
        return toTitleCase(slug);
    } catch {
        return '';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'applied': return 'Candidature envoyée';
        case 'accepted': return 'Acceptée';
        case 'rejected': return 'Refusée';
        case 'interview': return 'Entretien';
        default: return 'Inconnu';
    }
};

// Composant séparé et stable pour éviter les remounts à chaque frappe
const ApplicationCard = ({
    application,
    isActive,
    onEditNotes,
    onDelete,
    onChangeStatus,
    showNotes,
    noteTexts,
    setNoteTexts,
    onCancelNotes,
    onSaveNotes,
    isSaved,
    onToggleFavorite,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
    >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                    {application.jobData?.imageUrl ? (
                        <img src={application.jobData.imageUrl} alt="Logo de l'entreprise" className="w-9 h-9 rounded border border-gray-200 object-contain bg-white" loading="lazy" />
                    ) : (
                        <div className="w-9 h-9 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                            {(application.jobData?.company || application.jobData?.source || '•').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                            {application.jobData?.title || 'Poste non spécifié'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center space-x-1 truncate">
                                <Building className="w-4 h-4" />
                                <span className="truncate">{application.jobData?.company || application.jobData?.source || 'Entreprise inconnue'}</span>
                            </div>
                            <div className="flex items-center space-x-1 truncate">
                                <MapPin className="w-4 h-4" />
                                <span>{application.jobData?.location || 'Localisation inconnue'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {getStatusLabel(application.status)}
                </span>
                {application?.jobData?.id && (
                    <button
                        onClick={() => onToggleFavorite(application.jobData.id, application.jobData)}
                        className={`p-2 rounded-lg border ${isSaved ? 'border-yellow-300 text-yellow-600 bg-yellow-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        aria-label={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                        {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                )}
                {application?.jobData?.url && (
                    <a href={sanitizeUrl(application.jobData.url)} target="_blank" rel="noreferrer noopener" className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Voir l'offre originale">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Postulée le {format(new Date(application.appliedAt), 'dd/MM/yyyy', { locale: fr })}</span>
            </div>
            <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Il y a {formatDistanceToNow(new Date(application.appliedAt), { locale: fr })}</span>
            </div>
        </div>

        {application.notes && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{application.notes}</p>
            </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
                <button
                    onClick={() => onEditNotes(application.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                    <Edit className="w-4 h-4" />
                    <span>{application.notes ? 'Modifier mes notes' : 'Ajouter une note'}</span>
                </button>
            </div>
            <div className="flex items-center flex-wrap gap-2">
                <select
                    value={application.status}
                    onChange={(e) => onChangeStatus(application.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-auto"
                >
                    <option value="applied">Candidature envoyée</option>
                    <option value="interview">Entretien</option>
                    <option value="accepted">Acceptée</option>
                    <option value="rejected">Refusée</option>
                </select>
                <button
                    onClick={() => onDelete(application.id)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    title="Supprimer cette candidature"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>

        {showNotes[application.id] && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
            >
                <textarea
                    placeholder="Ajoutez vos notes sur cette candidature..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="5"
                    value={noteTexts[application.id] || ''}
                    onChange={(e) => setNoteTexts({ ...noteTexts, [application.id]: e.target.value })}
                />
                <div className="flex justify-end space-x-2 mt-2">
                    <button
                        onClick={() => onCancelNotes(application.id)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => onSaveNotes(application.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                        Sauvegarder
                    </button>
                </div>
            </motion.div>
        )}
    </motion.div>
);

function ImportFromUrl() {
    const { addApplication } = useJobContext();
    const [url, setUrl] = useState('');
    const handleImport = async () => {
        const raw = String(url || '').trim();
        if (!raw) { toast.error('URL requise'); return; }
        try {
            const u = new URL(raw);
            const hostname = u.hostname.replace(/^www\./, '');
            const jobId = `url-${Date.now()}`;
            // Essai de récupération de métadonnées basique
            let title = '';
            let company = hostname;
            let imageUrl = `https://logo.clearbit.com/${hostname}`;
            try {
                const resp = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(raw)}&audio=false&video=false&screenshot=false`);
                if (resp.ok) {
                    const data = await resp.json();
                    const d = data?.data || {};
                    const jsonld = d.jsonld;
                    if (jsonld) {
                        const arr = Array.isArray(jsonld) ? jsonld : [jsonld];
                        const jp = arr.find(x => {
                            const t = x?.['@type'];
                            return t === 'JobPosting' || (Array.isArray(t) && t.includes('JobPosting'));
                        });
                        if (jp) {
                            if (!title) title = jp.title || '';
                            if (!company) company = jp.hiringOrganization?.name || company;
                        }
                    }
                    if (!title) title = d.title || d.headline || '';
                    if (d.publisher) company = d.publisher;
                    if (d.logo?.url) imageUrl = d.logo.url;
                    else if (d.image?.url) imageUrl = d.image.url;
                }
            } catch { }
            if (!title) {
                const fromUrl = extractTitleFromUrl(raw);
                if (fromUrl) title = fromUrl;
            }
            const job = {
                id: jobId,
                title: title || `Offre sur ${hostname}`,
                company,
                location: '',
                remote: false,
                salary: '—',
                experience: '',
                type: '',
                description: raw,
                requirements: [],
                postedAt: new Date().toISOString(),
                applied: false,
                saved: false,
                source: hostname,
                imageUrl,
                url: raw,
            };
            await addApplication(jobId, job);
            setUrl('');
            toast.success('Offre importée dans vos candidatures');
        } catch {
            toast.error("Lien invalide. Merci d'entrer une URL complète.");
        }
    };
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Coller le lien de l'offre (https://...)" className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button onClick={handleImport} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Importer</button>
        </div>
    );
}

const Applications = () => {
    const { applications, updateApplicationStatus, deleteApplication, updateApplicationNotes, savedJobIds, toggleSaveJob } = useJobContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [editingApplication, setEditingApplication] = useState(null);
    const [showNotes, setShowNotes] = useState({});
    const [noteTexts, setNoteTexts] = useState({});
    const [isEditingNotes, setIsEditingNotes] = useState({});

    const statusOptions = [
        { value: 'all', label: 'Toutes', color: 'gray' },
        { value: 'applied', label: 'Candidature envoyée', color: 'yellow' },
        { value: 'interview', label: 'Entretien', color: 'blue' },
        { value: 'accepted', label: 'Acceptée', color: 'green' },
        { value: 'rejected', label: 'Refusée', color: 'red' }
    ];

    const isActive = (path) => false; // non utilisé ici mais laissé pour cohérence éventuelle

    const handleStatusChange = (applicationId, newStatus) => {
        updateApplicationStatus(applicationId, newStatus);
        toast.success('Statut mis à jour avec succès');
    };

    const handleDeleteApplication = (applicationId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
            deleteApplication(applicationId);
            toast.success('Candidature supprimée avec succès');
        }
    };

    const handleSaveNotes = (applicationId) => {
        const notes = noteTexts[applicationId] || '';
        updateApplicationNotes(applicationId, notes);
        setIsEditingNotes({ ...isEditingNotes, [applicationId]: false });
        setShowNotes({ ...showNotes, [applicationId]: false });
        toast.success('Notes sauvegardées avec succès');
    };

    const handleCancelNotes = (applicationId) => {
        setNoteTexts({ ...noteTexts, [applicationId]: '' });
        setIsEditingNotes({ ...isEditingNotes, [applicationId]: false });
        setShowNotes({ ...showNotes, [applicationId]: false });
    };

    const handleEditNotes = (applicationId) => {
        setNoteTexts({ ...noteTexts, [applicationId]: applications.find(app => app.id === applicationId)?.notes || '' });
        setIsEditingNotes({ ...isEditingNotes, [applicationId]: true });
        setShowNotes({ ...showNotes, [applicationId]: true });
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = searchQuery === '' ||
            app.jobData?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.jobData?.company?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const groupedApplications = filteredApplications.reduce((groups, app) => {
        const status = app.status;
        if (!groups[status]) {
            groups[status] = [];
        }
        groups[status].push(app);
        return groups;
    }, {});

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Mes candidatures
                </h1>
                <p className="text-gray-600">
                    Centralisez vos candidatures, mettez à jour vos statuts et conservez vos notes au même endroit.
                </p>
            </div>

            {/* Import rapide par URL */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
            >
                <ImportFromUrl />
            </motion.div>

            {/* Filtres supplémentaires */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date de candidature
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={(e) => {
                                        console.log('Filtre date:', e.target.value);
                                    }}
                                >
                                    <option value="">Toutes les dates</option>
                                    <option value="today">Aujourd’hui</option>
                                    <option value="week">Cette semaine</option>
                                    <option value="month">Ce mois</option>
                                    <option value="quarter">Ce trimestre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Entreprise
                                </label>
                                <input
                                    type="text"
                                    placeholder="Filtrer par entreprise…"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={(e) => {
                                        console.log('Filtre entreprise:', e.target.value);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Localisation
                                </label>
                                <input
                                    type="text"
                                    placeholder="Filtrer par localisation…"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={(e) => {
                                        console.log('Filtre localisation:', e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowFilters(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                                Fermer les filtres
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statusOptions.slice(1).map((status) => {
                    const count = applications.filter(app => app.status === status.value).length;
                    const getIconColor = (color) => {
                        switch (color) {
                            case 'yellow': return 'text-yellow-600';
                            case 'blue': return 'text-blue-600';
                            case 'green': return 'text-green-600';
                            case 'red': return 'text-red-600';
                            default: return 'text-gray-600';
                        }
                    };
                    const getBgColor = (color) => {
                        switch (color) {
                            case 'yellow': return 'bg-yellow-100';
                            case 'blue': return 'bg-blue-100';
                            case 'green': return 'bg-green-100';
                            case 'red': return 'bg-red-100';
                            default: return 'bg-gray-100';
                        }
                    };

                    return (
                        <motion.div
                            key={status.value}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: statusOptions.indexOf(status) * 0.1 }}
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{status.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                                </div>
                                <div className={`p-2 rounded-lg ${getBgColor(status.color)}`}>
                                    {status.value === 'applied' && <Clock className={`w-5 h-5 ${getIconColor(status.color)}`} />}
                                    {status.value === 'interview' && <AlertCircle className={`w-5 h-5 ${getIconColor(status.color)}`} />}
                                    {status.value === 'accepted' && <CheckCircle className={`w-5 h-5 ${getIconColor(status.color)}`} />}
                                    {status.value === 'rejected' && <XCircle className={`w-5 h-5 ${getIconColor(status.color)}`} />}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Liste des candidatures */}
            {filteredApplications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {applications.length === 0 ? 'Aucune candidature pour le moment' : 'Aucun résultat'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {applications.length === 0
                            ? 'Ajoutez votre première candidature depuis la recherche d’emplois ou manuellement.'
                            : 'Ajustez vos critères de recherche ou vos filtres pour élargir les résultats.'
                        }
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        {applications.length === 0 ? 'Rechercher des emplois' : 'Effacer les filtres'}
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedApplications).map(([status, apps]) => (
                        <div key={status}>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {getStatusLabel(status)} ({apps.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {apps.map((app) => (
                                    <ApplicationCard
                                        key={app.id}
                                        application={app}
                                        isActive={isActive}
                                        onEditNotes={handleEditNotes}
                                        onDelete={handleDeleteApplication}
                                        onChangeStatus={handleStatusChange}
                                        showNotes={showNotes}
                                        noteTexts={noteTexts}
                                        setNoteTexts={setNoteTexts}
                                        onCancelNotes={handleCancelNotes}
                                        onSaveNotes={handleSaveNotes}
                                        isSaved={savedJobIds.includes(app?.jobData?.id)}
                                        onToggleFavorite={toggleSaveJob}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Applications;
