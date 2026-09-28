import Link from 'next/link';
import BackLink from '@/components/shared/BackLink';
import PublicContactForm from '@/components/contact/PublicContactForm';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-content mx-auto px-5 sm:px-7 py-10">
        <BackLink href="/" label="Home" className="mb-6" />

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
