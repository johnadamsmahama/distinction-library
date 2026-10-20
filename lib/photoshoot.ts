// Shared helpers for the matriculation photoshoot bookings.
// Packages are NOT defined here — they live in the database and are managed
// from Admin -> Photoshoot Bookings -> Packages.

export const CONTACT_PHONE_DISPLAY = '+233 248 111 310';
export const CONTACT_PHONE_LINK = '+233248111310';

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? '';

// The message you send (and the card shows) after a booking.
export const confirmationMessage = (fullName: string, code: string) =>
  `Hello ${firstName(fullName)}\nYour Matriculation Photoshoot Booking is confirmed.\nYour code is ${code}`;

export const formatPrice = (price: number | null | undefined) =>
  price === null || price === undefined ? '' : `GH₵${Number(price).toLocaleString('en-GH')}`;

// 0248111310 or +233 24 811 1310 -> 233248111310 (for wa.me links)
export const waNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('233') ? digits : `233${digits.replace(/^0/, '')}`;
};

// Opens a WhatsApp chat with the number, message already typed.
export const waLink = (text: string, phone?: string) =>
  `https://wa.me/${phone ? waNumber(phone) : ''}?text=${encodeURIComponent(text)}`;

// The same number typed different ways (0248111310, 024 811 1310,
// +233 24 811 1310) gives the same key: its last 9 digits. Matches the
// unique index in the database. Returns '' if it isn't a full Ghana number.
export const phoneKey = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  const ok =
    (digits.length === 10 && digits.startsWith('0')) ||
    (digits.length === 12 && digits.startsWith('233')) ||
    digits.length === 9;
  return ok ? digits.slice(-9) : '';
};

// Shown on the ticket (from the flyer).
export const BOOKING_NUMBERS = '0248111310 / 0596890553';
