import Link from 'next/link'
import EventsView from '@/components/success-centre/EventsView'

export const metadata = {
  title: 'Events & Sessions | Distinction Library',
}

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <Link
          href="/success-centre"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#0D2B5E] hover:underline"
        >
          ← Back to Essentials
        </Link>
      </div>
      <EventsView />
    </div>
  )
}
