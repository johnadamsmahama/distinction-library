import Companion from '@/components/vault/Companion';

export default function CompanionPage() {
  return (
    <div className="relative max-w-2xl mx-auto">
      {/* spotlight glow behind the card, echoing the AI Tools page */}
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-[320px] h-[320px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,160,23,0.28) 0%, rgba(212,160,23,0) 70%)',
          filter: 'blur(2px)',
        }}
      />
      <div className="relative">
        <div className="font-condensed font-bold text-[10.5px] uppercase tracking-widest mb-2 text-gold">
          Distinction Library Intelligence
        </div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">AI Study Companion</h1>
        <p className="font-body text-sm text-white/60 mb-6">
          Ask questions, request summaries, or attach your notes for grounded answers.
        </p>
        <Companion />
      </div>
    </div>
  );
}
