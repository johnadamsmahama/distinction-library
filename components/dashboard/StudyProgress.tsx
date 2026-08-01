import Link from 'next/link';

type ProgressItem = { courseId: string; courseCode: string; viewed: number; total: number };

export default function StudyProgress({ items }: { items: ProgressItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg text-navy mb-1">Study Progress</h2>
      <p className="font-body text-xs text-g600 mb-4">
        Resources you've opened out of everything approved for each course.
      </p>
      <div className="space-y-4">
        {items.slice(0, 5).map((item) => {
          const pct = Math.min(100, Math.round((item.viewed / item.total) * 100));
          return (
            <Link key={item.courseId} href={`/courses/${item.courseId}`} className="block group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-condensed font-bold text-sm text-navy group-hover:text-gold transition-colors">
                  {item.courseCode}
                </span>
                <span className="font-body text-xs text-g600">
                  {item.viewed} / {item.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-g100 overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
