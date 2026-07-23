type RecentPaper = {
  id: string;
  year: number;
  exam_type: string;
  created_at: string;
  courses: { code: string; name: string } | null;
};

type RecentMaterial = {
  id: string;
  title: string;
  content_type: string;
  created_at: string;
  courses: { code: string; name: string } | null;
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function RecentActivity({
  papers,
  materials,
}: {
  papers: RecentPaper[];
  materials: RecentMaterial[];
}) {
  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg text-navy mb-5">Recently added</h2>

      {papers.length === 0 && materials.length === 0 ? (
        <p className="font-body text-sm text-g600">Nothing has been approved yet — check back soon.</p>
      ) : (
        <div className="space-y-2">
          {papers.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-g100 last:border-0">
              <div className="min-w-0">
                <div className="font-condensed font-semibold text-sm text-g800 truncate">
                  {p.courses?.code} — {p.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} {p.year}
                </div>
                <div className="font-condensed text-[10px] uppercase tracking-wide text-gold">Past Paper</div>
              </div>
              <span className="flex-shrink-0 ml-3 font-body text-xs text-g600">{timeAgo(p.created_at)}</span>
            </div>
          ))}
          {materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-g100 last:border-0">
              <div className="min-w-0">
                <div className="font-condensed font-semibold text-sm text-g800 truncate">
                  {m.courses?.code} — {m.title}
                </div>
                <div className="font-condensed text-[10px] uppercase tracking-wide text-gold">Study Material</div>
              </div>
              <span className="flex-shrink-0 ml-3 font-body text-xs text-g600">{timeAgo(m.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
