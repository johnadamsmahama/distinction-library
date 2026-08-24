import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Revision Summit — Mock Session, Distinction Library';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          background: 'linear-gradient(180deg, #0a1628 0%, #0f2340 100%)',
          position: 'relative',
        }}
      >
        {/* corner brackets */}
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 36,
            width: 34,
            height: 34,
            borderTop: '2px solid #d4af37',
            borderLeft: '2px solid #d4af37',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            right: 36,
            width: 34,
            height: 34,
            borderBottom: '2px solid #d4af37',
            borderRight: '2px solid #d4af37',
          }}
        />

        {/* top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#f0d878',
                textTransform: 'uppercase',
              }}
            >
              J.A. Mahama Distinction Programme
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(245,241,230,0.5)',
                marginTop: 6,
                letterSpacing: '0.05em',
              }}
            >
              DISTINCTION LIBRARY · UPSA
            </div>
          </div>
        </div>

        {/* middle */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.02 }}>
            <span style={{ fontSize: 76, fontWeight: 700, color: '#f5f1e6' }}>Revision</span>
            <span style={{ fontSize: 76, fontWeight: 700, color: '#d4af37' }}>Summit.</span>
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: 'rgba(245,241,230,0.8)',
              marginTop: 14,
              paddingLeft: 16,
              borderLeft: '3px solid #d4af37',
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
                  border: '1px solid rgba(212,175,55,0.35)',
                  background: 'rgba(212,175,55,0.06)',
                  padding: '12px 20px',
                  marginRight: 14,
                  borderRadius: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: '#f0d878',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {d.k}
                </span>
                <span style={{ fontSize: 18, color: '#f5f1e6', fontWeight: 700 }}>{d.v}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(212,175,55,0.35)',
                background: 'rgba(212,175,55,0.06)',
                padding: '12px 20px',
                borderRadius: 3,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: '#f0d878',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Mode
              </span>
              <span style={{ fontSize: 18, color: '#f5f1e6', fontWeight: 700 }}>Online</span>
              <span style={{ fontSize: 12, color: 'rgba(245,241,230,0.55)', marginTop: 2 }}>
                Google Classroom
              </span>
            </div>
          </div>

          <div style={{ fontSize: 15, fontWeight: 500, color: '#f0d878', marginTop: 16, display: 'flex' }}>
            Data stipend available for students joining online
          </div>
        </div>

        {/* bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '0.03em',
              color: '#0a1628',
              background: 'linear-gradient(180deg, #f0d878, #d4af37)',
              padding: '16px 28px',
              borderRadius: 4,
              display: 'flex',
            }}
          >
            TAP TO JOIN →
          </div>
          <div style={{ fontSize: 13, color: 'rgba(245,241,230,0.4)', letterSpacing: '0.04em' }}>
            distinctionlibrary.com/revision-summit
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
