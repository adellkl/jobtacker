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
    MoreVertical
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Applications = () => {
    const { applications, updateApplicationStatus, deleteApplication, updateApplicationNotes } = useJobContext();
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'applied': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'interview': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
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

    const ApplicationCard = ({ application }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {application.jobData?.title || 'Poste non spécifié'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{application.jobData?.company || 'Entreprise non spécifiée'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{application.jobData?.location || 'Localisation non spécifiée'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusLabel(application.status)}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Postulé le {format(new Date(application.appliedAt), 'dd/MM/yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Il y a {formatDistanceToNow(new Date(application.appliedAt), { locale: fr })}</span>
                </div>
            </div>

            {application.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{application.notes}</p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handleEditNotes(application.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                        <Edit className="w-4 h-4" />
                        <span>{application.notes ? 'Modifier' : 'Ajouter'} des notes</span>
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={application.status}
                        onChange={(e) => handleStatusChange(application.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="applied">Candidature envoyée</option>
                        <option value="interview">Entretien</option>
                        <option value="accepted">Acceptée</option>
                        <option value="rejected">Refusée</option>
                    </select>
                    <button
                        onClick={() => handleDeleteApplication(application.id)}
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
                        rows="3"
                        value={noteTexts[application.id] || ''}
                        onChange={(e) => setNoteTexts({ ...noteTexts, [application.id]: e.target.value })}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button
                            onClick={() => handleCancelNotes(application.id)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={() => handleSaveNotes(application.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                            Sauvegarder
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Mes Candidatures
                </h1>
                <p className="text-gray-600">
                    Suivez et gérez toutes vos candidatures en un seul endroit
                </p>
            </div>

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
            >
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher dans vos candidatures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-3 border rounded-lg transition-colors flex items-center space-x-2 ${showFilters
                                ? 'border-blue-600 text-blue-600 bg-blue-50'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="hidden sm:inline">Plus de filtres</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Additional Filters */}
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
                                        // Logique de filtrage par date à implémenter
                                        console.log('Filtre date:', e.target.value);
                                    }}
                                >
                                    <option value="">Toutes les dates</option>
                                    <option value="today">Aujourd'hui</option>
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
                                    placeholder="Filtrer par entreprise..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={(e) => {
                                        // Logique de filtrage par entreprise à implémenter
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
                                    placeholder="Filtrer par localisation..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onChange={(e) => {
                                        // Logique de filtrage par localisation à implémenter
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

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {applications.length === 0 ? 'Aucune candidature pour le moment' : 'Aucune candidature trouvée'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {applications.length === 0
                            ? 'Commencez par rechercher des emplois et postuler'
                            : 'Essayez de modifier vos critères de recherche'
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {apps.map((app) => (
                                    <ApplicationCard key={app.id} application={app} />
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
