import { createClient } from '@/lib/supabase/server';
import BroadcastForm from '@/components/admin/BroadcastForm';

export default async function AdminBroadcastPage() {
  const supabase = createClient();

  const { data: students } = await supabase
    .from('profiles')
    .select('department, level')
    .eq('role', 'student');

  const departments = Array.from(new Set((students ?? []).map((s) => s.department).filter(Boolean))).sort() as string[];
  const levels = Array.from(new Set((students ?? []).map((s) => s.level).filter(Boolean))).sort() as string[];

  return (
    <div>
      <h2 className="font-display font-bold text-lg text-navy mb-1">Broadcast Notification</h2>
      <p className="font-body text-sm text-g600 mb-6">
        Sends an in-app notification to every matching student at once. There's no undo, so
        double-check the audience and message before sending.
      </p>
      <BroadcastForm totalStudents={students?.length ?? 0} departments={departments} levels={levels} />
    </div>
  );
}
