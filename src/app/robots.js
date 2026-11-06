const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pocketlenss.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private app screens (no trailing slash, so the page itself is covered too)
        disallow: [
          '/api/',
          '/app',
          '/add',
          '/dashboard',
          '/expenses',
          '/budgets',
          '/calendar',
          '/categories',
          '/settings',
          '/verify',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
