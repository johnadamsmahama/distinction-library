import EventsView from '@/components/success-centre/EventsView'
export const metadata = {
  title: 'Events & Sessions | Distinction Library',
}
export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <EventsView />
    </div>
  )
}
