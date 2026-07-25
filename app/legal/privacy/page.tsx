export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-[720px] mx-auto py-16 px-7">
      <h1 className="font-display font-bold text-3xl text-navy mb-2">Privacy Policy</h1>
      <div className="font-condensed text-xs uppercase tracking-wide text-g600 mb-8">
        Last updated · July 2026
      </div>

      <p className="font-body text-sm text-g600 leading-relaxed mb-6">
        Distinction Library is a free, student-led academic resource platform for verified UPSA
        students. This page explains what information we collect and how it&apos;s used.
      </p>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">What we collect</h2>
      <ul className="list-disc pl-5 font-body text-sm text-g600 leading-relaxed space-y-1.5">
        <li>Your UPSA student ID and email, used to verify you&apos;re a UPSA student and log you in.</li>
        <li>Your full name and department/level, if you provide them.</li>
        <li>Files you upload and basic activity like upload counts and download counts.</li>
        <li>Content you generate privately in your Study Vault — visible only to you.</li>
      </ul>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">How it&apos;s used</h2>
      <ul className="list-disc pl-5 font-body text-sm text-g600 leading-relaxed space-y-1.5">
        <li>To give you access to the platform and verify you&apos;re a genuine UPSA student.</li>
        <li>To display your contributions on the Leaderboard — upload counts only.</li>
        <li>To let moderators review submissions before they&apos;re published to other students.</li>
      </ul>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">What we don&apos;t do</h2>
      <ul className="list-disc pl-5 font-body text-sm text-g600 leading-relaxed space-y-1.5">
        <li>We don&apos;t sell or share your data with third parties.</li>
        <li>We don&apos;t display ads or use your data for advertising.</li>
        <li>Your Study Vault content is never visible to admins, moderators, or other students.</li>
      </ul>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">Changes to this policy</h2>
      <p className="font-body text-sm text-g600 leading-relaxed">
        As the platform grows, this policy may be updated. Significant changes will be noted here
        with a new &quot;last updated&quot; date.
      </p>
    </div>
  );
}