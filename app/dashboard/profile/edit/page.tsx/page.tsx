'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EditProfilePage({
  initialFullName,
}: {
  initialFullName: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialFullName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in.');
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    setSaving(false);

    if (profileError || authError) {
      setError('Something went wrong saving your changes. Please try again.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="font-display font-bold text-2xl text-navy mb-6">
        Edit Profile
      </h1>

      <label className="block font-body text-sm text-g600 mb-1">
        Full Name
      </label>
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
        placeholder="Your full name"
      />

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-gold text-navy font-condensed font-bold text-xs uppercase px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
