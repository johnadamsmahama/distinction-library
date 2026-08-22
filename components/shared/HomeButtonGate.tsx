'use client';

import { usePathname } from 'next/navigation';
import BackToDashboard from './BackToDashboard';

// Renders the Home button everywhere it's mounted EXCEPT on the dashboard
// home page itself, since a "Home" link pointing at the page you're
// already on is redundant/confusing.
export default function HomeButtonGate() {
  const pathname = usePathname();
  if (pathname === '/dashboard') return null;
  return <BackToDashboard />;
}
