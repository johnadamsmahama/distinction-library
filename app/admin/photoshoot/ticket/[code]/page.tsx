import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TicketScreen from '@/components/admin/TicketScreen';

// The ticket as its own page. Because it loads the booking by its code, it
// still works after a refresh, and the URL can be reopened from Bookings.
// Admin-only: the admin layout redirects anyone else, and the database
// policies only return bookings to admins.
export default async function PhotoshootTicketPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { from?: string };
}) {
  const supabase = createClient();
  const code = decodeURIComponent(params.code).trim().toUpperCase();

  const { data } = await supabase
    .from('photoshoot_bookings')
    .select('code, name, package_name')
    .eq('code', code)
    .maybeSingle();

  if (!data) notFound();

  const backHref = searchParams.from === 'bookings' ? '/admin/photoshoot?tab=bookings' : '/admin/photoshoot';

  return (
    <TicketScreen
      ticket={{ name: data.name, code: data.code, packageName: data.package_name }}
      backHref={backHref}
    />
  );
}
