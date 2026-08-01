type ViewedItem = {
  resource_type: 'paper' | 'material';
  resource_id: string;
  course_id: string | null;
  course_code: string | null;
  title: string;
  viewed_at: string;
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function MyRecentViews({ items }: { items: ViewedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg text-navy mb-4">Recently Viewed</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${item.resource_type}-${item.resource_id}`}
            className="flex items-center justify-between py-2 border-b border-g100 last:border-0"
          >
            <div className="min-w-0">
              <div className="font-condensed font-semibold text-sm text-g800 truncate">{item.title}</div>
              <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">
                {item.resource_type === 'paper' ? 'Past Paper' : 'Study Material'}
              </div>
            </div>
            <span className="flex-shrink-0 ml-3 font-body text-xs text-g600">{timeAgo(item.viewed_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
