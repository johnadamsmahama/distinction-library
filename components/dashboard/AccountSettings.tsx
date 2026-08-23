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
    <div className="space-y-4 max-w-2xl">
      {/* vault dial */}
      <div className="w-14 h-14 rounded-none mx-auto mb-2 bg-gradient-to-br from-navy to-navy-deep flex items-center justify-center shadow-[0_10px_22px_rgba(13,43,94,0.3)] relative">
        <div className="absolute inset-1.5 rounded-none border border-dashed border-gold-light/40" />
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[22px] h-[22px] stroke-gold-light">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      {/* Profile */}
      <form onSubmit={saveProfile} className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
          <h2 className={panelTitle}>Identity Record</h2>
        </div>
        <div className="space-y-3 relative">
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
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectClass}>
              <option value="">Not set</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </div>
          {profileError && <p className="font-body text-sm text-red-300">{profileError}</p>}
          {profileSaved && <p className="font-body text-sm text-green-300">Saved successfully.</p>}
          <button type="submit" disabled={profileLoading} className={btnGold}>
            {profileLoading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Email verification status + change email */}
      <form onSubmit={changeEmail} className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <path d="M4 4h16v16H4z" />
            <path d="m4 4 8 8 8-8" />
          </svg>
          <h2 className={`${panelTitle} flex-1`}>Access Email</h2>
          <span
            className={`font-condensed font-bold text-[9.5px] uppercase tracking-wide px-2 py-0.5 rounded-none border ${
              emailConfirmed
                ? 'text-green-300 bg-green-400/10 border-green-400/30'
                : 'text-amber-300 bg-amber-400/10 border-amber-400/30'
            }`}
          >
            {emailConfirmed ? '✓ Verified' : 'Not verified'}
          </span>
        </div>
        <div className="space-y-3 relative">
          <div>
            <label className={labelClass}>Current UPSA email</label>
            <input type="text" value={userEmail} disabled className={`${inputClass} opacity-55`} />
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
          {emailError && <p className="font-body text-sm text-red-300">{emailError}</p>}
          {emailSent && (
            <p className="font-body text-sm text-green-300">
              Check both your old and new inbox to confirm the change.
            </p>
          )}
          <button type="submit" disabled={emailLoading} className={btnGhost}>
            {emailLoading ? 'Sending…' : 'Change email'}
          </button>
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={changePassword} className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2 className={panelTitle}>Access Credentials</h2>
        </div>
        <div className="space-y-3 relative">
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
          {passwordError && <p className="font-body text-sm text-red-300">{passwordError}</p>}
          {passwordSaved && <p className="font-body text-sm text-green-300">Password updated.</p>}
          <button type="submit" disabled={passwordLoading} className={btnGhost}>
            {passwordLoading ? 'Updating…' : 'Change password'}
          </button>
        </div>
      </form>

      {/* Privacy */}
      <div className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7z" />
          </svg>
          <h2 className={panelTitle}>Privacy Shield</h2>
        </div>
        <div className="flex items-start gap-3 relative">
          <div className="w-[38px] h-[38px] rounded-none bg-gold-light/10 border border-gold-light/30 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px] stroke-gold-light">
              <path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-body font-semibold text-[13.5px] text-[#F0F2F8]">
              Hide me from the Leaderboard
            </div>
            <div className="font-body text-[11.5px] text-[#8593B8] mt-0.5 leading-relaxed">
              Your uploads still count, but your name won't appear in the public rankings.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={leaderboardOptOut}
            onClick={togglePrivacy}
            disabled={privacyLoading}
            className={`w-10 h-[23px] rounded-none flex-shrink-0 mt-0.5 relative transition-colors disabled:opacity-60 ${
              leaderboardOptOut ? 'bg-gold' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-[2.5px] w-[18px] h-[18px] rounded-none bg-white transition-all ${
                leaderboardOptOut ? 'left-[19px]' : 'left-[2.5px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Account deletion / data export */}
      <div className={panelClass}>
        <div className={panelTexture} />
        <div className={panelHead}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={lockIcon}>
            <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2m18 0a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2m18 0v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
          </svg>
          <h2 className={panelTitle}>Vault Requests</h2>
        </div>
        <p className="font-body text-[11.5px] text-[#8593B8] mb-3 relative leading-relaxed">
          These are handled as requests reviewed by our team, not instant actions.
        </p>
        <div className="space-y-2.5 relative">
          <div className="flex items-center justify-between bg-gold-light/5 border border-dashed border-gold-light/35 rounded-none px-3.5 py-3">
            <span className="font-body font-semibold text-[12.5px] text-[#F0F2F8]">Data Export</span>
            <button
              onClick={() => submitRequest('export')}
              disabled={requestLoading !== null}
              className="font-condensed font-bold text-[10.5px] text-gold-light border border-gold-light/40 px-3 py-1.5 rounded-none disabled:opacity-60 flex-shrink-0 ml-3"
            >
              {requestLoading === 'export' ? 'Sending…' : requestSent === 'export' ? 'Requested ✓' : 'Request'}
            </button>
          </div>
          <div className="flex items-center justify-between bg-red-500/5 border border-dashed border-red-400/35 rounded-none px-3.5 py-3">
            <span className="font-body font-semibold text-[12.5px] text-[#E28A8A]">Account Deletion</span>
            <button
              onClick={() => submitRequest('delete')}
              disabled={requestLoading !== null}
              className="font-condensed font-bold text-[10.5px] text-[#E28A8A] border border-[#E28A8A]/40 px-3 py-1.5 rounded-none disabled:opacity-60 flex-shrink-0 ml-3"
            >
              {requestLoading === 'delete' ? 'Sending…' : requestSent === 'delete' ? 'Requested ✓' : 'Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const panelClass = 'relative overflow-hidden bg-navy rounded-none p-[18px]';
const panelTexture =
  'absolute inset-0 pointer-events-none [background-image:repeating-linear-gradient(115deg,rgba(223,190,94,0.04)_0px,rgba(223,190,94,0.04)_1px,transparent_1px,transparent_12px)]';
const panelHead = 'flex items-center gap-2.5 mb-4 relative';
const panelTitle = 'font-display font-semibold text-[14.5px] text-[#F9F5E9]';
const lockIcon = 'w-[18px] h-[18px] stroke-gold-light flex-shrink-0';
const labelClass = 'block font-condensed text-[9.5px] tracking-wide uppercase text-[#8593B8] mb-1.5';
const inputClass =
  'w-full px-[11px] py-[9px] rounded-none bg-white/[0.06] border border-gold-light/25 font-body text-[13.5px] text-[#F0F2F8] placeholder:text-[#5C6785] outline-none focus:border-gold-light transition-colors';
const selectClass = `${inputClass} appearance-none`;
const btnGold =
  'w-full bg-gradient-to-br from-gold-light to-gold text-navy-deep font-condensed font-bold text-[12.5px] py-[11px] rounded-none disabled:opacity-60 transition-opacity';
const btnGhost =
  'w-full border-[1.5px] border-gold-light/40 text-gold-light font-condensed font-bold text-[12.5px] py-[11px] rounded-none disabled:opacity-60 hover:bg-gold-light/10 transition-colors';
