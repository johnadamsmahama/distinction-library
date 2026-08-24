import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Revision Summit — Mock Session, J.A. Mahama Distinction Programme';
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
          padding: '60px 68px 52px',
          background: 'linear-gradient(160deg, #0e1c3f 0%, #16305e 55%, #1c3d78 100%)',
          position: 'relative',
          fontFamily: 'Inter',
        }}
      >
        {/* corner brackets */}
        <div
          style={{
            position: 'absolute',
            top: 34,
            left: 34,
            width: 36,
            height: 36,
            borderTop: '4px solid #d4af37',
            borderLeft: '4px solid #d4af37',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 34,
            right: 34,
            width: 36,
            height: 36,
            borderBottom: '4px solid #d4af37',
            borderRight: '4px solid #d4af37',
          }}
        />

        {/* top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 19,
                fontWeight: 900,
                letterSpacing: '0.16em',
                color: '#f5da8a',
                textTransform: 'uppercase',
              }}
            >
              J.A. Mahama Distinction Programme
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: '#ffffff',
                marginTop: 9,
                letterSpacing: '0.05em',
              }}
            >
              PEER-LED PREP SERIES · UPSA
            </div>
          </div>
        </div>

        {/* middle */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.02 }}>
            <span style={{ fontSize: 78, fontWeight: 900, color: '#ffffff' }}>Revision</span>
            <span style={{ fontSize: 78, fontWeight: 900, color: '#e0b74a' }}>Summit.</span>
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#ffffff',
              marginTop: 20,
              paddingLeft: 18,
              borderLeft: '6px solid #e0b74a',
            }}
          >
            BGEC102 — Scholarly Writing · Mock Session
          </div>

          <div style={{ display: 'flex', marginTop: 32 }}>
            {[
              { k: 'Date', v: '25 Aug' },
              { k: 'Time', v: '8:30 PM' },
            ].map((d) => (
              <div
                key={d.k}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid rgba(224,183,74,0.6)',
                  background: 'rgba(224,183,74,0.14)',
                  padding: '14px 24px',
                  marginRight: 14,
                  borderRadius: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    color: '#f5da8a',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {d.k}
                </span>
                <span style={{ fontSize: 24, color: '#ffffff', fontWeight: 900 }}>{d.v}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid rgba(224,183,74,0.6)',
                background: 'rgba(224,183,74,0.14)',
                padding: '14px 24px',
                borderRadius: 3,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  color: '#f5da8a',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Mode
              </span>
              <span style={{ fontSize: 24, color: '#ffffff', fontWeight: 900 }}>Online</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', marginTop: 3 }}>
                Google Classroom
              </span>
            </div>
          </div>

          <div style={{ fontSize: 21, fontWeight: 900, color: '#f5da8a', marginTop: 22, display: 'flex' }}>
            Data stipend available for students joining online
          </div>
        </div>

        {/* bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 21,
              fontWeight: 900,
              letterSpacing: '0.03em',
              color: '#08132b',
              background: 'linear-gradient(180deg, #f5da8a, #e0b74a)',
              padding: '18px 32px',
              borderRadius: 4,
              display: 'flex',
            }}
          >
            TAP TO JOIN →
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
            distinctionlibrary.com/revision-summit
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interBlack,
          weight: 900,
          style: 'normal',
        },
      ],
    }
  );
}
