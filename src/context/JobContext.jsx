import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { searchJobsApi, searchJobsExternal, enrichJobImages } from '../services/jobApi';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const JobContext = createContext();

const initialState = {
    jobs: [],
    applications: [],
    filters: {
        location: '',
        remote: false,
        experience: '',
        salary: '',
        salaryMin: '',
        company: '',
        keywords: '',
        source: '',
        type: '',
        datePosted: '',
        savedOnly: false
    },
    searchResults: [],
    savedJobIds: [],
    loading: false,
    error: null
};

const jobReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_JOBS':
            return { ...state, jobs: action.payload };
        case 'SET_APPLICATIONS':
            return { ...state, applications: action.payload };
        case 'SET_SEARCH_RESULTS':
            return { ...state, searchResults: action.payload };
        case 'SET_SAVED_JOB_IDS':
            return { ...state, savedJobIds: action.payload };
        case 'TOGGLE_SAVE_JOB': {
            const toggle = (jobs) => jobs.map(job =>
                job.id === action.payload ? { ...job, saved: !job.saved } : job
            );
            return {
                ...state,
                jobs: toggle(state.jobs),
                searchResults: toggle(state.searchResults),
                savedJobIds: state.savedJobIds.includes(action.payload)
                    ? state.savedJobIds.filter(id => id !== action.payload)
                    : [...state.savedJobIds, action.payload]
            };
        }
        case 'ADD_APPLICATION':
            return {
                ...state,
                applications: [...state.applications, action.payload],
                jobs: state.jobs.map(job =>
                    job.id === action.payload.jobId
                        ? { ...job, applied: true, appliedAt: action.payload.appliedAt }
                        : job
                )
            };
        case 'UPDATE_APPLICATION_STATUS':
            return {
                ...state,
                applications: state.applications.map(app =>
                    app.id === action.payload.id
                        ? { ...app, status: action.payload.status }
                        : app
                )
            };
        case 'DELETE_APPLICATION':
            return {
                ...state,
                applications: state.applications.filter(app => app.id !== action.payload)
            };
        case 'UPDATE_APPLICATION_NOTES':
            return {
                ...state,
                applications: state.applications.map(app =>
                    app.id === action.payload.id
                        ? { ...app, notes: action.payload.notes }
                        : app
                )
            };
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.payload } };
        case 'CLEAR_FILTERS':
            return { ...state, filters: initialState.filters };
        default:
            return state;
    }
};

export const JobProvider = ({ children }) => {
    const [state, dispatch] = useReducer(jobReducer, initialState);
    const { user } = useAuth();

    // Charger depuis Supabase si connecté, sinon localStorage
    useEffect(() => {
        const load = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('applications')
                    .select('*')
                    .order('applied_at', { ascending: false });
                if (!error && Array.isArray(data)) {
                    const mapped = data.map(r => ({
                        id: r.id,
                        jobId: r.job_id,
                        jobData: r.job_data,
                        status: r.status,
                        notes: r.notes,
                        appliedAt: r.applied_at,
                        followUpDate: r.follow_up_date || null,
                    }));
                    dispatch({ type: 'SET_APPLICATIONS', payload: mapped });
                }

                const saved = await supabase
                    .from('saved_jobs')
                    .select('job_id');
                if (!saved.error && Array.isArray(saved.data)) {
                    dispatch({ type: 'SET_SAVED_JOB_IDS', payload: saved.data.map(r => r.job_id) });
                }
            } else {
                const savedApplications = localStorage.getItem('jobApplications');
                const savedJobs = localStorage.getItem('jobJobs');
                if (savedApplications) dispatch({ type: 'SET_APPLICATIONS', payload: JSON.parse(savedApplications) });
                if (savedJobs) dispatch({ type: 'SET_JOBS', payload: JSON.parse(savedJobs) });
            }
        };
        load();
    }, [user]);

    // Persistance des applications
    useEffect(() => {
        if (!user) {
            localStorage.setItem('jobApplications', JSON.stringify(state.applications));
        }
    }, [state.applications, user]);

    // Sauvegarder les emplois dans localStorage
    useEffect(() => {
        localStorage.setItem('jobJobs', JSON.stringify(state.jobs));
    }, [state.jobs]);

    const addApplication = async (jobId, jobData) => {
        const application = {
            id: Date.now().toString(),
            jobId,
            jobData,
            appliedAt: new Date().toISOString(),
            status: 'applied',
            notes: '',
            followUpDate: null
        };
        dispatch({ type: 'ADD_APPLICATION', payload: application });
        if (user) {
            await supabase.from('applications').insert({
                id: application.id,
                user_id: user.id,
                job_id: jobId,
                job_data: jobData,
                status: application.status,
                notes: application.notes,
                applied_at: application.appliedAt,
            });
        }
    };

    const updateApplicationStatus = async (id, status) => {
        dispatch({ type: 'UPDATE_APPLICATION_STATUS', payload: { id, status } });
        if (user) await supabase.from('applications').update({ status }).eq('id', id).eq('user_id', user.id);
    };

    const deleteApplication = async (id) => {
        dispatch({ type: 'DELETE_APPLICATION', payload: id });
        if (user) await supabase.from('applications').delete().eq('id', id).eq('user_id', user.id);
    };

    const updateApplicationNotes = async (id, notes) => {
        dispatch({ type: 'UPDATE_APPLICATION_NOTES', payload: { id, notes } });
        if (user) await supabase.from('applications').update({ notes }).eq('id', id).eq('user_id', user.id);
    };

    const setFilters = (filters) => {
        dispatch({ type: 'SET_FILTERS', payload: filters });
    };

    const clearFilters = () => {
        dispatch({ type: 'CLEAR_FILTERS' });
    };

    const searchJobs = async (query, filters) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const external = await searchJobsExternal(query, filters);
            // Garde le numérique si présent, sinon garde tout pour éviter 0 résultat
            const DIGITAL_KEYWORDS = [
                'devops', 'développeur', 'developpeur', 'developer', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'fullstack',
                'software', 'ingénieur', 'ingenieur', 'data', 'ml', 'ai', 'cloud', 'sre', 'qa', 'test', 'mobile', 'ios', 'android',
                'react', 'vue', 'angular', 'node', 'python', 'java', 'golang', 'typescript', 'kubernetes', 'aws', 'gcp', 'azure',
                'ux', 'ui', 'designer', 'product', 'scrum', 'po', 'pm', 'secops', 'cyber', 'security', 'sécurité'
            ];
            const isDigitalJob = (job) => {
                const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
                return DIGITAL_KEYWORDS.some(k => text.includes(k));
            };
            const digitalOnly = external.filter(isDigitalJob);
            const base = digitalOnly.length > 0 ? digitalOnly : external;
            const withImages = await enrichJobImages(base);
            const hydrated = user && state.savedJobIds.length > 0
                ? withImages.map(j => ({ ...j, saved: state.savedJobIds.includes(j.id) }))
                : withImages;
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: hydrated });
            dispatch({ type: 'SET_ERROR', payload: hydrated.length === 0 ? "Aucune offre trouvée pour cette recherche." : null });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const generateMockJobs = (query, filters) => {
        const companyNames = ['Techify', 'DataCorp', 'CloudNova', 'PixelWorks', 'InnovaSoft', 'NextGen Labs'];
        const sources = ['LinkedIn', 'Indeed', 'Welcome to the Jungle', 'Glassdoor', 'Apec', 'Pôle Emploi'];
        const positions = ['Développeur Full Stack', 'Développeur Frontend', 'Développeur Backend', 'Ingénieur DevOps', 'Product Manager', 'UX Designer'];
        const locations = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Remote'];
        const contractTypes = ['CDI', 'CDD', 'Intérim', 'Alternance', 'Stage'];
        const sourceDomains = {
            'LinkedIn': 'www.linkedin.com',
            'Indeed': 'www.indeed.fr',
            'Welcome to the Jungle': 'www.welcometothejungle.com',
            'Glassdoor': 'www.glassdoor.fr',
            'Apec': 'www.apec.fr',
            'Pôle Emploi': 'www.pole-emploi.fr'
        };

        const items = Array.from({ length: 24 }, (_, i) => {
            const id = `job-${i + 1}`;
            const source = sources[Math.floor(Math.random() * sources.length)];
            const company = companyNames[Math.floor(Math.random() * companyNames.length)];
            const type = contractTypes[Math.floor(Math.random() * contractTypes.length)];
            const imageUrl = `https://picsum.photos/seed/${i + 1}/640/360`;
            const url = `https://${sourceDomains[source]}/jobs/${id}`;
            return {
                id,
                title: query && query.trim() ? `${query.trim()}` : positions[Math.floor(Math.random() * positions.length)],
                company,
                location: locations[Math.floor(Math.random() * locations.length)],
                remote: Math.random() > 0.5,
                salary: `${Math.floor(Math.random() * 50 + 30)}k-${Math.floor(Math.random() * 80 + 50)}k€`,
                experience: ['Junior', 'Mid-level', 'Senior'][Math.floor(Math.random() * 3)],
                type,
                description: 'Description détaillée du poste avec les compétences requises et les responsabilités...',
                requirements: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
                postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                applied: false,
                saved: false,
                source,
                imageUrl,
                url
            };
        });

        return items;
    };

    const toggleSaveJob = async (jobId) => {
        const wasSaved = state.savedJobIds.includes(jobId);
        dispatch({ type: 'TOGGLE_SAVE_JOB', payload: jobId });
        if (user) {
            if (wasSaved) {
                await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
            } else {
                const job = state.searchResults.find(j => j.id === jobId) || state.jobs.find(j => j.id === jobId);
                if (job) {
                    await supabase.from('saved_jobs').upsert({
                        user_id: user.id,
                        job_id: jobId,
                        job_data: job,
                    });
                }
            }
        }
    };

    const value = {
        ...state,
        addApplication,
        updateApplicationStatus,
        deleteApplication,
        updateApplicationNotes,
        setFilters,
        clearFilters,
        searchJobs,
        toggleSaveJob
    };

    return (
        <JobContext.Provider value={value}>
            {children}
        </JobContext.Provider>
    );
};

export const useJobContext = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobContext must be used within a JobProvider');
    }
    return context;
};
