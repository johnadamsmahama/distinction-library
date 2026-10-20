import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_LINK } from '@/lib/photoshoot';

// Public information page. Bookings are created by the admin once payment is
// received, so there is no form here.
export default function ClassLinkPage() {
  return (
    <div className="min-h-screen bg-[#EEF2F7] font-body flex items-center justify-center px-4">
      <div className="max-w-[380px] w-full bg-white border-t-4 border-[#5B87B8] shadow-[0_2px_12px_rgba(31,53,80,0.08)] p-8">
        <p className="text-[22px] font-bold text-[#1F3550] mb-3">Matriculation photoshoot</p>
        <p className="text-[14px] text-[#2F3B4C] leading-relaxed mb-3">
          To book, pay for your package and send your name and contact number. You will receive a booking
          code to bring on the day.
        </p>
        <p className="text-[14px] text-[#6B7A8F] leading-relaxed">
          Contact John Adams Mahama on{' '}
          <a href={`tel:${CONTACT_PHONE_LINK}`} className="text-[#2F5A8A] font-bold underline">
            {CONTACT_PHONE_DISPLAY}
          </a>{' '}
          (call or WhatsApp).
        </p>
      </div>
    </div>
  );
}
