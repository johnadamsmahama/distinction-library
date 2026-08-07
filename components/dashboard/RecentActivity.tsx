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

// Chip-friendly version: returns a stacked "value / unit" pair for the badge,
// e.g. { value: '3', unit: 'days ago' } or { value: '1', unit: 'week ago' }
function chipParts(dateStr: string): { value: string; unit: string } {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return { value: '•', unit: 'today' };
  if (days === 1) return { value: '1', unit: 'day ago' };
  if (days < 7) return { value: `${days}`, unit: 'days ago' };
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return { value: '1', unit: 'week ago' };
  return { value: `${weeks}`, unit: 'weeks ago' };
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
    <div
      className="rounded-2xl p-6 border border-navy/[0.12]"
      style={{ backgroundImage: 'linear-gradient(165deg, #C3D6DC 0%, #E4EEEF 65%)' }}
    >
      <h2 className="font-display font-bold text-lg text-navy mb-4">Recently added</h2>

      {feed.length === 0 ? (
        <p className="font-body text-sm text-g600">Nothing has been approved yet — check back soon.</p>
      ) : (
        <div>
          {feed.map((item, i) => {
            const chip = chipParts(item.data.created_at);
            const title =
              item.kind === 'paper'
                ? `${item.data.courses?.code} — ${
                    item.data.exam_type === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'
                  } ${item.data.year}`
                : `${item.data.courses?.code} — ${item.data.title}`;
            const tag = item.kind === 'paper' ? 'Past Paper' : 'Study Material';

            return (
              <div
                key={item.data.id}
                className={`flex items-center gap-3.5 py-3 ${
                  i === 0 ? '' : 'border-t border-navy/[0.13]'
                }`}
              >
                <div className="flex-shrink-0 w-[42px] h-[42px] rounded-[10px] bg-navy flex flex-col items-center justify-center">
                  <div className="font-display font-bold text-sm text-white leading-none">{chip.value}</div>
                  <div className="font-condensed font-bold text-[7px] uppercase tracking-wide text-gold-light leading-[1.15] text-center mt-0.5">
                    {chip.unit.split(' ').map((word, idx) => (
                      <span key={idx} className="block">{word}</span>
                    ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-g800 text-sm font-semibold leading-[1.32] truncate">{title}</div>
                  <span className="font-condensed font-bold text-[10px] uppercase tracking-wide text-gold mt-1 block">
                    {tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
