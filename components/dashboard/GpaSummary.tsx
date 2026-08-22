import Link from 'next/link';

export interface GpaSummaryData {
  hasSemesters: boolean;
  activeSemesterLabel: string | null;
  releasedGpa: number;
  projectedGpa: number;
  releasedCount: number;
  totalCount: number;
}

export function GpaSummary({ summary }: { summary: GpaSummaryData }) {
  return (
    <div className="bg-white border border-g100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-lg text-navy">GPA Calculator</h2>
        <Link
          href="/dashboard/gpa-calculator"
          className="font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:underline"
        >
          Open →
        </Link>
      </div>

      {!summary.hasSemesters ? (
        <p className="font-body text-sm text-g600">
          Track your GPA as results release, and test hypothetical grades for
          courses still pending. Start your first semester to see it here.
        </p>
      ) : (
        <div>
          <div className="font-condensed text-[10px] uppercase tracking-wide text-g600 mb-3">
            {summary.activeSemesterLabel}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center mb-4">
            <div>
              <div className="font-display font-bold text-2xl text-navy">
                {summary.releasedGpa.toFixed(2)}
              </div>
              <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">
                Released GPA
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-navy">
                {summary.projectedGpa.toFixed(2)}
              </div>
              <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">
                Projected GPA
              </div>
            </div>
          </div>
          <div className="w-full bg-g100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gold h-full rounded-full transition-all"
              style={{
                width: `${summary.totalCount > 0 ? (summary.releasedCount / summary.totalCount) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="font-body text-xs text-g500 mt-2">
            {summary.releasedCount} of {summary.totalCount} results out
          </div>
        </div>
      )}
    </div>
  );
}
