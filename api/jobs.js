// API serverless d'agrégation d'offres (Vercel/Netlify compatible)
// Endpoint: /api/jobs?q=react&source=LinkedIn&location=Paris&remote=true&type=CDI&datePosted=7d&company=Doctolib

export default async function handler(req, res) {
    try {
        const RPD_HOST = 'jsearch.p.rapidapi.com';
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY || '';

        const DIGITAL_KEYWORDS = [
            'devops', 'développeur', 'developpeur', 'developer', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'fullstack',
            'software', 'ingénieur', 'ingenieur', 'data', 'ml', 'ai', 'cloud', 'sre', 'qa', 'test', 'mobile', 'ios', 'android',
            'react', 'vue', 'angular', 'node', 'python', 'java', 'golang', 'typescript', 'kubernetes', 'aws', 'gcp', 'azure',
            'ux', 'ui', 'designer', 'product', 'scrum', 'po', 'pm', 'secops', 'cyber', 'security', 'sécurité'
        ];

        const q = (req.query.q || '').toString();
        const source = (req.query.source || '').toString();
        const locationParam = (req.query.location || '').toString();
        const companyParam = (req.query.company || '').toString();
        const typeParam = (req.query.type || '').toString(); // CDI, CDD, Intérim, Stage
        const datePosted = (req.query.datePosted || '').toString(); // 24h, 7d, 14d, 30d
        const remoteOnly = ['1', 'true', 'yes', 'on'].includes(String(req.query.remote || '').toLowerCase());

        const normalizeType = (t = '') => {
            const u = t.toUpperCase();
            if (u.includes('FULL')) return 'CDI';
            if (u.includes('PART') || u.includes('CONTRACT')) return 'CDD';
            if (u.includes('TEMP')) return 'Intérim';
            if (u.includes('INTERN')) return 'Stage';
            return t || '';
        };

        const mapJSearch = (items = []) => items.map((it, idx) => {
            const city = it.job_city || '';
            const country = it.job_country || '';
            const location = [city, country].filter(Boolean).join(', ');
            const min = it.job_min_salary ? Math.round(Number(it.job_min_salary) / 1000) : null;
            const max = it.job_max_salary ? Math.round(Number(it.job_max_salary) / 1000) : null;
            const salary = min && max ? `${min}k-${max}k€` : max ? `${max}k€` : '—';
            const url = it.job_apply_link || it.job_google_link || '#';
            let imageUrl = it.employer_logo || '';
            if (!imageUrl && url) { try { imageUrl = `https://logo.clearbit.com/${new URL(url).hostname}` } catch { } }
            return {
                id: it.job_id || `j-${idx}`,
                title: it.job_title || 'Poste',
                company: it.employer_name || 'Entreprise',
                location,
                remote: !!it.job_is_remote,
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

        const fetchJSearch = async (query, locStr, companyStr, remoteFlag) => {
            if (!RAPIDAPI_KEY) return [];
            const u = new URL(`https://${RPD_HOST}/search`);
            // Composer une requête plus riche: q + location + company + remote
            const tokens = [];
            if (query) tokens.push(query);
            if (locStr) tokens.push(`location:${locStr}`);
            if (companyStr) tokens.push(`company:${companyStr}`);
            if (remoteFlag) tokens.push('remote');
            u.searchParams.set('query', tokens.join(' '));
            u.searchParams.set('page', '1');
            u.searchParams.set('num_pages', '1');
            const r = await fetch(u.toString(), { headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RPD_HOST } });
            if (!r.ok) return [];
            const j = await r.json();
            return mapJSearch(j?.data || []);
        };

        const fetchRemotive = async (query) => {
            const r = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query || '')}`);
            if (!r.ok) return [];
            const j = await r.json();
            const items = Array.isArray(j?.jobs) ? j.jobs : [];
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

        const fetchArbeitnow = async (query) => {
            const r = await fetch('https://www.arbeitnow.com/api/job-board-api');
            if (!r.ok) return [];
            const j = await r.json();
            const items = Array.isArray(j?.data) ? j.data : [];
            const qn = (query || '').toLowerCase();
            return items
                .filter(it => !qn ? true : (`${it.title || ''} ${it.company || ''} ${it.description || ''}`.toLowerCase().includes(qn)))
                .map((it, idx) => ({
                    id: it.slug ? `arb-${it.slug}` : `arb-${idx}`,
                    title: it.title || 'Poste',
                    company: it.company || 'Entreprise',
                    location: it.location || (it.remote ? 'Remote' : '—'),
                    remote: !!it.remote,
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
            const seen = new Set(); const out = [];
            for (const j of list) { const key = j.url || j.id; if (!key || seen.has(key)) continue; seen.add(key); out.push(j); }
            return out;
        };

        // Agrégation multi-sources
        const [j, a, r] = await Promise.all([
            fetchJSearch(q, locationParam, companyParam, remoteOnly),
            fetchArbeitnow(q),
            fetchRemotive(q)
        ]);
        let all = [...j, ...a, ...r];

        if (source) {
            const sn = source.toLowerCase();
            all = all.filter(x => (x.source || '').toLowerCase().includes(sn) || (sn.includes('welcome') && (x.source || '').toLowerCase().includes('welcome')));
        }

        // Restreindre aux sources demandées: LinkedIn, Welcome to the Jungle, Monster, Indeed
        const ALLOWED_SOURCES = ['linkedin', 'welcome to the jungle', 'welcometothejungle', 'monster', 'indeed'];
        all = all.filter(x => {
            const s = (x.source || '').toLowerCase();
            return ALLOWED_SOURCES.some(k => s.includes(k));
        });

        // Post-filtrage côté API pour fiabiliser
        if (locationParam) {
            const ln = locationParam.toLowerCase();
            all = all.filter(job => (job.location || '').toLowerCase().includes(ln));
        }
        if (companyParam) {
            const cn = companyParam.toLowerCase();
            all = all.filter(job => (job.company || '').toLowerCase().includes(cn));
        }
        if (remoteOnly) {
            all = all.filter(job => job.remote);
        }
        if (typeParam) {
            const tn = typeParam.toLowerCase();
            const mapEq = (t) => (t || '').toString().toLowerCase();
            all = all.filter(job => mapEq(job.type).includes(tn));
        }
        if (datePosted) {
            const days = { '24h': 1, '7d': 7, '14d': 14, '30d': 30 }[datePosted] || 0;
            if (days > 0) {
                const since = Date.now() - days * 24 * 60 * 60 * 1000;
                all = all.filter(job => new Date(job.postedAt).getTime() >= since);
            }
        }

        const isDigital = job => DIGITAL_KEYWORDS.some(k => (`${job.title} ${job.description}`).toLowerCase().includes(k));
        const digital = all.filter(isDigital);
        const unique = dedupe(digital.length ? digital : all);

        res.status(200).json({ jobs: unique.slice(0, 100) });
    } catch (e) {
        res.status(500).json({ error: e?.message || 'Server error' });
    }
}


