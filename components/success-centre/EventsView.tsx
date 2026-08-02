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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0D2B5E] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2B5E]">Events & Sessions</h1>
          <p className="text-sm text-gray-500">Workshops, revision sessions, and career events</p>
        </div>
        <div className="flex rounded-lg bg-[#F7F8FC] p-1">
          {(['list', 'calendar'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                view === mode ? 'bg-[#0D2B5E] text-white shadow' : 'text-gray-500'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-[#F7F8FC] py-16 text-center">
          <p className="text-gray-500">No events scheduled yet</p>
          <p className="mt-1 text-sm text-gray-400">Check back soon — new sessions are added regularly.</p>
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

function EventCard({ event }: { event: DLEvent }) {
  const start = new Date(event.start_time)
  const color = EVENT_TYPE_COLORS[event.event_type]

  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[#F7F8FC] py-2">
        <span className="text-xs font-semibold uppercase text-[#0D2B5E]">
          {start.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="text-lg font-bold text-[#0D2B5E]">{start.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <span
          className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {EVENT_TYPE_LABELS[event.event_type]}
        </span>
        <h3 className="truncate font-semibold text-gray-900">{event.title}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{event.description}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>
            {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            {event.end_time &&
              ` – ${new Date(event.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
          {event.location && <span>📍 {event.location}</span>}
        </div>
      </div>
    </div>
  )
}

function ListView({ upcoming, past }: { upcoming: DLEvent[]; past: DLEvent[] }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#C9A02C]">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming events right now.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
      {past.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Past</h2>
          <div className="space-y-3 opacity-70">
            {past.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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

  const selectedDayEvents = selectedDate
    ? eventsByDay[selectedDate.getDate()] || []
    : []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          className="rounded-lg px-3 py-1 text-[#0D2B5E] hover:bg-[#F7F8FC]"
        >
          ←
        </button>
        <h3 className="font-semibold text-[#0D2B5E]">
          {monthCursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          className="rounded-lg px-3 py-1 text-[#0D2B5E] hover:bg-[#F7F8FC]"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
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
              className={`relative aspect-square rounded-lg text-sm transition ${
                isSelected
                  ? 'bg-[#0D2B5E] text-white'
                  : hasEvents
                  ? 'bg-[#C9A02C]/15 font-semibold text-[#0D2B5E]'
                  : 'text-gray-600 hover:bg-[#F7F8FC]'
              }`}
            >
              {day}
              {hasEvents && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#C9A02C]" />
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold text-gray-500">
            {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h4>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-gray-400">No events on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
