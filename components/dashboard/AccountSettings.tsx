'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const LEVELS = ['100', '200', '300', '400'];

export default function AccountSettings({
  userId,
  userEmail,
  emailConfirmed,
  initialFullName,
  initialDepartment,
  initialLevel,
  initialLeaderboardOptOut,
}: {
  userId: string;
  userEmail: string;
  emailConfirmed: boolean;
  initialFullName: string | null;
  initialDepartment: string | null;
  initialLevel: string | null;
  initialLeaderboardOptOut: boolean;
}) {
  const router = useRouter();

  // --- Profile fields (name, department, level / "programme") ---
  const [fullName, setFullName] = useState(initialFullName ?? '');
  const [department, setDepartment] = useState(initialDepartment ?? '');
  const [level, setLevel] = useState(initialLevel ?? '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);

    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    setProfileLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        department: department.trim() || null,
        level: level || null,
      })
      .eq('id', userId);

    setProfileLoading(false);

    if (updateErr) {
      setProfileError(updateErr.message);
      return;
    }
    setProfileSaved(true);
    router.refresh();
  };

  // --- Change email ---
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSent(false);

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setEmailLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);

    if (updateErr) {
      setEmailError(updateErr.message);
      return;
    }
    setEmailSent(true);
    setNewEmail('');
  };

  // --- Change password ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (updateErr) {
      setPasswordError(updateErr.message);
      return;
    }
    setPasswordSaved(true);
    setNewPassword('');
    setConfirmPassword('');
  };

  // --- Privacy: leaderboard visibility opt-out ---
  const [leaderboardOptOut, setLeaderboardOptOut] = useState(initialLeaderboardOptOut);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  const togglePrivacy = async () => {
    const next = !leaderboardOptOut;
    setLeaderboardOptOut(next);
    setPrivacyLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ leaderboard_opt_out: next })
      .eq('id', userId);
    setPrivacyLoading(false);

    if (updateErr) {
      alert(updateErr.message);
      setLeaderboardOptOut(!next);
    }
  };

  // --- Account deletion / data export requests ---
  // These file a support ticket for staff to action manually rather than
  // performing an irreversible delete or generating an export directly from
  // the client — spec 10.1 phrases this as a "request", not a self-serve
  // action.
  const [requestLoading, setRequestLoading] = useState<'delete' | 'export' | null>(null);
  const [requestSent, setRequestSent] = useState<'delete' | 'export' | null>(null);

  const submitRequest = async (kind: 'delete' | 'export') => {
    const subject = kind === 'delete' ? 'Account Deletion Request' : 'Data Export Request';
    const confirmMsg =
      kind === 'delete'
        ? 'This will send a request to our team to delete your account and data. This cannot be undone once processed. Continue?'
        : 'This will send a request to our team to prepare an export of your data. Continue?';

    if (!confirm(confirmMsg)) return;

    setRequestLoading(kind);
    const supabase = createClient();
    const { error: insertErr } = await supabase.from('support_tickets').insert({
      user_id: userId,
      name: fullName.trim() || 'Student',
      student_email: userEmail,
      subject,
      message:
        kind === 'delete'
          ? 'I would like to request deletion of my account and associated data.'
          : 'I would like to request an export of my data.',
    });
    setRequestLoading(null);

    if (insertErr) {
      alert(insertErr.message);
      return;
    }
    setRequestSent(kind);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <form onSubmit={saveProfile} className="bg-white border border-g100 rounded-2xl p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Profile</h2>
        <div>
          <label className={labelClass}>Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Ama Serwaa"
          />
        </div>
        <div>
          <label className={labelClass}>Department / Programme</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClass}
            placeholder="e.g. Marketing"
          />
        </div>
        <div>
          <label className={labelClass}>Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
            <option value="">Not set</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
        </div>
        {profileError && <p className="font-body text-sm text-red-500">{profileError}</p>}
        {profileSaved && <p className="font-body text-sm text-green-600">Saved successfully.</p>}
        <button
          type="submit"
          disabled={profileLoading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {profileLoading ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Email verification status + change email */}
      <form onSubmit={changeEmail} className="bg-white border border-g100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg text-navy">Email</h2>
          <span
            className={`font-condensed font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
              emailConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {emailConfirmed ? 'Verified' : 'Not verified'}
          </span>
        </div>
        <div>
          <label className={labelClass}>Current UPSA email</label>
          <input type="text" value={userEmail} disabled className={`${inputClass} bg-off-white text-g600`} />
        </div>
        <div>
          <label className={labelClass}>New email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={inputClass}
            placeholder="you@st.upsamail.edu.gh"
          />
        </div>
        {emailError && <p className="font-body text-sm text-red-500">{emailError}</p>}
        {emailSent && (
          <p className="font-body text-sm text-green-600">
            Check both your old and new inbox to confirm the change.
          </p>
        )}
        <button
          type="submit"
          disabled={emailLoading}
          className="w-full bg-white border border-navy text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-navy hover:text-white transition-colors disabled:opacity-60"
        >
          {emailLoading ? 'Sending…' : 'Change email'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={changePassword} className="bg-white border border-g100 rounded-2xl p-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Password</h2>
        <div>
          <label className={labelClass}>New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className={labelClass}>Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {passwordError && <p className="font-body text-sm text-red-500">{passwordError}</p>}
        {passwordSaved && <p className="font-body text-sm text-green-600">Password updated.</p>}
        <button
          type="submit"
          disabled={passwordLoading}
          className="w-full bg-white border border-navy text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-navy hover:text-white transition-colors disabled:opacity-60"
        >
          {passwordLoading ? 'Updating…' : 'Change password'}
        </button>
      </form>

      {/* Privacy */}
      <div className="bg-white border border-g100 rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg text-navy mb-4">Privacy</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={leaderboardOptOut}
            onChange={togglePrivacy}
            disabled={privacyLoading}
            className="mt-1 w-4 h-4 accent-gold flex-shrink-0"
          />
          <span>
            <span className="font-condensed font-semibold text-sm text-g800 block">
              Hide me from the Leaderboard
            </span>
            <span className="font-body text-xs text-g600">
              Your uploads still count, but your name won't appear in the public rankings.
            </span>
          </span>
        </label>
      </div>

      {/* Account deletion / data export */}
      <div className="bg-white border border-g100 rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg text-navy mb-1">Your data</h2>
        <p className="font-body text-xs text-g600 mb-4">
          These are handled as requests reviewed by our team, not instant actions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => submitRequest('export')}
            disabled={requestLoading !== null}
            className="flex-1 font-condensed font-bold text-xs uppercase px-4 py-3 rounded-lg border border-g100 hover:border-gold transition-colors disabled:opacity-60"
          >
            {requestLoading === 'export'
              ? 'Sending…'
              : requestSent === 'export'
              ? 'Export requested ✓'
              : 'Request data export'}
          </button>
          <button
            onClick={() => submitRequest('delete')}
            disabled={requestLoading !== null}
            className="flex-1 font-condensed font-bold text-xs uppercase px-4 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {requestLoading === 'delete'
              ? 'Sending…'
              : requestSent === 'delete'
              ? 'Deletion requested ✓'
              : 'Request account deletion'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
