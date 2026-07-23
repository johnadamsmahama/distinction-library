import Companion from '@/components/vault/Companion';

export default function CompanionPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">AI Study Companion</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Ask questions, request summaries, or attach your notes for grounded answers.
      </p>
      <Companion />
    </div>
  );
}
