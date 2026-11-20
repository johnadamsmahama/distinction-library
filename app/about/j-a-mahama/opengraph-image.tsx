import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'J.A Mahama (John Adams Mahama) — Student leader, author and founder of Distinction Library';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const interBlack = await fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-normal.ttf'
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px 56px',
          background: 'linear-gradient(160deg, #060F1E 0%, #0D2B5E 100%)',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '0.18em',
            color: '#C9A02C',
          }}
        >
          BIOGRAPHY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 92, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.05 }}>
            J.A Mahama
          </div>
          <div style={{ display: 'flex', fontSize: 38, fontWeight: 900, color: '#E2BE5A', marginTop: 14 }}>
            John Adams Mahama
          </div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 900, color: '#C9D3E6', marginTop: 26 }}>
            Student leader · Author · Founder, Distinction Library
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 22, fontWeight: 900, color: '#8FA2C4' }}>
          distinctionlibrary.com/about/j-a-mahama
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Inter', data: interBlack, weight: 900, style: 'normal' }],
    }
  );
}
