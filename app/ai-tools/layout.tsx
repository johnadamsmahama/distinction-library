import Constellation from '@/components/ai-tools/Constellation';

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden min-h-screen" style={{ backgroundColor: '#0E1830' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(120% 90% at 50% -10%, rgba(20,33,61,0) 0%, #0E1830 65%)',
        }}
      />
      <Constellation />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-14">{children}</div>
    </div>
  );
}
