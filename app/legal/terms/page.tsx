export default function TermsOfUsePage() {
  return (
    <div className="max-w-[720px] mx-auto py-16 px-7">
      <h1 className="font-display font-bold text-3xl text-navy mb-2">Terms of Use</h1>
      <div className="font-condensed text-xs uppercase tracking-wide text-g600 mb-8">
        Last updated · July 2026
      </div>

      <p className="font-body text-sm text-g600 leading-relaxed mb-6">
        By using Distinction Library, you agree to the following terms. This platform is a
        student-led initiative and is not officially affiliated with UPSA administration.
      </p>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">Eligibility</h2>
      <p className="font-body text-sm text-g600 leading-relaxed">
        Access is limited to verified UPSA students with a valid @upsamail.edu.gh email address.
      </p>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">Uploading content</h2>
      <ul className="list-disc pl-5 font-body text-sm text-g600 leading-relaxed space-y-1.5">
        <li>Only upload past papers and study materials you have the right to share.</li>
        <li>All uploads are reviewed by a moderator before becoming visible to other students.</li>
        <li>
          Repeated low-quality or inappropriate submissions may result in a strike, and upload
          privileges may be suspended after 3 strikes.
        </li>
      </ul>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">Acceptable use</h2>
      <ul className="list-disc pl-5 font-body text-sm text-g600 leading-relaxed space-y-1.5">
        <li>Don&apos;t attempt to bypass the verification process or impersonate another student.</li>
        <li>
          Don&apos;t upload content that infringes on someone else&apos;s rights or violates UPSA
          academic integrity policies.
        </li>
      </ul>

      <h2 className="font-display font-bold text-lg text-navy mt-8 mb-2">Availability</h2>
      <p className="font-body text-sm text-g600 leading-relaxed">
        Distinction Library is provided free of charge on a best-effort basis. We don&apos;t
        guarantee uninterrupted availability, and features may change as the platform develops.
      </p>
    </div>
  );
}