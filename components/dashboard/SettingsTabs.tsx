'use client';

import { useState } from 'react';
import AccountSettings from '@/components/dashboard/AccountSettings';
import NotificationSettings from '@/components/dashboard/NotificationSettings';
import SupportForm from '@/components/support/SupportForm';

type Ticket = { id: string; subject: string; message: string; resolved: boolean; created_at: string };

const TABS = ['Account', 'Notifications', 'Support'] as const;
type Tab = (typeof TABS)[number];

export default function SettingsTabs({
  userId,
  userEmail,
  emailConfirmed,
  initialFullName,
  initialDepartment,
  initialLevel,
  initialLeaderboardOptOut,
  initialNotificationPrefs,
  initialTickets,
}: {
  userId: string;
  userEmail: string;
  emailConfirmed: boolean;
  initialFullName: string | null;
  initialDepartment: string | null;
  initialLevel: string | null;
  initialLeaderboardOptOut: boolean;
  initialNotificationPrefs: any;
  initialTickets: Ticket[];
}) {
  const [tab, setTab] = useState<Tab>('Account');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 border-b border-g100">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-condensed font-semibold text-sm px-4 py-2.5 border-b-2 transition-colors ${
              tab === t ? 'border-gold text-navy' : 'border-transparent text-g600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Account' && (
        <AccountSettings
          userId={userId}
          userEmail={userEmail}
          emailConfirmed={emailConfirmed}
          initialFullName={initialFullName}
          initialDepartment={initialDepartment}
          initialLevel={initialLevel}
          initialLeaderboardOptOut={initialLeaderboardOptOut}
        />
      )}

      {tab === 'Notifications' && (
        <NotificationSettings userId={userId} initialPrefs={initialNotificationPrefs} />
      )}

      {tab === 'Support' && (
        <SupportForm studentEmail={userEmail} defaultName={initialFullName} initialTickets={initialTickets} />
      )}
    </div>
  );
}
