import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Edit,
    Save,
    X,
    Download,
    Upload,
    Settings,
    Bell,
    Shield,
    HelpCircle,
    LogOut
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const Profile = () => {
    const { applications } = useJobContext();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [resumeUrl, setResumeUrl] = useState(null); // signed URL or blob URL for preview
    const [resumePath, setResumePath] = useState(null); // storage path infouser/<uid>/...
    const [avatarUrl, setAvatarUrl] = useState(null);   // signed URL for avatar
    const [avatarPath, setAvatarPath] = useState(null); // storage path for avatar
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const fileInputRef = useRef(null);
    const avatarInputRef = useRef(null);
    const importInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        title: '',
        experience: '',
        skills: [],
        bio: '',
        linkedin: '',
        github: '',
        website: ''
    });
    const [supportsDataColumn, setSupportsDataColumn] = useState(null);

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: false,
        weeklyReports: true,
        jobAlerts: true,
        privacyMode: false
    });

    useEffect(() => {
        const checkAndLoad = async () => {
            if (!user) return;
            // Détecter la colonne data
            let hasData = false;
            try {
                const test = await supabase.from('infouser').select('data').limit(1);
                if (!test.error) hasData = true;
            } catch { }
            setSupportsDataColumn(hasData);

            if (hasData) {
                const { data, error } = await supabase
                    .from('infouser')
                    .select('full_name, avatar_url, data, resume_url, resume_filename, resume_mime, resume_size')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (!error && data) {
                    const details = data.data || {};
                    setProfileData({
                        firstName: details.firstName || '',
                        lastName: details.lastName || '',
                        email: details.email || user.email || '',
                        phone: details.phone || '',
                        location: details.location || '',
                        title: details.title || '',
                        experience: details.experience || '',
                        skills: Array.isArray(details.skills) ? details.skills : [],
                        bio: details.bio || '',
                        linkedin: details.linkedin || '',
                        github: details.github || '',
                        website: details.website || ''
                    });
                    if (details.preferences) setPreferences(prev => ({ ...prev, ...details.preferences }));
                    if (data.resume_url) setResumePath(data.resume_url);
                    if (data.avatar_url) {
                        setAvatarPath(data.avatar_url);
                        if (String(data.avatar_url).startsWith('http')) {
                            setAvatarUrl(data.avatar_url);
                        } else {
                            const { data: aSigned } = await supabase.storage.from('infouser').createSignedUrl(data.avatar_url, 60 * 60);
                            setAvatarUrl(aSigned?.signedUrl || null);
                        }
                    }
                } else {
                    setProfileData(p => ({ ...p, email: user?.email || '' }));
                }
            } else {
                const { data, error } = await supabase
                    .from('infouser')
                    .select('full_name, avatar_url, resume_url, resume_filename, resume_mime, resume_size')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (!error && data) {
                    const [firstName = '', lastName = ''] = (data.full_name || '').split(' ');
                    setProfileData((p) => ({
                        ...p,
                        firstName,
                        lastName,
                        email: user.email || '',
                    }));
                    if (data.resume_url) setResumePath(data.resume_url);
                    if (data.avatar_url) {
                        setAvatarPath(data.avatar_url);
                        if (String(data.avatar_url).startsWith('http')) {
                            setAvatarUrl(data.avatar_url);
                        } else {
                            const { data: aSigned } = await supabase.storage.from('infouser').createSignedUrl(data.avatar_url, 60 * 60);
                            setAvatarUrl(aSigned?.signedUrl || null);
                        }
                    }
                } else {
                    setProfileData((p) => ({ ...p, email: user?.email || '' }));
                }
            }
        };
        checkAndLoad();
    }, [user?.id]);

    const tabs = [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'preferences', label: 'Préférences', icon: Settings },
        { id: 'stats', label: 'Statistiques', icon: Briefcase }
    ];

    const handleProfileUpdate = async () => {
        if (!user) return;
        const payload = {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email || user.email,
            phone: profileData.phone,
            location: profileData.location,
            title: profileData.title,
            experience: profileData.experience,
            skills: profileData.skills,
            bio: profileData.bio,
            linkedin: profileData.linkedin,
            github: profileData.github,
            website: profileData.website,
            preferences,
        };
        const upsertPayload = {
            user_id: user.id,
            full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
            avatar_url: null,
        };
        if (supportsDataColumn) {
            upsertPayload.data = payload;
        }
        const { error } = await supabase.from('infouser').upsert(upsertPayload);
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success('Profil sauvegardé');
        setIsEditing(false);
    };

    const handleResumeButton = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        try {
            const path = `${user.id}/${Date.now()}-${file.name}`;
            const { error: upErr } = await supabase.storage.from('infouser').upload(path, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type || 'application/pdf',
            });
            if (upErr) throw upErr;

            // Mettre à jour la table infouser avec le chemin et métadonnées
            const { error: dbErr } = await supabase.from('infouser').upsert({
                user_id: user.id,
                full_name: `${profileData.firstName} ${profileData.lastName}`.trim() || user.email,
                resume_url: path,
                resume_filename: file.name,
                resume_mime: file.type || 'application/pdf',
                resume_size: file.size,
            });
            if (dbErr) throw dbErr;

            setResumePath(path);
            // Générer une URL signée pour prévisualisation
            const { data: signed, error: signErr } = await supabase.storage.from('infouser').createSignedUrl(path, 60 * 60);
            if (signErr) throw signErr;
            setResumeUrl(signed?.signedUrl || null);
            setIsResumeModalOpen(true);
            toast.success('CV importé');
        } catch (err) {
            toast.error(err.message || 'Erreur lors de l\'import du CV');
        }
    };

    const openResume = async () => {
        if (!resumePath) return;
        const { data: signed, error: signErr } = await supabase.storage.from('infouser').createSignedUrl(resumePath, 60 * 60);
        if (signErr) {
            toast.error(signErr.message);
            return;
        }
        setResumeUrl(signed?.signedUrl || null);
        setIsResumeModalOpen(true);
    };

    const handleAvatarButton = () => {
        if (avatarInputRef.current) avatarInputRef.current.click();
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        try {
            const ext = file.name.split('.').pop() || 'png';
            const path = `${user.id}/avatar-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage.from('infouser').upload(path, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type || 'image/png',
            });
            if (upErr) throw upErr;
            const { error: dbErr } = await supabase.from('infouser').upsert({
                user_id: user.id,
                full_name: `${profileData.firstName} ${profileData.lastName}`.trim() || user.email,
                avatar_url: path,
            });
            if (dbErr) throw dbErr;
            setAvatarPath(path);
            const { data: aSigned, error: signErr } = await supabase.storage.from('infouser').createSignedUrl(path, 60 * 60);
            if (signErr) throw signErr;
            setAvatarUrl(aSigned?.signedUrl || null);
            toast.success('Photo de profil mise à jour');
        } catch (err) {
            toast.error(err.message || 'Erreur lors de l\'upload de la photo');
        }
    };

    const handleSkillAdd = (skill) => {
        if (skill && !profileData.skills.includes(skill)) {
            setProfileData({
                ...profileData,
                skills: [...profileData.skills, skill]
            });
        }
    };

    const handleSkillRemove = (skillToRemove) => {
        setProfileData({
            ...profileData,
            skills: profileData.skills.filter(skill => skill !== skillToRemove)
        });
    };

    const handleExportData = async () => {
        try {
            if (!user) { toast.error('Veuillez vous connecter'); return }
            const [apps, saved, profile, alerts] = await Promise.all([
                supabase.from('applications').select('*').eq('user_id', user.id),
                supabase.from('saved_jobs').select('*').eq('user_id', user.id),
                supabase.from('infouser').select('*').eq('user_id', user.id).maybeSingle(),
                supabase.from('alerts').select('*').eq('user_id', user.id),
            ])
            const payload = {
                version: 1,
                exportedAt: new Date().toISOString(),
                userId: user.id,
                applications: Array.isArray(apps.data) ? apps.data : [],
                saved_jobs: Array.isArray(saved.data) ? saved.data : [],
                profile: profile.data || null,
                alerts: Array.isArray(alerts.data) ? alerts.data : [],
            }
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const date = new Date().toISOString().slice(0, 10)
            a.href = url
            a.download = `jobtracker-backup-${date}.json`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success('Export terminé')
        } catch (e) {
            toast.error('Export impossible')
        }
    }

    const handleImportClick = () => {
        if (importInputRef.current) importInputRef.current.click()
    }

    const handleImportFile = async (e) => {
        try {
            if (!user) { toast.error('Veuillez vous connecter'); return }
            const file = e.target.files?.[0]
            if (!file) return
            const text = await file.text()
            const data = JSON.parse(text)
            // Sécurité basique
            if (!data || typeof data !== 'object') throw new Error('Fichier invalide')
            // Upserts
            const apps = Array.isArray(data.applications) ? data.applications : []
            if (apps.length) {
                const sanitized = apps.map(a => ({
                    id: a.id,
                    user_id: user.id,
                    job_id: a.job_id || a.jobId || null,
                    job_data: a.job_data || a.jobData || {},
                    status: a.status || 'applied',
                    notes: a.notes || '',
                    applied_at: a.applied_at || a.appliedAt || new Date().toISOString(),
                }))
                await supabase.from('applications').upsert(sanitized)
            }
            const saved = Array.isArray(data.saved_jobs) ? data.saved_jobs : []
            if (saved.length) {
                const sanitized = saved.map(s => ({
                    user_id: user.id,
                    job_id: s.job_id || s.jobId,
                    job_data: s.job_data || s.jobData || {},
                    saved_at: s.saved_at || new Date().toISOString(),
                }))
                await supabase.from('saved_jobs').upsert(sanitized)
            }
            const profile = data.profile
            if (profile && typeof profile === 'object') {
                const up = {
                    user_id: user.id,
                    full_name: profile.full_name || `${profileData.firstName} ${profileData.lastName}`.trim() || user.email,
                    avatar_url: profile.avatar_url || null,
                    resume_url: profile.resume_url || null,
                    resume_filename: profile.resume_filename || null,
                    resume_mime: profile.resume_mime || null,
                    resume_size: profile.resume_size || null,
                }
                if (supportsDataColumn && profile.data) up.data = profile.data
                await supabase.from('infouser').upsert(up)
            }
            const alerts = Array.isArray(data.alerts) ? data.alerts : []
            if (alerts.length) {
                const sanitized = alerts.map(a => ({
                    id: a.id,
                    user_id: user.id,
                    query: a.query || '',
                    filters: a.filters || {},
                    last_run_at: a.last_run_at || null,
                    last_results_count: a.last_results_count || 0,
                }))
                await supabase.from('alerts').upsert(sanitized)
            }
            toast.success('Import terminé')
            e.target.value = ''
        } catch (err) {
            toast.error('Import impossible')
        }
    }

    // Helpers statut (couleurs/labels) utilisés dans l'onglet Statistiques
    const getStatusColor = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'applied': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'interview': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'applied': return 'Candidature envoyée';
            case 'accepted': return 'Acceptée';
            case 'rejected': return 'Refusée';
            case 'interview': return 'Entretien';
            default: return 'Inconnu';
        }
    };

    const stats = [
        {
            title: 'Total Candidatures',
            value: applications.length,
            change: '+15%',
            changeType: 'positive'
        },
        {
            title: 'Taux de réponse',
            value: applications.length > 0 ? '23%' : '0%',
            change: '+5%',
            changeType: 'positive'
        },
        {
            title: 'Entretiens obtenus',
            value: applications.filter(app => app.status === 'interview').length,
            change: '+8%',
            changeType: 'positive'
        },
        {
            title: 'Offres acceptées',
            value: applications.filter(app => app.status === 'accepted').length,
            change: '+12%',
            changeType: 'positive'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Mon Profil
                </h1>
                <p className="text-gray-600">
                    Gérez vos informations personnelles et vos préférences
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8">
                <div className="flex space-x-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Profile Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center space-x-6 w-full md:w-auto">
                                <div className="relative">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-xl sm:text-2xl font-bold">
                                                {(profileData.firstName[0] || user?.email?.[0] || 'U').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAvatarButton}
                                        aria-label="Modifier la photo"
                                        className="absolute -bottom-2 -right-2 z-10 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white hover:bg-blue-700"
                                    >
                                        <Edit className="w-4.5 h-4.5" />
                                    </button>
                                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {profileData.firstName} {profileData.lastName}
                                    </h2>
                                    <p className="text-lg text-gray-600 mb-2">{profileData.title}</p>
                                    <p className="text-gray-500">{profileData.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 md:self-auto self-stretch">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleProfileUpdate}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>Sauvegarder</span>
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Annuler</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Modifier</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bio
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            ) : (
                                <p className="text-gray-700">{profileData.bio}</p>
                            )}
                        </div>

                        {/* CV */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">CV</label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} />
                                <button onClick={handleResumeButton} className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Importer un PDF</button>
                                {resumePath && (
                                    <a
                                        href={resumeUrl || '#'}
                                        onClick={(e) => { if (!resumeUrl) { e.preventDefault(); openResume(); } }}
                                        className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm inline-flex items-center justify-center"
                                    >
                                        Télécharger
                                    </a>
                                )}
                                <button onClick={openResume} disabled={!resumePath} className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm ${resumePath ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Voir le CV</button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Format supporté: PDF. Le fichier est prévisualisé localement.</p>
                        </div>

                        {/* Skills */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Compétences
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {profileData.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center space-x-2"
                                    >
                                        <span>{skill}</span>
                                        {isEditing && (
                                            <button
                                                onClick={() => handleSkillRemove(skill)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {isEditing && (
                                    <input
                                        type="text"
                                        placeholder="Ajouter une compétence..."
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSkillAdd(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prénom
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profileData.firstName}
                                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{profileData.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profileData.lastName}
                                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{profileData.lastName}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{profileData.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{profileData.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Liens sociaux</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    LinkedIn
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={profileData.linkedin}
                                        onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{profileData.linkedin}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text sm font-medium text-gray-700 mb-2">
                                    GitHub
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={profileData.github}
                                        onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{profileData.github}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Site web
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={profileData.website}
                                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-900">{profileData.website}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                        <div className="space-y-4">
                            {Object.entries(preferences).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {key === 'emailNotifications' && 'Notifications par email'}
                                            {key === 'pushNotifications' && 'Notifications push'}
                                            {key === 'weeklyReports' && 'Rapports hebdomadaires'}
                                            {key === 'jobAlerts' && 'Alertes d\'emploi'}
                                            {key === 'privacyMode' && 'Mode privé'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {key === 'emailNotifications' && 'Recevoir des notifications par email'}
                                            {key === 'pushNotifications' && 'Recevoir des notifications push'}
                                            {key === 'weeklyReports' && 'Recevoir un rapport hebdomadaire de vos candidatures'}
                                            {key === 'jobAlerts' && 'Recevoir des alertes pour de nouveaux emplois'}
                                            {key === 'privacyMode' && 'Masquer votre profil des recruteurs'}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={async (e) => {
                                                const next = { ...preferences, [key]: e.target.checked }
                                                setPreferences(next)
                                                // Persister immédiatement dans infouser.data.preferences
                                                try {
                                                    const { data: current } = await supabase
                                                        .from('infouser')
                                                        .select('data')
                                                        .eq('user_id', user.id)
                                                        .maybeSingle()
                                                    const currentData = (current && current.data) || {}
                                                    const payload = { ...currentData, preferences: next }
                                                    await supabase.from('infouser').upsert({ user_id: user.id, data: payload })
                                                } catch { }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={handleExportData} className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                <Download className="w-5 h-5" />
                                <span>Exporter mes données</span>
                            </button>
                            <div className="flex items-center justify-center">
                                <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
                                <button onClick={handleImportClick} className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Upload className="w-5 h-5" />
                                    <span>Importer des données</span>
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Export en JSON. L\'import fusionne vos données (upsert).</p>
                    </div>
                </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                                <div className="flex items-center">
                                    <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {stat.change}
                                    </span>
                                    <span className="text-sm text-gray-600 ml-2">vs mois dernier</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
                        <div className="space-y-4">
                            {applications.slice(0, 5).map((app) => (
                                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            Candidature pour {app.jobData?.title || 'un poste'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {app.jobData?.company || 'Entreprise non spécifiée'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                        {getStatusLabel(app.status)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
            {isResumeModalOpen && (
                <div className="fixed inset-0 z-[55] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsResumeModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Aperçu du CV</h3>
                            <button onClick={() => setIsResumeModalOpen(false)} className="p-2 text-gray-600 hover:text-gray-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="w-full h-full">
                            {resumeUrl ? (
                                <iframe title="CV" src={resumeUrl} className="w-full h-full" />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">Aucun fichier</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;

// Modal CV
// Ajout d'un modal simple affichant l'iframe PDF si disponible
// (intégré en bas du fichier pour rester autonome)
/* eslint-disable react/no-danger */

// Inject modal rendering inside component return (placed after export for clarity in this file)
// NOTE: The modal is controlled via isResumeModalOpen and resumeUrl within the component above.

