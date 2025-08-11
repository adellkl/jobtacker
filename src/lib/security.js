export function sanitizeUrl(url) {
    try {
        const u = new URL(String(url));
        if (u.protocol === 'http:' || u.protocol === 'https:') {
            return u.toString();
        }
        return '#';
    } catch {
        return '#';
    }
}


