// Service de récupération d'offres d'emploi (JSearch via RapidAPI)

const RPD_HOST = 'jsearch.p.rapidapi.com';

const mapEmploymentTypeToFr = (type) => {
  const upper = (type || '').toUpperCase();
  switch (upper) {
    case 'FULLTIME':
    case 'FULL-TIME':
      return 'CDI';
    case 'CONTRACT':
    case 'PARTTIME':
    case 'PART-TIME':
      return 'CDD';
    case 'TEMPORARY':
      return 'Intérim';
    case 'INTERNSHIP':
      return 'Stage';
    case 'APPRENTICESHIP':
    case 'APPRENTICE':
      return 'Alternance';
    default:
      return 'CDI';
  }
};

const buildQuery = (query, filters) => {
  const parts = [query];
  if (filters?.keywords) parts.push(filters.keywords);
  if (filters?.company) parts.push(`company:${filters.company}`);
  if (filters?.location) parts.push(`location:${filters.location}`);
  if (filters?.remote) parts.push('remote');
  return parts.filter(Boolean).join(' ');
};

export async function searchJobsApi(query, filters = {}, { page = 1 } = {}) {
  const key = import.meta.env.VITE_RAPIDAPI_KEY;
  if (!key) {
    // Si pas de clé, retourner tableau vide pour forcer l'utilisateur à configurer l'API
    return [];
  }

  const url = new URL(`https://${RPD_HOST}/search`);
  url.searchParams.set('query', buildQuery(query, filters));
  url.searchParams.set('page', String(page));
  url.searchParams.set('num_pages', '1');

  const resp = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': RPD_HOST,
    },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch jobs: ${resp.status}`);
  }
  const json = await resp.json();
  const items = Array.isArray(json?.data) ? json.data : [];

  // Mapping vers le format interne
  const results = items.map((it, idx) => {
    const title = it.job_title || 'Poste';
    const company = it.employer_name || it.job_highlights?.Company?.[0] || 'Entreprise';
    const city = it.job_city || '';
    const country = it.job_country || '';
    const location = [city, country].filter(Boolean).join(', ');
    const remote = Boolean(it.job_is_remote);
    const min = it.job_min_salary ? Math.round(Number(it.job_min_salary) / 1000) : null;
    const max = it.job_max_salary ? Math.round(Number(it.job_max_salary) / 1000) : null;
    const salary = min && max ? `${min}k-${max}k€` : max ? `${max}k€` : '—';
    const type = mapEmploymentTypeToFr(it.job_employment_type);
    const description = it.job_description || '';
    const postedAt = it.job_posted_at_datetime_utc || new Date().toISOString();
    const source = it.job_publisher || 'Inconnu';
    const url = it.job_apply_link || it.job_google_link || '#';
    let imageUrl = it.employer_logo || '';
    if (!imageUrl && url) {
      try {
        const hostname = new URL(url).hostname;
        imageUrl = `https://logo.clearbit.com/${hostname}`;
      } catch { }
    }
    if (!imageUrl) imageUrl = `https://picsum.photos/seed/${idx + 1}/640/360`;

    return {
      id: it.job_id || `${Date.now()}-${idx}`,
      title,
      company,
      location,
      remote,
      salary,
      experience: '',
      type,
      description,
      requirements: it.job_required_skills || [],
      postedAt,
      applied: false,
      saved: false,
      source,
      imageUrl,
      url,
    };
  });

  return results;
}

// Fallback gratuit: Remotive (emplois remote)
async function fetchRemotiveJobs(query) {
  const resp = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query || '')}`);
  if (!resp.ok) return [];
  const json = await resp.json();
  const items = Array.isArray(json?.jobs) ? json.jobs : [];
  return items.map((it, idx) => {
    const title = it.title || 'Poste';
    const company = it.company_name || 'Entreprise';
    const location = it.candidate_required_location || 'Remote';
    const remote = true;
    const salary = it.salary || '—';
    const type = it.job_type || '';
    const description = it.description || '';
    const postedAt = it.publication_date || new Date().toISOString();
    const source = 'Remotive';
    const imageUrl = it.company_logo_url || '';
    const url = it.url || '#';
    return {
      id: it.id ? String(it.id) : `remotive-${idx}`,
      title,
      company,
      location,
      remote,
      salary,
      experience: '',
      type,
      description,
      requirements: [],
      postedAt,
      applied: false,
      saved: false,
      source,
      imageUrl,
      url,
    };
  });
}

export async function searchJobsExternal(query, filters = {}) {
  const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const desired = normalize(filters.source || '');

  // 1) JSearch (agrégateur: LinkedIn, Indeed, Glassdoor, etc.)
  let j = [];
  try { j = await searchJobsApi(query, filters); } catch { }

  const matchesDesired = (src) => {
    const n = normalize(src);
    if (!desired) return true;
    if (desired === 'welcome to the jungle') return n.includes('welcome');
    if (desired === 'pole emploi') return n.includes('pole') || n.includes('p\u00f4le') || n.includes('emploi');
    return n.includes(desired);
  };

  if (desired) {
    const preferred = (j || []).filter((it) => matchesDesired(it.source));
    if (preferred.length > 0) return dedupe(preferred);
    if (desired.includes('remotive')) {
      try { return dedupe(await fetchRemotiveJobs(query)); } catch { return []; }
    }
    if (desired.includes('arbeitnow')) {
      try { return dedupe(await fetchArbeitnowJobs(query)); } catch { return []; }
    }
    return [];
  }

  // 2) Aucune source choisie: agrégation multi-sources (toutes)
  const results = [];
  if (Array.isArray(j)) results.push(...j);
  try { const a = await fetchArbeitnowJobs(query); if (Array.isArray(a)) results.push(...a); } catch { }
  try { const r = await fetchRemotiveJobs(query); if (Array.isArray(r)) results.push(...r); } catch { }
  return dedupe(results);
}

export async function enrichJobImages(jobs) {
  const enriched = await Promise.all(
    jobs.map(async (job) => {
      if (job.imageUrl) return job;
      const jobUrl = job.url;
      if (typeof jobUrl !== 'string' || !jobUrl.startsWith('http')) return job;
      // Tenter Microlink pour og:image/logo
      try {
        const resp = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(jobUrl)}&audio=false&video=false&screenshot=false`);
        if (resp.ok) {
          const data = await resp.json();
          const ogImage = data?.data?.image?.url || data?.data?.logo?.url;
          if (ogImage) return { ...job, imageUrl: ogImage };
        }
      } catch { }
      // Fallback Clearbit
      try {
        const hostname = new URL(jobUrl).hostname;
        return { ...job, imageUrl: `https://logo.clearbit.com/${hostname}` };
      } catch {
        return job;
      }
    })
  );
  return enriched;
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const job of list) {
    const key = job.url || job.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

// Arbeitnow: API publique job-board (concentre beaucoup de jobs tech)
async function fetchArbeitnowJobs(query) {
  const resp = await fetch('https://www.arbeitnow.com/api/job-board-api');
  if (!resp.ok) return [];
  const json = await resp.json();
  const items = Array.isArray(json?.data) ? json.data : [];
  const q = (query || '').toLowerCase();
  return items
    .filter((it) => {
      if (!q) return true;
      const text = `${it.title || ''} ${it.company || ''} ${it.description || ''}`.toLowerCase();
      return text.includes(q);
    })
    .map((it, idx) => {
      const title = it.title || 'Poste';
      const company = it.company || 'Entreprise';
      const location = it.location || (it.remote ? 'Remote' : '—');
      const remote = Boolean(it.remote);
      const salary = it.salary || '—';
      const type = (Array.isArray(it.job_types) && it.job_types[0]) || '';
      const description = it.description || '';
      const postedAt = it.created_at || new Date().toISOString();
      const source = 'Arbeitnow';
      const url = it.url || '#';
      return {
        id: it.slug ? `arbeitnow-${it.slug}` : `arbeitnow-${idx}`,
        title,
        company,
        location,
        remote,
        salary,
        experience: '',
        type,
        description,
        requirements: Array.isArray(it.tags) ? it.tags : [],
        postedAt,
        applied: false,
        saved: false,
        source,
        imageUrl: '',
        url,
      };
    });
}


