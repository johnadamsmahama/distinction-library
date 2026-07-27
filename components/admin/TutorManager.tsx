'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tutor } from '@/lib/tutors-data';
import type { CourseOption } from '@/lib/papers-data';
import CustomSelect from '@/components/ui/CustomSelect';
import MultiSelect from '@/components/ui/MultiSelect';

const LEVELS = ['100', '200', '300', '400'];

const EMPTY_FORM = {
  id: null as string | null,
  fullName: '',
  department: '',
  level: '100',
  bio: '',
  whatsapp: '',
  email: '',
  availability: '',
  isActive: true,
  courseIds: [] as string[],
  photoUrl: null as string | null,
};

export default function TutorManager({
  tutors: initialTutors,
  courses,
}: {
  tutors: Tutor[];
  courses: CourseOption[];
}) {
  const [tutors, setTutors] = useState(initialTutors);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = form.id !== null;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setError(null);
  };

  const startEdit = (t: Tutor) => {
    setForm({
      id: t.id,
      fullName: t.full_name,
      department: t.department,
      level: t.level,
      bio: t.bio,
      whatsapp: t.whatsapp_number ?? '',
      email: t.email ?? '',
      availability: t.availability,
      isActive: t.is_active,
      courseIds: t.peer_tutor_courses.map((pc) => pc.courses.id),
      photoUrl: t.photo_url,
    });
    setPhotoFile(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) return setError('Enter the tutor\u2019s full name.');
    if (!form.department.trim()) return setError('Enter a department.');
    if (!form.bio.trim()) return setError('Add a short bio.');
    if (!form.availability.trim()) return setError('Add availability, e.g. "Weekday evenings".');
    if (!form.whatsapp.trim() && !form.email.trim()) {
      return setError('Provide at least one contact method — WhatsApp or email.');
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError('Your session expired — please log in again.');
      return;
    }

    let photoUrl = form.photoUrl;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('tutor-photos').upload(path, photoFile);
      if (uploadErr) {
        setSaving(false);
        setError(uploadErr.message);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('tutor-photos').getPublicUrl(path);
      photoUrl = publicUrlData.publicUrl;
    }

    const payload = {
      full_name: form.fullName.trim(),
      department: form.department.trim(),
      level: form.level,
      bio: form.bio.trim(),
      whatsapp_number: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      availability: form.availability.trim(),
      is_active: form.isActive,
      photo_url: photoUrl,
    };

    let tutorId = form.id;

    if (isEditing) {
      const { error: updateErr } = await supabase.from('peer_tutors').update(payload).eq('id', form.id!);
      if (updateErr) {
        setSaving(false);
        setError(updateErr.message);
        return;
      }
    } else {
      const { data, error: insertErr } = await supabase
        .from('peer_tutors')
        .insert({ ...payload, created_by: user.id })
        .select('id')
        .single();
      if (insertErr) {
        setSaving(false);
        setError(insertErr.message);
        return;
      }
      tutorId = data!.id;
    }

    // Sync the course junction rows — simplest correct approach is delete-then-insert.
    const { error: deleteLinksErr } = await supabase
      .from('peer_tutor_courses')
      .delete()
      .eq('tutor_id', tutorId!);
    if (deleteLinksErr) {
      setSaving(false);
      setError(deleteLinksErr.message);
      return;
    }

    if (form.courseIds.length > 0) {
      const { error: linksErr } = await supabase
        .from('peer_tutor_courses')
        .insert(form.courseIds.map((courseId) => ({ tutor_id: tutorId, course_id: courseId })));
      if (linksErr) {
        setSaving(false);
        setError(linksErr.message);
        return;
      }
    }

    // Re-fetch this tutor's full row (with joined courses) to keep the list accurate.
    const { data: refreshed } = await supabase
      .from('peer_tutors')
      .select(
        'id, full_name, photo_url, department, level, bio, whatsapp_number, email, availability, is_active, peer_tutor_courses(courses(id, code, name))'
      )
      .eq('id', tutorId!)
      .single();

    setSaving(false);

    if (refreshed) {
      const refreshedTutor = refreshed as unknown as Tutor;
      setTutors((prev) => {
        const exists = prev.some((t) => t.id === refreshedTutor.id);
        return exists
          ? prev.map((t) => (t.id === refreshedTutor.id ? refreshedTutor : t))
          : [refreshedTutor, ...prev];
      });
    }

    resetForm();
  };

  const toggleActive = async (t: Tutor) => {
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from('peer_tutors')
      .update({ is_active: !t.is_active })
      .eq('id', t.id);
    if (updateErr) {
      alert(updateErr.message);
      return;
    }
    setTutors((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const deleteTutor = async (id: string) => {
    if (!confirm('Permanently delete this tutor profile? This cannot be undone. Consider deactivating instead.')) return;
    const supabase = createClient();
    const { error: deleteErr } = await supabase.from('peer_tutors').delete().eq('id', id);
    if (deleteErr) {
      alert(deleteErr.message);
      return;
    }
    setTutors((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 h-fit">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg text-navy">
            {isEditing ? 'Edit tutor' : 'Add a peer tutor'}
          </h2>
          {isEditing && (
            <button type="button" onClick={resetForm} className="font-condensed font-bold text-xs uppercase tracking-wide text-g600 hover:text-navy transition-colors">
              Cancel
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>Full name</label>
          <input
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className={inputClass}
            placeholder="e.g. Ama Serwaa Boateng"
          />
        </div>

        <div>
          <label className={labelClass}>Profile photo</label>
          {form.photoUrl && !photoFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photoUrl} alt="Current photo" className="w-16 h-16 rounded-full object-cover mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="w-full font-body text-sm text-g600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Department</label>
            <input
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Communication Studies"
            />
          </div>
          <div>
            <label className={labelClass}>Level</label>
            <CustomSelect
              value={form.level}
              onChange={(v) => setForm((f) => ({ ...f, level: v }))}
              options={LEVELS.map((l) => ({ value: l, label: `Level ${l}` }))}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Courses they can help with</label>
          <MultiSelect
            values={form.courseIds}
            onChange={(v) => setForm((f) => ({ ...f, courseIds: v }))}
            placeholder="Select courses…"
            options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
          />
        </div>

        <div>
          <label className={labelClass}>Bio — &ldquo;How I can help you&rdquo;</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className={`${inputClass} min-h-[90px] resize-y`}
            placeholder="e.g. I scored an A in this course last semester and I'm happy to walk through past questions or review your assignment drafts."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>WhatsApp number</label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              className={inputClass}
              placeholder="e.g. +233241112222"
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
              placeholder="optional if WhatsApp given"
            />
          </div>
        </div>
        <p className="font-body text-xs text-g600 -mt-2">Provide at least one — WhatsApp, email, or both.</p>

        <div>
          <label className={labelClass}>Availability</label>
          <input
            value={form.availability}
            onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
            className={inputClass}
            placeholder="e.g. Weekday evenings, or Weekends only"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 accent-gold"
          />
          <span className="font-condensed font-semibold text-xs uppercase tracking-wide text-g800">
            Active — visible to students
          </span>
        </label>

        {error && <p className="font-body text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add tutor'}
        </button>
      </form>

      <div>
        <h2 className="font-display font-bold text-lg text-navy mb-4">All tutors ({tutors.length})</h2>
        <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
          {tutors.length === 0 && (
            <p className="font-body text-sm text-g600">No tutors added yet.</p>
          )}
          {tutors.map((t) => (
            <div key={t.id} className="bg-white border border-g100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 flex-shrink-0 rounded-full bg-navy overflow-hidden flex items-center justify-center">
                  {t.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-sm text-gold">{t.full_name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-condensed font-semibold text-sm text-g800 truncate">{t.full_name}</div>
                    <span
                      className={`font-condensed font-bold text-[9.5px] uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                        t.is_active ? 'bg-green-50 text-green-700' : 'bg-g100 text-g600'
                      }`}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="font-body text-xs text-g600">
                    {t.department} · Level {t.level} · {t.peer_tutor_courses.length} course
                    {t.peer_tutor_courses.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startEdit(t)}
                  className="flex-1 font-condensed font-bold text-[11px] uppercase tracking-wide text-navy bg-off-white border border-g100 rounded-lg py-2 hover:border-gold transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(t)}
                  className="flex-1 font-condensed font-bold text-[11px] uppercase tracking-wide text-navy bg-off-white border border-g100 rounded-lg py-2 hover:border-gold transition-colors"
                >
                  {t.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteTutor(t.id)}
                  aria-label={`Delete ${t.full_name}`}
                  className="w-9 flex-shrink-0 flex items-center justify-center rounded-lg text-g600 hover:text-red-500 hover:bg-red-50 transition-colors border border-g100"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
