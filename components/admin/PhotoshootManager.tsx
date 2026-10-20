'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/photoshoot';
import TicketScreen, { type Ticket } from './TicketScreen';

type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  id: string;
  code: string;
  name: string;
  phone: string;
  package_name: string;
  package_price: number | null;
  status: BookingStatus;
  created_at: string;
};

export type PhotoPackage = {
  id: string;
  name: string;
  price: number | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

type Tab = 'new' | 'bookings' | 'packages';

const ERRORS: Record<string, string> = {
  invalid_name: 'Enter the full name (at least 3 letters).',
  invalid_phone: 'Enter a valid Ghana phone number.',
  invalid_package: 'Choose a package.',
  duplicate: 'That number already has a booking. Search for it under Bookings.',
  no_codes: 'No free codes left. Delete cancelled bookings to free some up.',
  not_allowed: 'Only admins can add bookings.',
};

const btn =
  'font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-[#D8D3C6] px-2.5 py-1.5 bg-white rounded-none';
const goldBtn =
  'w-full bg-gold text-navy font-condensed font-bold text-sm uppercase tracking-wide px-5 py-2.5 rounded-none hover:bg-gold-light transition-colors disabled:opacity-60';
const inputCls = 'w-full border border-navy px-3.5 py-3 text-sm font-body bg-white rounded-none';
const labelCls = 'block font-condensed font-bold text-[11px] uppercase tracking-wide text-g600 mb-1';

export default function PhotoshootManager({
  bookings: initialBookings,
  packages: initialPackages,
}: {
  bookings: Booking[];
  packages: PhotoPackage[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>('new');
  const [bookings, setBookings] = useState(initialBookings);
  const [packages, setPackages] = useState(initialPackages);
  const [error, setError] = useState('');

  // Keep in step with fresh server data after a refresh.
  useEffect(() => setBookings(initialBookings), [initialBookings]);
  useEffect(() => setPackages(initialPackages), [initialPackages]);

  // ── new booking ──
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('');
  const [creating, setCreating] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const activePackages = packages.filter((p) => p.active);

  const createBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim() || !packageId) {
      setError('Fill in the name, number and package.');
      return;
    }
    setCreating(true);
    const { data, error: err } = await supabase.rpc('admin_create_photoshoot_booking', {
      p_name: name,
      p_phone: phone,
      p_package_id: packageId,
    });
    setCreating(false);
    if (err || !data) {
      setError('Something went wrong. Please try again.');
      return;
    }
    const result = data as { ok: boolean; code?: string; error?: string };
    if (!result.ok || !result.code) {
      setError(ERRORS[result.error ?? ''] ?? 'Something went wrong. Please try again.');
      return;
    }
    const pkgName = packages.find((p) => p.id === packageId)?.name ?? '';
    setTicket({ name: name.trim(), code: result.code, packageName: pkgName });
    setName('');
    setPhone('');
    setPackageId('');
    router.refresh();
  };

  // ── bookings ──
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');

  const counts = useMemo(() => {
    const c = { all: bookings.length, confirmed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      c[b.status] += 1;
    });
    return c;
  }, [bookings]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return bookings.filter(
      (b) =>
        (filter === 'all' || b.status === filter) &&
        (!q ||
          b.code.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          (digits.length > 0 && b.phone.includes(digits)))
    );
  }, [bookings, query, filter]);

  const setBookingStatus = async (id: string, status: BookingStatus) => {
    setError('');
    const before = bookings;
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    const { error: err } = await supabase.from('photoshoot_bookings').update({ status }).eq('id', id);
    if (err) {
      setBookings(before);
      setError('Could not update that booking. Please try again.');
    }
  };

  const removeBooking = async (b: Booking) => {
    if (!window.confirm(`Delete ${b.code} (${b.name})? This frees their phone number to book again.`)) return;
    setError('');
    const before = bookings;
    setBookings((prev) => prev.filter((x) => x.id !== b.id));
    const { error: err } = await supabase.from('photoshoot_bookings').delete().eq('id', b.id);
    if (err) {
      setBookings(before);
      setError('Could not delete that booking. Please try again.');
    } else {
      router.refresh();
    }
  };

  // ── packages ──
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [savingPkg, setSavingPkg] = useState(false);
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // '' -> null (no price). Returns undefined if the text isn't a valid price.
  const parsePrice = (text: string): number | null | undefined => {
    const t = text.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const addPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const price = parsePrice(pPrice);
    if (!pName.trim()) return setError('Enter a package name.');
    if (price === undefined) return setError('Enter the price as a number, e.g. 150.');

    setSavingPkg(true);
    const nextOrder = packages.reduce((m, p) => Math.max(m, p.sort_order), 0) + 1;
    const { data, error: err } = await supabase
      .from('photoshoot_packages')
      .insert({ name: pName.trim(), price, sort_order: nextOrder })
      .select('id, name, price, active, sort_order, created_at')
      .single();
    setSavingPkg(false);
    if (err || !data) return setError('Could not add the package. Please try again.');
    setPackages((prev) => [...prev, data as PhotoPackage]);
    setPName('');
    setPPrice('');
  };

  const startEdit = (p: PhotoPackage) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditPrice(p.price === null ? '' : String(p.price));
  };

  const saveEdit = async (p: PhotoPackage) => {
    setError('');
    const price = parsePrice(editPrice);
    if (!editName.trim()) return setError('Enter a package name.');
    if (price === undefined) return setError('Enter the price as a number, e.g. 150.');
    const before = packages;
    setPackages((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: editName.trim(), price } : x)));
    setEditId('');
    const { error: err } = await supabase
      .from('photoshoot_packages')
      .update({ name: editName.trim(), price })
      .eq('id', p.id);
    if (err) {
      setPackages(before);
      setError('Could not save that package. Please try again.');
    }
  };

  const toggleActive = async (p: PhotoPackage) => {
    setError('');
    const before = packages;
    setPackages((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)));
    const { error: err } = await supabase.from('photoshoot_packages').update({ active: !p.active }).eq('id', p.id);
    if (err) {
      setPackages(before);
      setError('Could not update that package. Please try again.');
    }
  };

  const removePackage = async (p: PhotoPackage) => {
    if (!window.confirm(`Delete "${p.name}"? Past bookings keep their package name and price.`)) return;
    setError('');
    const before = packages;
    setPackages((prev) => prev.filter((x) => x.id !== p.id));
    const { error: err } = await supabase.from('photoshoot_packages').delete().eq('id', p.id);
    if (err) {
      setPackages(before);
      setError('Could not delete that package. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display font-bold text-lg text-navy">Photoshoot Bookings</h2>
        <button type="button" onClick={() => router.refresh()} className={btn}>
          Refresh
        </button>
      </div>
      <p className="font-body text-sm text-g600 mb-4">
        Enter a student after they pay. A ticket opens that you can share or screenshot. At the shoot, check that the code and name match.
      </p>

      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {(
          [
            ['new', 'New booking'],
            ['bookings', `Bookings (${counts.all})`],
            ['packages', 'Packages'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setError('');
            }}
            className={`px-2 py-2 border font-condensed font-bold text-[11px] uppercase tracking-wide rounded-none ${
              tab === key ? 'bg-navy text-white border-navy' : 'bg-white text-navy border-[#D8D3C6]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="font-body text-sm text-red-600 mb-3">{error}</p>}

      {/* ───────── NEW BOOKING ───────── */}
      {tab === 'new' && (
        <div>
          {activePackages.length === 0 ? (
            <div className="bg-white border border-g100 rounded-none p-4 text-center">
              <p className="font-body text-sm text-g600 mb-3">Add at least one package before creating bookings.</p>
              <button type="button" onClick={() => setTab('packages')} className={btn}>
                Go to Packages
              </button>
            </div>
          ) : (
            <form onSubmit={createBooking} className="bg-white border border-g100 rounded-none p-4 mb-4" noValidate>
              <label htmlFor="b-name" className={labelCls}>Student&apos;s full name</label>
              <input
                id="b-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputCls} mb-3`}
                maxLength={80}
              />

              <label htmlFor="b-phone" className={labelCls}>Contact number</label>
              <input
                id="b-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputCls} mb-3`}
                maxLength={20}
              />

              <label htmlFor="b-pkg" className={labelCls}>Package</label>
              <select
                id="b-pkg"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className={`${inputCls} mb-4`}
              >
                <option value="">Choose a package</option>
                {activePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.price !== null ? ` · ${formatPrice(p.price)}` : ''}
                  </option>
                ))}
              </select>

              <button type="submit" disabled={creating} className={goldBtn}>
                {creating ? 'Creating…' : 'Create booking'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ───────── BOOKINGS ───────── */}
      {tab === 'bookings' && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(['all', 'confirmed', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 border font-condensed font-bold text-xs uppercase tracking-wide rounded-none ${
                  filter === f ? 'bg-navy text-white border-navy' : 'bg-white text-navy border-[#D8D3C6]'
                }`}
              >
                {f} ({counts[f]})
              </button>
            ))}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. JM2K1, Ama, 0248111310"
            className={`${inputCls} mb-4`}
          />

          {shown.length === 0 ? (
            <p className="font-body text-sm text-g600 text-center py-10">
              {bookings.length === 0 ? 'No bookings yet.' : 'No booking matches.'}
            </p>
          ) : (
            <div className="space-y-2">
              {shown.map((b) => (
                <div key={b.id} className="bg-white border border-g100 rounded-none p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display font-bold text-xl text-navy tracking-[0.08em] leading-none">
                        {b.code}
                      </div>
                      <div className="font-condensed font-bold text-sm text-navy mt-1.5 truncate">{b.name}</div>
                      <div className="font-body text-xs text-g600 mt-0.5">
                        {b.package_name}
                        {b.package_price !== null ? ` (${formatPrice(b.package_price)})` : ''} ·{' '}
                        {new Date(b.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 border px-2 py-0.5 font-condensed font-bold text-[10px] uppercase tracking-wide ${
                        b.status === 'confirmed'
                          ? 'bg-[#E9F2EA] text-[#2E6B3A] border-[#C9DECB]'
                          : 'bg-[#F6EBEA] text-[#9B3B33] border-[#E3C9C6]'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setTicket({ name: b.name, code: b.code, packageName: b.package_name })}
                      className={btn}
                    >
                      Ticket
                    </button>
                    <a href={`tel:${b.phone}`} className={btn}>
                      Call {b.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => setBookingStatus(b.id, b.status === 'confirmed' ? 'cancelled' : 'confirmed')}
                      className={btn}
                    >
                      {b.status === 'confirmed' ? 'Cancel' : 'Restore'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBooking(b)}
                      className="ml-auto font-condensed font-bold text-xs uppercase tracking-wide text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────── PACKAGES ───────── */}
      {tab === 'packages' && (
        <div>
          <form onSubmit={addPackage} className="bg-white border border-g100 rounded-none p-4 mb-4" noValidate>
            <label htmlFor="p-name" className={labelCls}>Package name</label>
            <input
              id="p-name"
              type="text"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="e.g. Standard"
              className={`${inputCls} mb-3`}
              maxLength={60}
            />
            <label htmlFor="p-price" className={labelCls}>Price in GH₵ (optional)</label>
            <input
              id="p-price"
              type="text"
              inputMode="decimal"
              value={pPrice}
              onChange={(e) => setPPrice(e.target.value)}
              placeholder="150"
              className={`${inputCls} mb-4`}
              maxLength={10}
            />
            <button type="submit" disabled={savingPkg} className={goldBtn}>
              {savingPkg ? 'Adding…' : 'Add package'}
            </button>
          </form>

          {packages.length === 0 ? (
            <p className="font-body text-sm text-g600 text-center py-10">No packages yet.</p>
          ) : (
            <div className="space-y-2">
              {packages.map((p) => (
                <div key={p.id} className="bg-white border border-g100 rounded-none p-3.5">
                  {editId === p.id ? (
                    <div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label="Package name"
                        className={`${inputCls} mb-2`}
                        maxLength={60}
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Price in GH₵"
                        aria-label="Price"
                        className={`${inputCls} mb-3`}
                        maxLength={10}
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveEdit(p)} className={btn}>
                          Save
                        </button>
                        <button type="button" onClick={() => setEditId('')} className={btn}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-condensed font-bold text-sm text-navy truncate">{p.name}</div>
                          <div className="font-body text-xs text-g600 mt-0.5">
                            {p.price !== null ? formatPrice(p.price) : 'No price set'}
                          </div>
                        </div>
                        <span
                          className={`flex-shrink-0 border px-2 py-0.5 font-condensed font-bold text-[10px] uppercase tracking-wide ${
                            p.active
                              ? 'bg-[#E9F2EA] text-[#2E6B3A] border-[#C9DECB]'
                              : 'bg-[#F0EEE8] text-g600 border-[#D8D3C6]'
                          }`}
                        >
                          {p.active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button type="button" onClick={() => startEdit(p)} className={btn}>
                          Edit
                        </button>
                        <button type="button" onClick={() => toggleActive(p)} className={btn}>
                          {p.active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePackage(p)}
                          className="ml-auto font-condensed font-bold text-xs uppercase tracking-wide text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {ticket && <TicketScreen ticket={ticket} onClose={() => setTicket(null)} />}
    </div>
  );
}
