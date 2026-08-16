'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  getPublishedEvents,
  splitUpcomingPast,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  type DLEvent,
} from '@/lib/events-data'

type ViewMode = 'list' | 'calendar'

export default function EventsView() {
  const [events, setEvents] = useState<DLEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [monthCursor, setMonthCursor] = useState(new Date())

  useEffect(() => {
    getPublishedEvents().then((data) => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  const { upcoming, past } = useMemo(() => splitUpcomingPast(events), [events])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-body text-[11px] font-semibold tracking-[0.14em] uppercase text-gold mb-2">
            Essentials
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy">Events &amp; Sessions</h1>
          <p className="font-body text-sm text-g600 mt-1">
            Workshops, revision sessions, and career events.
          </p>
        </div>

        <div className="flex rounded-xl bg-white border border-g100 p-1 self-start">
          {(['list', 'calendar'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`rounded-lg px-4 py-1.5 font-body text-sm font-semibold capitalize transition-colors ${
                view === mode ? 'bg-navy text-[#E4C878]' : 'text-g600 hover:text-navy'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-g100 bg-[#EAF3ED] py-16 text-center">
          <p className="font-body text-g600">No events scheduled yet</p>
          <p className="mt-1 font-body text-sm text-g600/70">
            Check back soon — new sessions are added regularly.
          </p>
        </div>
      ) : view === 'list' ? (
        <ListView upcoming={upcoming} past={past} />
      ) : (
        <CalendarView
          events={events}
          monthCursor={monthCursor}
          setMonthCursor={setMonthCursor}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}
    </div>
  )
}

/* ---------- Shared event row: date node + card, matching the Career Resources rail ---------- */

function EventRow({ event }: { event: DLEvent }) {
  const start = new Date(event.start_time)
  const color = EVENT_TYPE_COLORS[event.event_type]

  return (
    <div className="relative flex gap-4">
      <div className="z-10 flex w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-navy border-[1.5px] border-gold py-2 shadow-sm">
        <span className="font-body text-[10px] font-bold uppercase tracking-wide text-[#E4C878] opacity-85">
          {start.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="font-display text-lg font-semibold text-white">{start.getDate()}</span>
      </div>

      <div className="min-w-0 flex-1 bg-white border border-g100 border-l-[3px] border-l-navy rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          {event.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt=""
              className="w-9 h-9 rounded-[9px] object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-[9px] bg-navy flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-[#E4C878]" fill="none" strokeWidth={1.8}>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
            </div>
          )}
          <span
            className="inline-block rounded-full px-2.5 py-0.5 font-body text-[10.5px] font-bold"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
        </div>

        <h3 className="font-display font-semibold text-lg text-navy truncate">{event.title}</h3>
        <p className="mt-1 font-body text-sm text-g600 line-clamp-2 leading-relaxed">{event.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-xs font-semibold text-gold">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-gold" fill="none" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            {event.end_time &&
              ` – ${new Date(event.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-gold" fill="none" strokeWidth={2}>
                <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- List view ---------- */

function EventGroup({ events, showRail = true }: { events: DLEvent[]; showRail?: boolean }) {
  return (
    <div className="relative">
      {showRail && events.length > 1 && (
        <div className="absolute left-[27px] top-2 bottom-10 w-px bg-gradient-to-b from-gold to-g100" />
      )}
      <div className="space-y-4">
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  )
}

function ListView({ upcoming, past }: { upcoming: DLEvent[]; past: DLEvent[] }) {
  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#EAF3ED] via-[#DCEDE3] to-[#EAF3ED] p-4 sm:p-6 space-y-8">
      <div>
        <h2 className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-gold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="font-body text-sm text-g600">No upcoming events right now.</p>
        ) : (
          <EventGroup events={upcoming} />
        )}
      </div>
      {past.length > 0 && (
        <div className="opacity-70">
          <h2 className="mb-4 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-g600">Past</h2>
          <EventGroup events={past} />
        </div>
      )}
    </div>
  )
}

/* ---------- Calendar view ---------- */

function CalendarView({
  events,
  monthCursor,
  setMonthCursor,
  selectedDate,
  setSelectedDate,
}: {
  events: DLEvent[]
  monthCursor: Date
  setMonthCursor: (d: Date) => void
  selectedDate: Date | null
  setSelectedDate: (d: Date | null) => void
}) {
  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDay = useMemo(() => {
    const map: Record<number, DLEvent[]> = {}
    events.forEach((e) => {
      const d = new Date(e.start_time)
      if (d.getFullYear() === year && d.getMonth() === month) {
        map[d.getDate()] = [...(map[d.getDate()] || []), e]
      }
    })
    return map
  }, [events, year, month])

  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const selectedDayEvents = selectedDate ? eventsByDay[selectedDate.getDate()] || [] : []

  return (
    <div className="rounded-3xl bg-gradient-to-b from-[#EAF3ED] via-[#DCEDE3] to-[#EAF3ED] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          className="rounded-lg px-3 py-1 text-navy hover:bg-white/60 font-body"
        >
          ←
        </button>
        <h3 className="font-display font-semibold text-navy">
          {monthCursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          className="rounded-lg px-3 py-1 text-navy hover:bg-white/60 font-body"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-body text-xs font-medium text-g600">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const hasEvents = !!eventsByDay[day]
          const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(new Date(year, month, day))}
              className={`relative aspect-square rounded-lg font-body text-sm transition-colors ${
                isSelected
                  ? 'bg-navy text-white'
                  : hasEvents
                  ? 'bg-gold/15 font-semibold text-navy'
                  : 'text-g600 hover:bg-white/60'
              }`}
            >
              {day}
              {hasEvents && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h4 className="mb-3 font-body text-sm font-semibold text-g600">
            {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h4>
          {selectedDayEvents.length === 0 ? (
            <p className="font-body text-sm text-g600">No events on this day.</p>
          ) : (
            <div className="space-y-4">
              {selectedDayEvents.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
