// Lightweight jobs aggregation API for the app (CommonJS)
// Run on: http://localhost:5175
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());

const RPD_HOST = 'jsearch.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY || '';

const DIGITAL_KEYWORDS = [
    'devops', 'développeur', 'developpeur', 'developer', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'fullstack',
    'software', 'ingénieur', 'ingenieur', 'data', 'ml', 'ai', 'cloud', 'sre', 'qa', 'test', 'mobile', 'ios', 'android',
    'react', 'vue', 'angular', 'node', 'python', 'java', 'golang', 'typescript', 'kubernetes', 'aws', 'gcp', 'azure',
    'ux', 'ui', 'designer', 'product', 'scrum', 'po', 'pm', 'secops', 'cyber', 'security', 'sécurité'
];

const normalizeType = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('FULL')) return 'CDI';
    if (t.includes('PART') || t.includes('CONTRACT')) return 'CDD';
    if (t.includes('TEMP')) return 'Intérim';
    if (t.includes('INTERN')) return 'Stage';
    return type || '';
};

const mapJSearch = (items = []) => {
    return items.map((it, idx) => {
        const city = it.job_city || '';
        const country = it.job_country || '';
        const location = [city, country].filter(Boolean).join(', ');
        const min = it.job_min_salary ? Math.round(Number(it.job_min_salary) / 1000) : null;
        const max = it.job_max_salary ? Math.round(Number(it.job_max_salary) / 1000) : null;
        const salary = min && max ? `${min}k-${max}k€` : max ? `${max}k€` : '—';
        const url = it.job_apply_link || it.job_google_link || '#';
        let imageUrl = it.employer_logo || '';
        if (!imageUrl && url) {
            try { const hostname = new URL(url).hostname; imageUrl = `https://logo.clearbit.com/${hostname}`; } catch { }
        }
        return {
            id: it.job_id || `j-${idx}`,
            title: it.job_title || 'Poste',
            company: it.employer_name || 'Entreprise',
            location,
            remote: Boolean(it.job_is_remote),
            salary,
            experience: '',
            type: normalizeType(it.job_employment_type),
            description: it.job_description || '',
            requirements: it.job_required_skills || [],
            postedAt: it.job_posted_at_datetime_utc || new Date().toISOString(),
            applied: false,
            saved: false,
            source: it.job_publisher || 'JSearch',
            imageUrl,
            url,
        };
    });
};

const fetchJSearch = async (q) => {
    if (!RAPIDAPI_KEY) return [];
    const url = new URL(`https://${RPD_HOST}/search`);
    url.searchParams.set('query', q || '');
    url.searchParams.set('page', '1');
    url.searchParams.set('num_pages', '1');
    const resp = await fetch(url.toString(), { headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RPD_HOST } });
    if (!resp.ok) return [];
    const json = await resp.json();
    return mapJSearch(json?.data || []);
};

const fetchRemotive = async (q) => {
    const resp = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q || '')}`);
    if (!resp.ok) return [];
    const json = await resp.json();
    const items = Array.isArray(json?.jobs) ? json.jobs : [];
    return items.map((it, idx) => ({
        id: it.id ? `rem-${it.id}` : `rem-${idx}`,
        title: it.title || 'Poste',
        company: it.company_name || 'Entreprise',
        location: it.candidate_required_location || 'Remote',
        remote: true,
        salary: it.salary || '—',
        experience: '',
        type: it.job_type || '',
        description: it.description || '',
        requirements: [],
        postedAt: it.publication_date || new Date().toISOString(),
        applied: false,
        saved: false,
        source: 'Remotive',
        imageUrl: it.company_logo_url || '',
        url: it.url || '#',
    }));
};

const fetchArbeitnow = async (q) => {
    const resp = await fetch('https://www.arbeitnow.com/api/job-board-api');
    if (!resp.ok) return [];
    const json = await resp.json();
    const items = Array.isArray(json?.data) ? json.data : [];
    const qn = (q || '').toLowerCase();
    return items
        .filter((it) => {
            if (!qn) return true;
            const text = `${it.title || ''} ${it.company || ''} ${it.description || ''}`.toLowerCase();
            return text.includes(qn);
        })
        .map((it, idx) => ({
            id: it.slug ? `arb-${it.slug}` : `arb-${idx}`,
            title: it.title || 'Poste',
            company: it.company || 'Entreprise',
            location: it.location || (it.remote ? 'Remote' : '—'),
            remote: Boolean(it.remote),
            salary: it.salary || '—',
            experience: '',
            type: (Array.isArray(it.job_types) && it.job_types[0]) || '',
            description: it.description || '',
            requirements: Array.isArray(it.tags) ? it.tags : [],
            postedAt: it.created_at || new Date().toISOString(),
            applied: false,
            saved: false,
            source: 'Arbeitnow',
            imageUrl: '',
            url: it.url || '#',
        }));
};

const dedupe = (list) => {
    const seen = new Set();
    const out = [];
    for (const j of list) {
        const key = j.url || j.id;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(j);
    }
    return out;
};

app.get('/api/jobs', async (req, res) => {
    try {
        const q = (req.query.q || '').toString();
        const source = (req.query.source || 'LinkedIn').toString();
        // Build aggregator
        let all = [];
        const j = await fetchJSearch(q);
        const prefer = (src) => j.filter(x => (x.source || '').toLowerCase().includes(src.toLowerCase()));
        if (source) {
            const preferred = prefer(source);
            if (preferred.length > 0) all = preferred;
        }
        if (all.length === 0) {
            // fallback aggregate
            all = [...j, ...(await fetchArbeitnow(q)), ...(await fetchRemotive(q))];
        }
        // Keep only digital jobs
        const digital = all.filter(job => DIGITAL_KEYWORDS.some(k => `${job.title} ${job.description}`.toLowerCase().includes(k)));
        const unique = dedupe(digital.length > 0 ? digital : all);
        res.json({ jobs: unique.slice(0, 60) });
    } catch (e) {
        res.status(500).json({ error: e?.message || 'Server error' });
    }
});

const PORT = process.env.API_PORT || 5175;
app.listen(PORT, () => {
    console.log(`Jobs API listening on http://localhost:${PORT}`);
});


