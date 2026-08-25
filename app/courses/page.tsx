import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCourseOptions } from '@/lib/papers-data';

export default async function CoursesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const courses = await getCourseOptions(supabase);

  const byDepartment = new Map<string, typeof courses>();
  courses.forEach((c) => {
    const list = byDepartment.get(c.department) ?? [];
    list.push(c);
    byDepartment.set(c.department, list);
  });
  const departments = Array.from(byDepartment.keys()).sort();

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Courses</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Browse resources by course, or head to the{' '}
        <Link href="/papers" className="text-gold hover:underline">
          full Library search
        </Link>{' '}
        instead.
      </p>

      {departments.length === 0 ? (
        <p className="font-body text-sm text-g600 text-center py-16">No courses set up yet.</p>
      ) : (
        <div className="space-y-8">
          {departments.map((dept) => (
            <div key={dept}>
              <h2 className="font-condensed font-bold text-xs uppercase tracking-wide text-g600 mb-3">{dept}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {byDepartment
                  .get(dept)!
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((c) => (
                    <Link
                      key={c.id}
                      href={`/courses/${c.id}`}
                      className="bg-white border border-g100 rounded-none px-4 py-3.5 hover:border-gold transition-colors"
                    >
                      <div className="font-condensed font-bold text-sm text-navy">{c.code}</div>
                      <div className="font-body text-xs text-g600 truncate">
                        {c.name} · Level {c.level}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
