const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pocketlens.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/forgot-password'],
        disallow: [
          '/api/',
          '/dashboard',
          '/expenses',
          '/budgets',
          '/settings',
          '/verify',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
