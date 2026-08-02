'use client';

import { useState, useMemo } from 'react';
import type { EventItem } from '@/lib/events-data';

const TYPE_LABELS: Record<string, string> = {
  workshop: 'Workshop',
  revision_session: 'Revision Session',
  career_fair: 'Career Fair',
  info_session: 'Info Session',
  other: 'Event',
};

const TYPE_COLORS: Record<string, string> = {
  workshop: 'bg-blue-50 text-blue-700',
  revision_session: 'bg-green-50 text-green-700',
  career_fair: 'bg-purple-50 text-purple-700',
  info_session: 'bg-gold/15 text-[#7A5A0E]',
  other: 'bg-g100 text-g600',
};

export default function EventsView({ events }: { events: EventItem[] }) {
  const [view, setView] = useState<'list' | 'calendar'>('list');

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <ViewBtn active={view === 'list'} onClick={() => setView('list')}>
          List
        </ViewBtn>
        <ViewBtn active={view === 'calendar'} onClick={() => setView('calendar')}>
          Calendar
        </ViewBtn>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-g100 rounded-2xl p-8 text-center">
          <p className="font-body text-sm text-g600">
            No events scheduled yet — check back soon.
          </p>
        </div>
      ) : view === 'list' ? (
        <ListView events={events} />
      ) : (
        <CalendarView events={events} />
      )}
    </div>
  );
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-condensed font-bold text-xs uppercase px-4 py-2 rounded-lg border transition-colors ${
        active ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
      }`}
    >
      {children}
    </button>
  );
}

function ListView({ events }: { events: EventItem[] }) {
  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e.id} className="bg-white border border-g100 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h2 className="font-display font-bold text-base text-navy">{e.title}</h2>
            <span
              className={`flex-shrink-0 font-condensed font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${TYPE_COLORS[e.event_type]}`}
            >
              {TYPE_LABELS[e.event_type]}
            </span>
          </div>
          <p className="font-body text-sm text-g600 mb-2">{e.description}</p>
          <div className="flex flex-wrap items-center gap-3 font-condensed text-[11px] text-g600">
            <span>{formatDateTime(e.start_time)}</span>
            {e.location && <span>· {e.location}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ events }: { events: EventItem[] }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of events) {
      const d = new Date(e.start_time);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [events]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedKey = selectedDay ? `${year}-${month}-${selectedDay}` : null;
  const selectedEvents = selectedKey ? eventsByDay[selectedKey] ?? [] : [];

  return (
    <div className="bg-white border border-g100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            setMonthOffset((m) => m - 1);
            setSelectedDay(null);
          }}
          className="font-condensed font-bold text-xs uppercase text-g600 hover:text-navy px-2 py-1"
        >
          ← Prev
        </button>
        <h3 className="font-display font-bold text-base text-navy">
          {viewDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => {
            setMonthOffset((m) => m + 1);
            setSelectedDay(null);
          }}
          className="font-condensed font-bold text-xs uppercase text-g600 hover:text-navy px-2 py-1"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center font-condensed font-bold text-[10px] uppercase text-g600 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${year}-${month}-${day}`;
          const dayEvents = eventsByDay[key] ?? [];
          const isToday =
            day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selectedDay;

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 font-body text-xs transition-colors ${
                isSelected
                  ? 'bg-gold text-navy font-bold'
                  : isToday
                    ? 'border border-gold text-navy'
                    : 'hover:bg-off-white text-g800'
              }`}
            >
              {day}
              {dayEvents.length > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-navy' : 'bg-gold'}`} />
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-5 pt-4 border-t border-g100 space-y-3">
          {selectedEvents.length === 0 ? (
            <p className="font-body text-sm text-g600">No events on this day.</p>
          ) : (
            selectedEvents.map((e) => (
              <div key={e.id}>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-display font-bold text-sm text-navy">{e.title}</h4>
                  <span
                    className={`font-condensed font-bold text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded ${TYPE_COLORS[e.event_type]}`}
                  >
                    {TYPE_LABELS[e.event_type]}
                  </span>
                </div>
                <p className="font-body text-xs text-g600 mb-1">{e.description}</p>
                <p className="font-condensed text-[11px] text-g600">
                  {formatDateTime(e.start_time)}
                  {e.location ? ` · ${e.location}` : ''}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
