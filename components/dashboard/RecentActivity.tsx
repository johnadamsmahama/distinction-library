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

type FeedItem =
  | { kind: 'paper'; data: RecentPaper }
  | { kind: 'material'; data: RecentMaterial };

const MAX_ITEMS = 4;

export default function RecentActivity({
  papers,
  materials,
}: {
  papers: RecentPaper[];
  materials: RecentMaterial[];
}) {
  const feed: FeedItem[] = [
    ...papers.map((p): FeedItem => ({ kind: 'paper', data: p })),
    ...materials.map((m): FeedItem => ({ kind: 'material', data: m })),
  ]
    .sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())
    .slice(0, MAX_ITEMS);

  return (
    <div className="relative overflow-hidden bg-white border border-g100 rounded-2xl p-6 before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(theme(colors.navy)_0.6px,transparent_0.6px)] before:bg-[length:16px_16px] before:opacity-[0.04] before:pointer-events-none">
      <div className="relative z-10">
        <h2 className="font-display font-bold text-lg text-navy mb-5">Recently added</h2>

        {feed.length === 0 ? (
          <p className="font-body text-sm text-g600">Nothing has been approved yet — check back soon.</p>
        ) : (
          <div className="space-y-2">
            {feed.map((item) =>
              item.kind === 'paper' ? (
                <div key={item.data.id} className="flex items-center justify-between py-2 border-b border-g100 last:border-0">
                  <div className="min-w-0">
                    <div className="font-condensed font-semibold text-sm text-g800 truncate">
                      {item.data.courses?.code} —{' '}
                      {item.data.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} {item.data.year}
                    </div>
                    <div className="font-condensed text-[10px] uppercase tracking-wide text-gold">Past Paper</div>
                  </div>
                  <span className="flex-shrink-0 ml-3 font-body text-xs text-g600">{timeAgo(item.data.created_at)}</span>
                </div>
              ) : (
                <div key={item.data.id} className="flex items-center justify-between py-2 border-b border-g100 last:border-0">
                  <div className="min-w-0">
                    <div className="font-condensed font-semibold text-sm text-g800 truncate">
                      {item.data.courses?.code} — {item.data.title}
                    </div>
                    <div className="font-condensed text-[10px] uppercase tracking-wide text-gold">Study Material</div>
                  </div>
                  <span className="flex-shrink-0 ml-3 font-body text-xs text-g600">{timeAgo(item.data.created_at)}</span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
