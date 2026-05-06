const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pocketlenss.vercel.app';
const LAST_MODIFIED = '2026-05-06';

export default function sitemap() {
  return [
    { url: baseUrl,                   lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/features`,     lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/pricing`,      lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`,        lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.8 },
    { url: `${baseUrl}/help`,         lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`,      lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${baseUrl}/privacy`,      lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,        lastModified: LAST_MODIFIED, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
