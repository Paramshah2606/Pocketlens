export default function manifest() {
  return {
    id: '/',
    // Shown on the Android splash screen and install dialog, so keep it short
    name: 'PocketLens',
    short_name: 'PocketLens',
    description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Shown in the richer install dialog (Chrome / Edge). "wide" = desktop, no form_factor = mobile.
    screenshots: [
      { src: '/screenshots/wide-home.png', sizes: '1920x1200', type: 'image/png', form_factor: 'wide', label: 'PocketLens home' },
      { src: '/screenshots/wide-preview.png', sizes: '1920x1200', type: 'image/png', form_factor: 'wide', label: 'Your monthly spending at a glance' },
      { src: '/screenshots/narrow-home.png', sizes: '1170x2532', type: 'image/png', form_factor: 'narrow', label: 'PocketLens home' },
      { src: '/screenshots/narrow-preview.png', sizes: '1170x2532', type: 'image/png', form_factor: 'narrow', label: 'Your monthly spending at a glance' },
    ],
    shortcuts: [
      { name: 'Expenses', url: '/expenses', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Budgets', url: '/budgets', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
