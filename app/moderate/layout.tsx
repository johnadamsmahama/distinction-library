import AppShell from '@/components/dashboard/AppShell';

export default function ModerateLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
