'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EventItem } from '@/lib/events-data';
import CustomSelect from '@/components/ui/CustomSelect';

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'revision_session', label: 'Revision Session' },
  { value: 'career_fair', label: 'Career Fair' },
  { value: 'info_session', label: 'Info Session' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  id: null as string | null,
  title: '',
  description: '',
  eventType: 'workshop' as EventItem['event_type'],
  startTime: '',
  endTime: '',
  location: '',
  status: 'draft' as EventItem['status'],
};

export default function EventManager({ events: initialEvents }: { events: EventItem[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = form.id !== null;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError(null);
  };

  const startEdit = (e: EventItem) => {
    setForm({
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.event_type,
      startTime: toLocalInputValue(e.start_time),
      endTime: e.end_time ? toLocalInputValue(e.end_time) : '',
      location: e.location ?? '',
      status: e.status,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);

    if (!form.title.trim()) return setError('Enter a title.');
    if (!form.description.trim()) return setError('Add a description.');
    if (!form.startTime) return setError('Pick a start date and time.');

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

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      event_type: form.eventType,
      start_time: new Date(form.startTime).toISOString(),
      end_time: form.endTime ? new Date(form.endTime).toISOString() : null,
      location: form.location.trim() || null,
      status: form.status,
    };

    if (isEditing) {
      const { error: updateErr } = await supabase.from('events').update(payload).eq('id', form.id!);
      if (updateErr) {
        setSaving(false);
        setError(updateErr.message);
        return;
      }
    } else {
      const { error: insertErr } = await supabase.from('events').insert({ ...payload, created_by: user.id });
      if (insertErr) {
        setSaving(false);
        setError(insertErr.message);
        return;
      }
    }

    const { data: refreshed } = await supabase
      .from('events')
      .select('id, title, description, event_type, start_time, end_time, location, status, created_at')
      .order('start_time', { ascending: true });

    setSaving(false);
    if (refreshed) setEvents(refreshed as EventItem[]);
    resetForm();
  };

  const togglePublished = async (e: EventItem) => {
    const supabase = createClient();
    const newStatus = e.status === 'published' ? 'draft' : 'published';
    const { error: updateErr } = await supabase.from('events').update({ status: newStatus }).eq('id', e.id);
    if (updateErr) {
      alert(updateErr.message);
      return;
    }
    setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: newStatus } : x)));
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Permanently delete this event? This cannot be undone.')) return;
    const supabase = createClient();
    const { error: deleteErr } = await supabase.from('events').delete().eq('id', id);
    if (deleteErr) {
      alert(deleteErr.message);
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="bg-white border border-g100 rounded-2xl p-6 space-y-4 h-fit">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg text-navy">
            {isEditing ? 'Edit event' : 'Add an event'}
          </h2>
          {isEditing && (
            <button type="button" onClick={resetForm} className="font-condensed font-bold text-xs uppercase tracking-wide text-g600 hover:text-navy transition-colors">
              Cancel
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={inputClass}
            placeholder="e.g. Mid-semester Revision Session — COM 201"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={`${inputClass} min-h-[90px] resize-y`}
            placeholder="What should students expect from this event?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Event type</label>
            <CustomSelect
              value={form.eventType}
              onChange={(v) => setForm((f) => ({ ...f, eventType: v as EventItem['event_type'] }))}
              options={EVENT_TYPES}
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className={inputClass}
              placeholder="e.g. Auditorium, or Online"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Starts</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ends (optional)</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.status === 'published'}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'published' : 'draft' }))}
            className="w-4 h-4 accent-gold"
          />
          <span className="font-condensed font-semibold text-xs uppercase tracking-wide text-g800">
            Published — visible to students
          </span>
        </label>

        {error && <p className="font-body text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add event'}
        </button>
      </form>

      <div>
        <h2 className="font-display font-bold text-lg text-navy mb-4">All events ({events.length})</h2>
        <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
          {events.length === 0 && <p className="font-body text-sm text-g600">No events added yet.</p>}
          {events.map((e) => (
            <div key={e.id} className="bg-white border border-g100 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="font-condensed font-semibold text-sm text-g800 truncate flex-1">{e.title}</div>
                <span
                  className={`font-condensed font-bold text-[9.5px] uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                    e.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-g100 text-g600'
                  }`}
                >
                  {e.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="font-body text-xs text-g600 mt-1">
                {formatEventDate(e.start_time)}
                {e.location ? ` · ${e.location}` : ''}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startEdit(e)}
                  className="flex-1 font-condensed font-bold text-[11px] uppercase tracking-wide text-navy bg-off-white border border-g100 rounded-lg py-2 hover:border-gold transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => togglePublished(e)}
                  className="flex-1 font-condensed font-bold text-[11px] uppercase tracking-wide text-navy bg-off-white border border-g100 rounded-lg py-2 hover:border-gold transition-colors"
                >
                  {e.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => deleteEvent(e.id)}
                  aria-label={`Delete ${e.title}`}
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

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
