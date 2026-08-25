import Link from 'next/link';
import PublicContactForm from '@/components/contact/PublicContactForm';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-content mx-auto px-5 sm:px-7 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-condensed font-bold text-sm text-gold hover:text-gold-dark mb-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        <h1 className="font-display font-bold text-2xl text-navy mb-1">Contact &amp; Support</h1>
        <p className="font-body text-sm text-g600 mb-6">
          Questions, issues, or feedback — we read every message. Already a student?{' '}
          <Link href="/login" className="text-gold hover:text-gold-dark underline">
            Log in
          </Link>{' '}
          to see your past requests too.
        </p>

        <PublicContactForm />
      </div>
    </div>
  );
}
