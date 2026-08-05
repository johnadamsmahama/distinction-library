import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createOpportunity } from './actions';

const CATEGORY_OPTIONS = [
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'internship', label: 'Internship' },
  { value: 'graduate_programme', label: 'Graduate Programme' },
  { value: 'job', label: 'Job' },
  { value: 'competition', label: 'Competition' },
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'volunteer', label: 'Volunteer' },
];

export default async function NewOpportunityPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/opportunity-hub');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Add Opportunity</h1>
      <p className="font-body text-sm text-g600 mb-6">
        This publishes directly and immediately appears on the Opportunity Hub — no review
        queue.
      </p>

      <form action={createOpportunity} className="space-y-5 bg-white border border-g100 rounded-2xl p-6">
        <div>
          <label htmlFor="title" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="organization" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Organization *
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            required
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="category" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm bg-white"
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="eligibility" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Eligibility
          </label>
          <textarea
            id="eligibility"
            name="eligibility"
            rows={3}
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="deadline" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
              Deadline
            </label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
            />
          </div>
          <div>
            <label htmlFor="remote_or_onsite" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
              Remote / Onsite
            </label>
            <input
              id="remote_or_onsite"
              name="remote_or_onsite"
              type="text"
              placeholder="e.g. Remote, Onsite, Hybrid"
              className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="benefits" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Benefits
          </label>
          <textarea
            id="benefits"
            name="benefits"
            rows={3}
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="required_documents" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Required Documents
          </label>
          <textarea
            id="required_documents"
            name="required_documents"
            rows={3}
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="application_process" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Application Process
          </label>
          <textarea
            id="application_process"
            name="application_process"
            rows={3}
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="application_link" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Application Link
          </label>
          <input
            id="application_link"
            name="application_link"
            type="url"
            placeholder="https://..."
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div>
          <label htmlFor="contact_info" className="block font-condensed text-xs font-bold uppercase tracking-wide text-g600 mb-1">
            Contact Info
          </label>
          <input
            id="contact_info"
            name="contact_info"
            type="text"
            className="w-full border border-g200 rounded-lg px-3 py-2 font-body text-sm"
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label htmlFor="verified" className="flex items-center gap-2 font-body text-sm text-navy">
            <input id="verified" name="verified" type="checkbox" className="rounded border-g200" />
            Verified
          </label>
          <label htmlFor="featured" className="flex items-center gap-2 font-body text-sm text-navy">
            <input id="featured" name="featured" type="checkbox" className="rounded border-g200" />
            Featured
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-navy text-white font-condensed font-bold uppercase tracking-wide text-sm rounded-lg py-3 hover:bg-navy/90 transition-colors"
        >
          Publish Opportunity
        </button>
      </form>
    </div>
  );
}
