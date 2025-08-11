import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Plus,
    ExternalLink
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LineChart from '../components/LineChart';

const Dashboard = () => {
    const { applications, searchJobs, loading, addApplication } = useJobContext();
    const navigate = useNavigate();
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [newApp, setNewApp] = useState({
        title: '',
        company: '',
        location: '',
        type: 'CDI',
        url: '',
    });
    const [importUrl, setImportUrl] = useState('');

    useEffect(() => {
        if (applications.length === 0) {
            searchJobs('', {});
        }
    }, []);

    const totalCount = applications.length;
    const countApplied = applications.filter(app => app.status === 'applied').length;
    const countAccepted = applications.filter(app => app.status === 'accepted').length;
    const countRejected = applications.filter(app => app.status === 'rejected').length;
    const pct = (n) => totalCount > 0 ? `${Math.round((n / totalCount) * 100)}%` : '0%';

    const stats = [
        {
            title: 'Total Candidatures',
            value: totalCount,
            change: pct(totalCount),
            changeType: 'positive',
            icon: FileText,
            color: 'blue'
        },
        {
            title: 'En attente',
            value: countApplied,
            change: pct(countApplied),
            changeType: 'neutral',
            icon: Clock,
            color: 'yellow'
        },
        {
            title: 'Acceptées',
            value: countAccepted,
            change: pct(countAccepted),
            changeType: 'positive',
            icon: CheckCircle,
            color: 'green'
        },
        {
            title: 'Refusées',
            value: countRejected,
            change: pct(countRejected),
            changeType: 'negative',
            icon: XCircle,
            color: 'red'
        }
    ];

    const recentApplications = applications
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
        .slice(0, 5);

    // Construire séries dynamiques sur 30 jours
    const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
    const labels = days.map(d => format(d, 'dd/MM', { locale: fr }));
    const byDay = days.map(d => {
        const dayStr = format(d, 'yyyy-MM-dd');
        const apps = applications.filter(a => format(new Date(a.appliedAt), 'yyyy-MM-dd') === dayStr);
        return {
            applied: apps.length,
            interview: apps.filter(a => a.status === 'interview').length,
            accepted: apps.filter(a => a.status === 'accepted').length,
        };
    });
    const series = [
        { label: 'Candidatures', color: '#3B82F6', data: byDay.map(x => x.applied) },
        { label: 'Entretiens', color: '#10B981', data: byDay.map(x => x.interview) },
        { label: 'Acceptées', color: '#F59E0B', data: byDay.map(x => x.accepted) },
    ];

    const handleOpenNew = () => setIsNewModalOpen(true);
    const handleSaveNew = () => {
        if (!newApp.title || !newApp.company) {
            toast.error('Titre et entreprise sont requis');
            return;
        }
        const jobId = `manual-${Date.now()}`;
        const jobData = {
            id: jobId,
            title: newApp.title,
            company: newApp.company,
            location: newApp.location || '—',
            type: newApp.type || 'CDI',
            experience: '',
            source: 'Manuel',
            url: newApp.url || '#',
            postedAt: new Date().toISOString(),
            applied: true,
            saved: false,
            description: '',
            requirements: [],
            salary: '—',
            remote: false,
            imageUrl: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/640/360`,
        };
        addApplication(jobId, jobData);
        setIsNewModalOpen(false);
        setNewApp({ title: '', company: '', location: '', type: 'CDI', url: '' });
        toast.success('Candidature ajoutée');
    };

    const handleImport = () => {
        if (!importUrl) {
            toast.error('URL requise');
            return;
        }
        const jobId = `import-${Date.now()}`;
        const domain = (() => { try { return new URL(importUrl).hostname; } catch { return 'LinkedIn'; } })();
        const jobData = {
            id: jobId,
            title: 'Candidature importée',
            company: domain,
            location: '—',
            type: 'CDI',
            experience: '',
            source: domain.includes('linkedin') ? 'LinkedIn' : 'Import',
            url: importUrl,
            postedAt: new Date().toISOString(),
            applied: true,
            saved: false,
            description: '',
            requirements: [],
            salary: '—',
            remote: false,
            imageUrl: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/640/360`,
        };
        addApplication(jobId, jobData);
        setIsImportModalOpen(false);
        setImportUrl('');
        toast.success('Candidature importée');
    };

    const handleGenerateCV = () => {
        const lines = [
            '# CV',
            '',
            '## Expériences récentes (données issues de vos candidatures)',
            ...applications.slice(0, 10).map(app => `- ${app.jobData?.title || 'Poste'} chez ${app.jobData?.company || 'Entreprise'} (${new Date(app.appliedAt).toLocaleDateString('fr-FR')})`)
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CV.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('CV généré (Markdown)');
    };

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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Tableau de bord
                </h1>
                <p className="text-gray-600">
                    Suivez vos candidatures et analysez vos performances
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center">
                                <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.change}
                                </span>
                                <span className="text-sm text-gray-600 ml-2">vs mois dernier</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleOpenNew} className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus className="w-5 h-5" />
                        <span>Nouvelle candidature</span>
                    </button>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                        <span>Importer depuis LinkedIn</span>
                    </button>
                    <button onClick={handleGenerateCV} className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <FileText className="w-5 h-5" />
                        <span>Générer CV</span>
                    </button>
                </div>
            </motion.div>

            {/* Recent Applications */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Candidatures récentes</h2>
                    <button onClick={() => navigate('/applications')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Voir tout
                    </button>
                </div>

                {recentApplications.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Aucune candidature pour le moment
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Commencez par rechercher des emplois et postuler
                        </p>
                        <button onClick={() => navigate('/search')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Rechercher des emplois
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentApplications.map((application) => (
                            <div
                                key={application.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-medium text-sm sm:text-base">
                                            {application.jobData?.company?.charAt(0) || 'C'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">
                                            {application.jobData?.title || 'Poste non spécifié'}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {application.jobData?.company || 'Entreprise non spécifiée'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                        {getStatusLabel(application.status)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {formatDistanceToNow(new Date(application.appliedAt), {
                                            addSuffix: true,
                                            locale: fr
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"
            >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance 30 jours</h3>
                    <div className="block sm:hidden">
                        <LineChart
                            series={series}
                            labels={labels}
                            width={640}
                            height={320}
                            showLegend={true}
                            pointRadius={2}
                            strokeWidth={3}
                            axisFontSize={12}
                        />
                    </div>
                    <div className="hidden sm:block">
                        <LineChart series={series} labels={labels} width={720} height={260} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Prochaines actions</h3>
                    <div className="space-y-3">
                        {applications
                            .filter(app => app.status === 'applied')
                            .slice(0, 3)
                            .map((app) => (
                                <div key={app.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            Suivre {app.jobData?.company || 'cette candidature'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Postulé il y a {formatDistanceToNow(new Date(app.appliedAt), { locale: fr })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        {applications.filter(app => app.status === 'applied').length === 0 && (
                            <p className="text-gray-500 text-sm">Aucune action requise pour le moment</p>
                        )}
                    </div>
                </div>
            </motion.div>

            {isNewModalOpen && (
                <div className="fixed inset-0 z-[55] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsNewModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle candidature</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du poste</label>
                                <input
                                    type="text"
                                    value={newApp.title}
                                    onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                                <input
                                    type="text"
                                    value={newApp.company}
                                    onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                                <input
                                    type="text"
                                    value={newApp.location}
                                    onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                                <select
                                    value={newApp.type}
                                    onChange={(e) => setNewApp({ ...newApp, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="CDI">CDI</option>
                                    <option value="CDD">CDD</option>
                                    <option value="Intérim">Intérim</option>
                                    <option value="Alternance">Alternance</option>
                                    <option value="Stage">Stage</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lien de l'offre (optionnel)</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={newApp.url}
                                    onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                            <button onClick={handleSaveNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ajouter</button>
                        </div>
                    </div>
                </div>
            )}

            {isImportModalOpen && (
                <div className="fixed inset-0 z-[55] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsImportModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Importer une candidature</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'offre</label>
                            <input
                                type="url"
                                placeholder="Collez l'URL LinkedIn/Indeed/…"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                            <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Importer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

// Modals
// Nouvelle candidature
// Injecter les modals tout en bas du composant via JSX fragment
