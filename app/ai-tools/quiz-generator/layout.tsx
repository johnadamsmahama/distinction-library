export default function QuizGeneratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
        <span className="font-mono text-xs text-white">Quiz Generator</span>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          READY
        </div>
      </div>
      {children}
    </div>
  );
}
