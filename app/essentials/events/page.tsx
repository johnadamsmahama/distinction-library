import EventsView from '@/components/success-centre/EventsView'
export const metadata = {
  title: 'Events & Sessions | Distinction Library',
}
export default function EventsPage() {
  return (
    // No min-h-screen here: this page already sits under the top bar inside
    // the app shell, so a full-screen height on top of it left a blank strip
    // to scroll into.
    <div className="bg-[#F7F8FC]">
      <EventsView />
    </div>
  )
}
