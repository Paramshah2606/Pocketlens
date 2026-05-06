const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pocketlenss.vercel.app';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/expenses/',
          '/budgets/',
          '/settings/',
          '/verify/',
          '/reset-password/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
