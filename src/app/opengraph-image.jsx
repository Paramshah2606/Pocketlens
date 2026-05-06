import { ImageResponse } from 'next/og';

export const alt = 'PocketLens — Smart Expense Tracking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #6366f1 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 900, color: 'white', marginBottom: 24, letterSpacing: '-2px' }}>
        PocketLens
      </div>
      <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 800 }}>
        Smart Expense Tracking for Modern Lives
      </div>
      <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.55)', marginTop: 40 }}>
        pocketlenss.vercel.app
      </div>
    </div>,
    { ...size }
  );
}
