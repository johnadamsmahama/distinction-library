import QuizGenerator from '@/components/vault/QuizGenerator';

export default function QuizGeneratorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">AI Quiz Generator</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Paste your notes or upload a PDF — get back a quiz with explanations, saved privately to
        your Study Vault.
      </p>
      <QuizGenerator />
    </div>
  );
}
