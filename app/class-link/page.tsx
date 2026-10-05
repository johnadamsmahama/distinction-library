export default function ClassLinkPage() {
  return (
    <div className="min-h-screen bg-[#EEF2F7] font-body flex items-center justify-center px-4">
      <div className="max-w-[380px] w-full bg-white border-t-4 border-[#5B87B8] shadow-[0_2px_12px_rgba(31,53,80,0.08)] p-8">
        <p className="text-[22px] font-bold text-[#1F3550] mb-3">Form closed</p>
        <p className="text-[14px] text-[#2F3B4C] leading-relaxed mb-3">
          The list has been submitted and classes have been assigned.
        </p>
        <p className="text-[14px] text-[#6B7A8F] leading-relaxed mb-3">
          If you haven&apos;t been placed in a class, visit LBC110 with your proof of
          registration and you will be assigned one. You can also contact John Adams
          Mahama on{' '}
          <a href="tel:+233248111310" className="text-[#2F5A8A] font-bold underline">
            +233 248 111 310
          </a>{' '}
          (call or WhatsApp).
        </p>
        <p className="text-[14px] text-[#6B7A8F] leading-relaxed">Thank you.</p>
      </div>
    </div>
  );
}
