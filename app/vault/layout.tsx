import AppShell from '@/components/dashboard/AppShell';

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
