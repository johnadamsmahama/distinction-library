// app/buy-data/layout.tsx

import BackToDashboard from '@/components/shared/BackToDashboard';

export default function BuyDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 pt-6 pb-16">
      <BackToDashboard />
      {children}
    </div>
  );
}
