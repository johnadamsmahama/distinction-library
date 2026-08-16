'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  'scholarship',
  'internship',
  'graduate_programme',
  'job',
  'competition',
  'conference',
  'workshop',
  'volunteer',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  scholarship: 'Scholarship',
  internship: 'Internship',
  graduate_programme: 'Graduate Programme',
  job: 'Job',
  competition: 'Competition',
  conference: 'Conference',
  workshop: 'Workshop',
  volunteer: 'Volunteer',
};

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  pending_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-g100 text-g600',
};

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif';

function extensionFor(file: File) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : null;
  return (fromName || file.type.split('/').pop() || 'bin').toLowerCase();
}

type Opportunity = {
  id: string;
  title: string;
  organization: string;
  category: string;
  description: string | null;
  eligibility: string | null;
  deadline: string | null;
  location: string | null;
  remote_or_onsite: string | null;
  application_link: string | null;
  cover_image_url: string | null;
  status: string;
  verified: boolean;
  featured: boolean;
  source: string;
  created_at: string;
};

const emptyForm = {
  title: '',
  organization: '',
  category: 'scholarship' as (typeof CATEGORIES)[number],
  description: '',
  eligibility: '',
  deadline: '',
  location: '',
  remote_or_onsite: '',
  application_link: '',
};

export default function OpportunitiesManager({
  opportunities: initial,
  adminId,
}: {
  opportunities: Opportunity[];
  adminId: string;
}) {
  const [opportunities, setOpportunities] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'published' | 'rejected' | 'expired'>('all');

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (!file) {
      setCoverFile(null);
      setCoverPreviewUrl(null);
      return;
    }
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      setError('Cover image must be JPEG, PNG, WebP, or GIF.');
      e.target.value = '';
      return;
    }
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const createOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.organization.trim()) {
      setError('Title and organization are required.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    let coverImageUrl: string | null = null;
    if (coverFile) {
      const path = `${crypto.randomUUID()}.${extensionFor(coverFile)}`;
      const { error: uploadErr } = await supabase.storage.from('opportunity-images').upload(path, coverFile);
      if (uploadErr) {
        setLoading(false);
        setError(uploadErr.message);
        return;
      }
      const { data: urlData } = supabase.storage.from('opportunity-images').getPublicUrl(path);
      coverImageUrl = urlData.publicUrl;
    }

    const { data, error: insertErr } = await supabase
      .from('opportunities')
      .insert({
        title: form.title.trim(),
        organization: form.organization.trim(),
        category: form.category,
        description: form.description.trim() || null,
        eligibility: form.eligibility.trim() || null,
        deadline: form.deadline || null,
        location: form.location.trim() || null,
        remote_or_onsite: form.remote_or_onsite || null,
        application_link: form.application_link.trim() || null,
        cover_image_url: coverImageUrl,
        source: 'admin_curated',
        status: 'published',
        approved_by: adminId,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();
    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    setOpportunities((prev) => [data as Opportunity, ...prev]);
    setForm(emptyForm);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const updateOpportunity = async (id: string, patch: Record<string, any>) => {
    const supabase = createClient();
    const { error: updateErr } = await supabase.from('opportunities').update(patch).eq('id', id);
    if (updateErr) {
      alert(updateErr.message);
      return;
    }
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const publish = (o: Opportunity) =>
    updateOpportunity(o.id, { status: 'published', approved_by: adminId, published_at: new Date().toISOString() });
  const reject = (o: Opportunity) => updateOpportunity(o.id, { status: 'rejected' });
  const toggleFeatured = (o: Opportunity) => updateOpportunity(o.id, { featured: !o.featured });
  const toggleVerified = (o: Opportunity) => updateOpportunity(o.id, { verified: !o.verified });

  const deleteOpportunity = async (id: string) => {
    if (!confirm('Delete this opportunity permanently?')) return;
    const supabase = createClient();
    await supabase.from('opportunities').delete().eq('id', id);
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  };

  const visible = opportunities.filter((o) => filter === 'all' || o.status === filter);
  const pendingCount = opportunities.filter((o) => o.status === 'pending_review').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={createOpportunity} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 h-fit">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Post a new opportunity</h2>
        <p className="font-body text-xs text-g600 -mt-2 mb-2">
          Publishes immediately, visible to all students right away.
        </p>

        <div>
          <label className={labelClass}>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Organization</label>
          <input
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as any })}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Cover image (optional)</label>
          <input
            ref={coverInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={handleCoverChange}
            className="w-full font-body text-sm text-g600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-g100 file:bg-off-white file:font-condensed file:font-bold file:text-xs file:uppercase file:cursor-pointer"
          />
          <p className="font-body text-xs text-g600 mt-1">JPEG, PNG, WebP, or GIF.</p>
          {coverPreviewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreviewUrl} alt="" className="w-full max-w-[200px] h-28 object-cover rounded-lg mt-2" />
          )}
        </div>
        <div>
          <label className={labelClass}>Description (optional)</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Eligibility (optional)</label>
          <textarea
            rows={2}
            value={form.eligibility}
            onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Deadline (optional)</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Remote / Onsite</label>
            <select
              value={form.remote_or_onsite}
              onChange={(e) => setForm({ ...form, remote_or_onsite: e.target.value })}
              className={inputClass}
            >
              <option value="">Not specified</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Location (optional)</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Application link (optional)</label>
          <input
            value={form.application_link}
            onChange={(e) => setForm({ ...form, application_link: e.target.value })}
            className={inputClass}
            placeholder="https://…"
          />
        </div>
        {error && <p className="font-body text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Posting…' : 'Publish opportunity'}
        </button>
      </form>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-navy">All opportunities ({opportunities.length})</h2>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'pending_review', 'published', 'rejected', 'expired'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-condensed font-bold text-[10px] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                filter === f ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
              {f === 'pending_review' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {visible.map((o) => (
            <div key={o.id} className="bg-white border border-g100 rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-start gap-3 min-w-0">
                  {o.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.cover_image_url}
                      alt=""
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${STATUS_STYLES[o.status]}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                      {o.source === 'student_submitted' && (
                        <span className="font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-navy/10 text-navy">
                          Student submitted
                        </span>
                      )}
                      {o.featured && (
                        <span className="font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-gold/15 text-[#7A5A0E]">
                          Featured
                        </span>
                      )}
                      {o.verified && (
                        <span className="font-condensed font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="font-condensed font-semibold text-sm text-g800">{o.title}</div>
                    <div className="font-body text-xs text-g600">
                      {o.organization} · {CATEGORY_LABELS[o.category] ?? o.category}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {o.status !== 'published' && (
                  <ActionBtn onClick={() => publish(o)}>Publish</ActionBtn>
                )}
                {o.status !== 'rejected' && (
                  <ActionBtn onClick={() => reject(o)}>Reject</ActionBtn>
                )}
                <ActionBtn onClick={() => toggleFeatured(o)}>{o.featured ? 'Unfeature' : 'Feature'}</ActionBtn>
                <ActionBtn onClick={() => toggleVerified(o)}>{o.verified ? 'Unverify' : 'Verify'}</ActionBtn>
                <button
                  onClick={() => deleteOpportunity(o.id)}
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded-full text-g600 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {visible.length === 0 && <p className="font-body text-sm text-g600 text-center py-10">Nothing here.</p>}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-condensed font-bold text-[10px] uppercase px-2.5 py-1.5 rounded-lg border border-g100 text-g600 hover:border-gold hover:text-navy transition-colors"
    >
      {children}
    </button>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors';
