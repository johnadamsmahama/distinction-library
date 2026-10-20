import { createClient } from '@/lib/supabase/server';
import PhotoshootManager from '@/components/admin/PhotoshootManager';

export default async function AdminPhotoshootPage() {
  const supabase = createClient();

  const [bookingsRes, packagesRes] = await Promise.all([
    supabase
      .from('photoshoot_bookings')
      .select('id, code, name, phone, package_name, package_price, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('photoshoot_packages')
      .select('id, name, price, active, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  return (
    <PhotoshootManager
      bookings={(bookingsRes.data as any) ?? []}
      packages={(packagesRes.data as any) ?? []}
    />
  );
}
